"use strict";
/**
 * Pay Lobster Swap Module
 * Powered by 0x API for best execution across DEXs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwapQuote = getSwapQuote;
exports.executeSwap = executeSwap;
exports.getPrice = getPrice;
exports.getSupportedTokens = getSupportedTokens;
const ethers_1 = require("ethers");
const ZEROX_API = 'https://base.api.0x.org';
// Common tokens on Base
const TOKENS = {
    ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    USDbC: { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6 },
    DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
};
/**
 * Resolve token symbol to address and decimals
 */
function resolveToken(tokenOrSymbol) {
    const upper = tokenOrSymbol.toUpperCase();
    if (TOKENS[upper]) {
        return { ...TOKENS[upper], symbol: upper };
    }
    // Assume it's an address
    if (ethers_1.ethers.isAddress(tokenOrSymbol)) {
        return { address: tokenOrSymbol, decimals: 18, symbol: tokenOrSymbol.slice(0, 8) };
    }
    throw new Error(`Unknown token: ${tokenOrSymbol}. Supported: ${Object.keys(TOKENS).join(', ')}`);
}
/**
 * Get a swap quote from 0x API
 */
async function getSwapQuote(options) {
    const fromToken = resolveToken(options.from);
    const toToken = resolveToken(options.to);
    // Convert amount to smallest unit
    const sellAmount = ethers_1.ethers.parseUnits(options.amount, fromToken.decimals).toString();
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
        const error = await response.json().catch(() => ({}));
        throw new Error(`0x API error: ${error.reason || error.message || response.statusText}`);
    }
    const quote = await response.json();
    // Calculate human-readable amounts
    const buyAmountFormatted = ethers_1.ethers.formatUnits(quote.buyAmount, toToken.decimals);
    const sellAmountFormatted = ethers_1.ethers.formatUnits(quote.sellAmount, fromToken.decimals);
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
async function executeSwap(signer, options) {
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
        const tokenContract = new ethers_1.ethers.Contract(fromToken.address, erc20Abi, signer);
        const allowance = await tokenContract.allowance(signer.address, quote.to);
        const sellAmountWei = ethers_1.ethers.parseUnits(options.amount, fromToken.decimals);
        if (allowance < sellAmountWei) {
            console.log(`   Approving ${quote.sellToken} for swap...`);
            const approveTx = await tokenContract.approve(quote.to, ethers_1.ethers.MaxUint256);
            await approveTx.wait();
            console.log(`   ✅ Approved`);
        }
        else {
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
    }
    else {
        throw new Error('Swap transaction failed');
    }
}
/**
 * Get a price quote without executing
 */
async function getPrice(from, to, amount = '1') {
    const quote = await getSwapQuote({ from, to, amount });
    return quote.price;
}
/**
 * Supported tokens list
 */
function getSupportedTokens() {
    return Object.keys(TOKENS);
}
//# sourceMappingURL=swap.js.map