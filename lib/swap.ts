/**
 * Pay Lobster Swap Module
 * Powered by 0x API for best execution across DEXs
 */

import { ethers } from 'ethers';

const ZEROX_API = 'https://base.api.0x.org';

// Common tokens on Base
const TOKENS: Record<string, { address: string; decimals: number }> = {
  ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  USDbC: { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6 },
  DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
};

export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  to: string;
  data: string;
  value: string;
  sources: Array<{ name: string; proportion: string }>;
}

export interface SwapOptions {
  from: string;       // Token symbol (ETH, USDC, etc.) or address
  to: string;         // Token symbol or address
  amount: string;     // Amount to sell (in human readable format)
  slippage?: number;  // Slippage tolerance (default 0.5%)
}

export interface SwapResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  gasUsed?: string;
}

/**
 * Resolve token symbol to address and decimals
 */
function resolveToken(tokenOrSymbol: string): { address: string; decimals: number; symbol: string } {
  const upper = tokenOrSymbol.toUpperCase();
  
  if (TOKENS[upper]) {
    return { ...TOKENS[upper], symbol: upper };
  }
  
  // Assume it's an address
  if (ethers.isAddress(tokenOrSymbol)) {
    return { address: tokenOrSymbol, decimals: 18, symbol: tokenOrSymbol.slice(0, 8) };
  }
  
  throw new Error(`Unknown token: ${tokenOrSymbol}. Supported: ${Object.keys(TOKENS).join(', ')}`);
}

/**
 * Get a swap quote from 0x API
 */
export async function getSwapQuote(options: SwapOptions): Promise<SwapQuote> {
  const fromToken = resolveToken(options.from);
  const toToken = resolveToken(options.to);
  
  // Convert amount to smallest unit
  const sellAmount = ethers.parseUnits(options.amount, fromToken.decimals).toString();
  const slippage = options.slippage || 0.5;
  
  const params = new URLSearchParams({
    sellToken: fromToken.address,
    buyToken: toToken.address,
    sellAmount: sellAmount,
    slippagePercentage: (slippage / 100).toString(),
  });
  
  const url = `${ZEROX_API}/swap/v1/quote?${params}`;
  
  console.log(`🔍 Getting quote: ${options.amount} ${fromToken.symbol} → ${toToken.symbol}...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { reason?: string; message?: string };
    throw new Error(`0x API error: ${error.reason || error.message || response.statusText}`);
  }
  
  const quote = await response.json() as {
    buyAmount: string;
    sellAmount: string;
    gas: string;
    gasPrice: string;
    estimatedGas: string;
    to: string;
    data: string;
    value: string;
    sources?: Array<{ name: string; proportion: string }>;
  };
  
  // Calculate human-readable amounts
  const buyAmountFormatted = ethers.formatUnits(quote.buyAmount, toToken.decimals);
  const sellAmountFormatted = ethers.formatUnits(quote.sellAmount, fromToken.decimals);
  const price = (parseFloat(buyAmountFormatted) / parseFloat(sellAmountFormatted)).toFixed(6);
  
  return {
    sellToken: fromToken.symbol,
    buyToken: toToken.symbol,
    sellAmount: sellAmountFormatted,
    buyAmount: buyAmountFormatted,
    price: price,
    gas: quote.gas,
    gasPrice: quote.gasPrice,
    estimatedGas: quote.estimatedGas,
    to: quote.to,
    data: quote.data,
    value: quote.value,
    sources: quote.sources?.filter((s) => parseFloat(s.proportion) > 0) || [],
  };
}

/**
 * Execute a swap transaction
 */
export async function executeSwap(
  signer: ethers.Wallet,
  options: SwapOptions
): Promise<SwapResult> {
  const quote = await getSwapQuote(options);
  
  const fromToken = resolveToken(options.from);
  const toToken = resolveToken(options.to);
  
  console.log(`\n🦞 Swap Quote:`);
  console.log(`   Sell: ${quote.sellAmount} ${quote.sellToken}`);
  console.log(`   Buy:  ${quote.buyAmount} ${quote.buyToken}`);
  console.log(`   Rate: 1 ${quote.sellToken} = ${quote.price} ${quote.buyToken}`);
  console.log(`   Sources: ${quote.sources.map(s => s.name).join(', ') || 'Direct'}`);
  
  // If selling ERC20 (not ETH), need to approve first
  if (fromToken.address !== TOKENS.ETH.address) {
    console.log(`\n📝 Checking allowance...`);
    
    const erc20Abi = [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)'
    ];
    
    const tokenContract = new ethers.Contract(fromToken.address, erc20Abi, signer);
    const allowance = await tokenContract.allowance(signer.address, quote.to);
    const sellAmountWei = ethers.parseUnits(options.amount, fromToken.decimals);
    
    if (allowance < sellAmountWei) {
      console.log(`   Approving ${quote.sellToken} for swap...`);
      const approveTx = await tokenContract.approve(quote.to, ethers.MaxUint256);
      await approveTx.wait();
      console.log(`   ✅ Approved`);
    } else {
      console.log(`   ✅ Already approved`);
    }
  }
  
  // Execute the swap
  console.log(`\n📤 Executing swap...`);
  
  const tx = await signer.sendTransaction({
    to: quote.to,
    data: quote.data,
    value: quote.value,
    gasLimit: Math.ceil(parseInt(quote.estimatedGas) * 1.2), // 20% buffer
  });
  
  console.log(`   TX: ${tx.hash}`);
  
  const receipt = await tx.wait();
  
  if (receipt && receipt.status === 1) {
    console.log(`   ✅ Swap confirmed in block ${receipt.blockNumber}`);
    
    return {
      hash: tx.hash,
      status: 'confirmed',
      fromToken: quote.sellToken,
      toToken: quote.buyToken,
      fromAmount: quote.sellAmount,
      toAmount: quote.buyAmount,
      gasUsed: receipt.gasUsed?.toString(),
    };
  } else {
    throw new Error('Swap transaction failed');
  }
}

/**
 * Get a price quote without executing
 */
export async function getPrice(from: string, to: string, amount: string = '1'): Promise<string> {
  const quote = await getSwapQuote({ from, to, amount });
  return quote.price;
}

/**
 * Supported tokens list
 */
export function getSupportedTokens(): string[] {
  return Object.keys(TOKENS);
}
