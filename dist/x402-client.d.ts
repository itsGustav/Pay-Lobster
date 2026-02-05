/**
 * x402 Payment-Enabled HTTP Client
 *
 * Wraps fetch() to automatically handle 402 Payment Required responses.
 * Uses Circle Programmable Wallets to pay and retry with signature.
 */
import { CircleClient } from './circle-client';
export interface PaymentChallenge {
    'x-payment-required': {
        version: '1';
        network: string;
        receiver: string;
        asset: string;
        amount: string;
        description: string;
        expires: number;
        nonce: string;
    };
}
export interface PaymentReceipt {
    url: string;
    challenge: PaymentChallenge['x-payment-required'];
    txHash: string;
    signature: string;
    paidAt: string;
    expiresAt: number;
}
export interface X402ClientConfig {
    wallet: CircleClient;
    walletId?: string;
    maxAutoPayUSDC?: string;
    requireConfirmation?: boolean;
    cacheReceipts?: boolean;
    cacheDir?: string;
    onPayment?: (amount: string, url: string, txHash: string) => void;
    onChallenge?: (challenge: PaymentChallenge) => void;
    onVerified?: (receipt: PaymentReceipt) => void;
    onError?: (error: Error, url: string) => void;
}
/**
 * x402-enabled fetch function
 */
export type X402Fetch = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;
/**
 * Create a payment-enabled fetch wrapper
 */
export declare function createX402Fetch(config: X402ClientConfig): X402Fetch;
/**
 * X402 HTTP Client
 */
export declare class X402Client {
    private wallet;
    private walletId?;
    private maxAutoPayUSDC?;
    private requireConfirmation;
    private cacheReceipts;
    private cacheDir;
    private onPayment?;
    private onChallenge?;
    private onVerified?;
    private onError?;
    private receiptCache;
    constructor(config: X402ClientConfig);
    /**
     * Main fetch method - handles 402 automatically
     */
    fetch(url: string | URL | Request, init?: RequestInit): Promise<Response>;
    /**
     * Handle 402 Payment Required response
     */
    private handlePaymentRequired;
    /**
     * Execute USDC payment via Circle
     */
    private executePayment;
    /**
     * Fetch with payment signature header
     */
    private fetchWithPayment;
    /**
     * Parse payment challenge from 402 response
     */
    private parsePaymentChallenge;
    /**
     * Generate payment signature from challenge and tx hash
     */
    private generatePaymentSignature;
    /**
     * Confirm payment with user (if required)
     */
    private confirmPayment;
    /**
     * Get cached receipt for URL
     */
    private getCachedReceipt;
    /**
     * Cache payment receipt
     */
    private cacheReceipt;
    /**
     * Load cached receipts from disk
     */
    private loadReceiptCache;
    /**
     * Get receipt history
     */
    getReceiptHistory(): Promise<PaymentReceipt[]>;
    /**
     * Clear receipt cache
     */
    clearCache(): Promise<void>;
    /**
     * Extract URL string from various input types
     */
    private getUrlString;
}
/**
 * Helper: Create simple x402 client with minimal config
 */
export declare function simpleX402Fetch(wallet: CircleClient, maxAutoPayUSDC?: string): X402Fetch;
declare const _default: {
    createX402Fetch: typeof createX402Fetch;
    simpleX402Fetch: typeof simpleX402Fetch;
    X402Client: typeof X402Client;
};
export default _default;
//# sourceMappingURL=x402-client.d.ts.map