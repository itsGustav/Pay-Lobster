/**
 * Pay Lobster Swap Module
 * Powered by 0x API for best execution across DEXs
 *
 * 💎 PREMIUM FEATURE (currently free during launch)
 * Future: Will require Pro tier subscription
 */
import { ethers } from 'ethers';
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
    sources: Array<{
        name: string;
        proportion: string;
    }>;
}
export interface SwapOptions {
    from: string;
    to: string;
    amount: string;
    slippage?: number;
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
 * Get a swap quote from 0x API
 */
export declare function getSwapQuote(options: SwapOptions): Promise<SwapQuote>;
/**
 * Execute a swap transaction
 */
export declare function executeSwap(signer: ethers.Wallet, options: SwapOptions): Promise<SwapResult>;
/**
 * Get a price quote without executing
 */
export declare function getPrice(from: string, to: string, amount?: string): Promise<string>;
/**
 * Supported tokens list
 */
export declare function getSupportedTokens(): string[];
//# sourceMappingURL=swap.d.ts.map