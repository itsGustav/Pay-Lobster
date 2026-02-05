"use strict";
/**
 * x402 Payment-Enabled HTTP Client
 *
 * Wraps fetch() to automatically handle 402 Payment Required responses.
 * Uses Circle Programmable Wallets to pay and retry with signature.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402Client = void 0;
exports.createX402Fetch = createX402Fetch;
exports.simpleX402Fetch = simpleX402Fetch;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Create a payment-enabled fetch wrapper
 */
function createX402Fetch(config) {
    const client = new X402Client(config);
    return async (url, init) => {
        return client.fetch(url, init);
    };
}
/**
 * X402 HTTP Client
 */
class X402Client {
    constructor(config) {
        // In-memory receipt cache
        this.receiptCache = new Map();
        this.wallet = config.wallet;
        this.walletId = config.walletId;
        this.maxAutoPayUSDC = config.maxAutoPayUSDC ? parseFloat(config.maxAutoPayUSDC) : undefined;
        this.requireConfirmation = config.requireConfirmation ?? false;
        this.cacheReceipts = config.cacheReceipts ?? true;
        this.cacheDir = config.cacheDir || './data/x402-receipts';
        this.onPayment = config.onPayment;
        this.onChallenge = config.onChallenge;
        this.onVerified = config.onVerified;
        this.onError = config.onError;
        // Load cached receipts on init
        if (this.cacheReceipts) {
            this.loadReceiptCache().catch(() => {
                // Ignore cache load errors
            });
        }
    }
    /**
     * Main fetch method - handles 402 automatically
     */
    async fetch(url, init) {
        const urlString = this.getUrlString(url);
        try {
            // Check for cached receipt
            const cachedReceipt = this.getCachedReceipt(urlString);
            if (cachedReceipt) {
                // Use cached payment signature
                return this.fetchWithPayment(url, init, cachedReceipt.signature);
            }
            // First attempt - no payment
            const response = await fetch(url, init);
            // Success or non-402 error - return as-is
            if (response.status !== 402) {
                return response;
            }
            // 402 Payment Required - handle payment
            const paymentResponse = await this.handlePaymentRequired(response, urlString, url, init);
            return paymentResponse;
        }
        catch (error) {
            const err = error;
            this.onError?.(err, urlString);
            throw err;
        }
    }
    /**
     * Handle 402 Payment Required response
     */
    async handlePaymentRequired(response, urlString, originalUrl, originalInit) {
        // Parse payment challenge from response
        const challenge = await this.parsePaymentChallenge(response);
        if (!challenge) {
            throw new Error('Invalid 402 response: missing x-payment-required');
        }
        // Trigger challenge hook
        this.onChallenge?.(challenge);
        // Check if challenge is expired
        if (challenge['x-payment-required'].expires < Math.floor(Date.now() / 1000)) {
            throw new Error('Payment challenge expired');
        }
        // Check max auto-pay limit
        const amount = parseFloat(challenge['x-payment-required'].amount);
        if (this.maxAutoPayUSDC !== undefined && amount > this.maxAutoPayUSDC) {
            throw new Error(`Payment amount ${amount} USDC exceeds max auto-pay limit ${this.maxAutoPayUSDC} USDC`);
        }
        // Confirm payment if required
        if (this.requireConfirmation) {
            const confirmed = await this.confirmPayment(challenge);
            if (!confirmed) {
                throw new Error('Payment cancelled by user');
            }
        }
        // Execute payment
        const txHash = await this.executePayment(challenge);
        // Trigger payment hook
        this.onPayment?.(challenge['x-payment-required'].amount, urlString, txHash);
        // Generate payment signature
        const signature = this.generatePaymentSignature(challenge, txHash);
        // Cache receipt
        const receipt = {
            url: urlString,
            challenge: challenge['x-payment-required'],
            txHash,
            signature,
            paidAt: new Date().toISOString(),
            expiresAt: challenge['x-payment-required'].expires,
        };
        await this.cacheReceipt(receipt);
        this.onVerified?.(receipt);
        // Retry request with payment signature
        return this.fetchWithPayment(originalUrl, originalInit, signature);
    }
    /**
     * Execute USDC payment via Circle
     */
    async executePayment(challenge) {
        const { amount, receiver, network } = challenge['x-payment-required'];
        // Determine wallet to use
        let walletId = this.walletId;
        if (!walletId) {
            // Auto-select wallet for the network
            const wallets = await this.wallet.listWallets();
            const wallet = wallets.find(w => w.blockchain === network);
            if (!wallet) {
                throw new Error(`No wallet found for network ${network}`);
            }
            walletId = wallet.id;
        }
        // Send USDC
        const tx = await this.wallet.sendUSDC({
            fromWalletId: walletId,
            toAddress: receiver,
            amount,
        });
        // Wait for transaction to be confirmed
        // In production, you might want to poll for confirmation
        // For now, return transaction ID
        return tx.txHash || tx.id;
    }
    /**
     * Fetch with payment signature header
     */
    async fetchWithPayment(url, init, signature) {
        const headers = new Headers(init?.headers);
        headers.set('x-payment-signature', signature);
        return fetch(url, {
            ...init,
            headers,
        });
    }
    /**
     * Parse payment challenge from 402 response
     */
    async parsePaymentChallenge(response) {
        try {
            const body = await response.json();
            if (body['x-payment-required']) {
                return body;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Generate payment signature from challenge and tx hash
     */
    generatePaymentSignature(challenge, txHash) {
        // In production, this would involve the x402 facilitator
        // For now, create a deterministic signature
        const data = JSON.stringify({
            nonce: challenge['x-payment-required'].nonce,
            amount: challenge['x-payment-required'].amount,
            receiver: challenge['x-payment-required'].receiver,
            txHash,
        });
        // Simple hash-based signature (production would use proper signing)
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Confirm payment with user (if required)
     */
    async confirmPayment(challenge) {
        // In a real implementation, this would prompt the user
        // For CLI/automated contexts, we can skip confirmation
        // For UI contexts, show a dialog
        const { amount, description } = challenge['x-payment-required'];
        console.log(`\n💳 Payment Required`);
        console.log(`   Amount: ${amount} USDC`);
        console.log(`   Description: ${description}`);
        console.log(`   Confirm? (auto-approved)\n`);
        // Auto-approve for now
        return true;
    }
    /**
     * Get cached receipt for URL
     */
    getCachedReceipt(url) {
        if (!this.cacheReceipts)
            return null;
        const receipt = this.receiptCache.get(url);
        // Check if receipt is still valid
        if (receipt && receipt.expiresAt > Math.floor(Date.now() / 1000)) {
            return receipt;
        }
        // Expired - remove from cache
        if (receipt) {
            this.receiptCache.delete(url);
        }
        return null;
    }
    /**
     * Cache payment receipt
     */
    async cacheReceipt(receipt) {
        if (!this.cacheReceipts)
            return;
        // Add to in-memory cache
        this.receiptCache.set(receipt.url, receipt);
        // Persist to disk
        try {
            await promises_1.default.mkdir(this.cacheDir, { recursive: true });
            const filename = crypto_1.default.createHash('md5').update(receipt.url).digest('hex') + '.json';
            const filepath = path_1.default.join(this.cacheDir, filename);
            await promises_1.default.writeFile(filepath, JSON.stringify(receipt, null, 2));
        }
        catch (error) {
            // Ignore cache write errors
            console.error('Failed to cache receipt:', error);
        }
    }
    /**
     * Load cached receipts from disk
     */
    async loadReceiptCache() {
        try {
            await promises_1.default.mkdir(this.cacheDir, { recursive: true });
            const files = await promises_1.default.readdir(this.cacheDir);
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                try {
                    const filepath = path_1.default.join(this.cacheDir, file);
                    const data = await promises_1.default.readFile(filepath, 'utf-8');
                    const receipt = JSON.parse(data);
                    // Only cache if not expired
                    if (receipt.expiresAt > Math.floor(Date.now() / 1000)) {
                        this.receiptCache.set(receipt.url, receipt);
                    }
                    else {
                        // Delete expired receipt
                        await promises_1.default.unlink(filepath);
                    }
                }
                catch {
                    // Ignore individual file errors
                }
            }
        }
        catch {
            // Ignore cache directory errors
        }
    }
    /**
     * Get receipt history
     */
    async getReceiptHistory() {
        const receipts = [];
        try {
            const files = await promises_1.default.readdir(this.cacheDir);
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                try {
                    const filepath = path_1.default.join(this.cacheDir, file);
                    const data = await promises_1.default.readFile(filepath, 'utf-8');
                    const receipt = JSON.parse(data);
                    receipts.push(receipt);
                }
                catch {
                    // Ignore individual file errors
                }
            }
        }
        catch {
            // Ignore directory errors
        }
        // Sort by payment date (newest first)
        return receipts.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    }
    /**
     * Clear receipt cache
     */
    async clearCache() {
        this.receiptCache.clear();
        try {
            const files = await promises_1.default.readdir(this.cacheDir);
            for (const file of files) {
                const filepath = path_1.default.join(this.cacheDir, file);
                await promises_1.default.unlink(filepath);
            }
        }
        catch {
            // Ignore errors
        }
    }
    /**
     * Extract URL string from various input types
     */
    getUrlString(url) {
        if (typeof url === 'string') {
            return url;
        }
        else if (url instanceof URL) {
            return url.toString();
        }
        else {
            return url.url;
        }
    }
}
exports.X402Client = X402Client;
/**
 * Helper: Create simple x402 client with minimal config
 */
function simpleX402Fetch(wallet, maxAutoPayUSDC) {
    return createX402Fetch({
        wallet,
        maxAutoPayUSDC,
        onPayment: (amount, url) => {
            console.log(`💸 Paid ${amount} USDC for ${url}`);
        },
    });
}
exports.default = { createX402Fetch, simpleX402Fetch, X402Client };
//# sourceMappingURL=x402-client.js.map