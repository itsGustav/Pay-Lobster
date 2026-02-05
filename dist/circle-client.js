"use strict";
/**
 * Circle Programmable Wallets Client
 *
 * Wrapper around Circle's Developer-Controlled Wallets API
 * for USDC operations on testnet.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleClient = exports.CHAIN_NAMES = exports.USDC_TOKENS = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Testnet USDC Token IDs (from Circle's registry)
exports.USDC_TOKENS = {
    'ETH-SEPOLIA': 'eth-sepolia-usdc',
    'MATIC-AMOY': 'matic-amoy-usdc',
    'AVAX-FUJI': 'avax-fuji-usdc',
    'ARB-SEPOLIA': 'arb-sepolia-usdc',
};
exports.CHAIN_NAMES = {
    'ETH-SEPOLIA': 'Ethereum Sepolia',
    'MATIC-AMOY': 'Polygon Amoy',
    'AVAX-FUJI': 'Avalanche Fuji',
    'ARB-SEPOLIA': 'Arbitrum Sepolia',
};
/**
 * Circle Programmable Wallets Client
 */
class CircleClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.entitySecret = config.entitySecret;
        this.baseUrl = config.baseUrl || 'https://api.circle.com/v1/w3s';
    }
    /**
     * Generate entity secret ciphertext for API calls
     */
    generateEntitySecretCiphertext() {
        // Entity secret should be hex-encoded 32 bytes
        const entitySecretBuffer = Buffer.from(this.entitySecret, 'hex');
        // Generate random IV
        const iv = crypto_1.default.randomBytes(12);
        // For demo purposes, return base64 encoded secret
        // In production, this would use Circle's public key for encryption
        return Buffer.concat([iv, entitySecretBuffer]).toString('base64');
    }
    /**
     * Make authenticated API request
     */
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
        const options = {
            method,
            headers,
        };
        if (body) {
            // Add idempotency key for mutations
            if (method !== 'GET') {
                body.idempotencyKey = crypto_1.default.randomUUID();
            }
            // Add entity secret ciphertext for transaction operations
            if (path.includes('/transactions') || path.includes('/wallets')) {
                body.entitySecretCiphertext = this.generateEntitySecretCiphertext();
            }
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Circle API error (${response.status}): ${error}`);
        }
        const data = await response.json();
        return data.data || data;
    }
    // ============ Wallet Set Operations ============
    /**
     * Create a new wallet set
     */
    async createWalletSet(name) {
        return this.request('POST', '/developer/walletSets', { name });
    }
    /**
     * List all wallet sets
     */
    async listWalletSets() {
        const result = await this.request('GET', '/developer/walletSets');
        return result.walletSets || [];
    }
    // ============ Wallet Operations ============
    /**
     * Create wallets in a wallet set
     */
    async createWallets(walletSetId, blockchains, count = 1) {
        const result = await this.request('POST', '/developer/wallets', {
            walletSetId,
            blockchains,
            count,
        });
        return result.wallets || [];
    }
    /**
     * Get wallet by ID
     */
    async getWallet(walletId) {
        return this.request('GET', `/wallets/${walletId}`);
    }
    /**
     * List all wallets
     */
    async listWallets() {
        const result = await this.request('GET', '/wallets');
        return result.wallets || [];
    }
    // ============ Balance Operations ============
    /**
     * Get token balances for a wallet
     */
    async getBalances(walletId) {
        const result = await this.request('GET', `/wallets/${walletId}/balances`);
        return result.tokenBalances || [];
    }
    /**
     * Get USDC balance across all wallets
     */
    async getAllUSDCBalances() {
        const wallets = await this.listWallets();
        const results = [];
        for (const wallet of wallets) {
            try {
                const balances = await this.getBalances(wallet.id);
                const usdcBalance = balances.find(b => b.token.symbol === 'USDC');
                results.push({
                    wallet,
                    balance: usdcBalance?.amount || '0',
                    chain: wallet.blockchain,
                });
            }
            catch (err) {
                console.error(`Failed to get balance for wallet ${wallet.id}:`, err);
            }
        }
        return results;
    }
    // ============ Transaction Operations ============
    /**
     * Send USDC to an address
     */
    async sendUSDC(options) {
        const wallet = await this.getWallet(options.fromWalletId);
        const tokenId = options.tokenId || exports.USDC_TOKENS[wallet.blockchain];
        if (!tokenId) {
            throw new Error(`No USDC token ID found for chain ${wallet.blockchain}`);
        }
        return this.request('POST', '/developer/transactions/transfer', {
            walletId: options.fromWalletId,
            tokenId,
            destinationAddress: options.toAddress,
            amounts: [options.amount],
            fee: {
                type: 'level',
                config: {
                    feeLevel: options.feeLevel || 'MEDIUM',
                },
            },
        });
    }
    /**
     * Get transaction by ID
     */
    async getTransaction(transactionId) {
        return this.request('GET', `/transactions/${transactionId}`);
    }
    /**
     * List recent transactions
     */
    async listTransactions(walletId) {
        const path = walletId
            ? `/wallets/${walletId}/transactions`
            : '/transactions';
        const result = await this.request('GET', path);
        return result.transactions || [];
    }
    // ============ CCTP Bridge Operations ============
    /**
     * Bridge USDC across chains via CCTP
     */
    async bridgeUSDC(options) {
        // CCTP bridge is done through contract interactions
        // This is a simplified version - full implementation would use
        // Circle's CCTP contracts directly
        return this.request('POST', '/developer/transactions/contractExecution', {
            walletId: options.fromWalletId,
            contractAddress: this.getCCTPContractAddress(options.fromChain),
            abiFunctionSignature: 'depositForBurn(uint256,uint32,bytes32,address)',
            abiParameters: [
                options.amount,
                this.getChainDomain(options.toChain),
                this.addressToBytes32(options.toAddress),
                exports.USDC_TOKENS[options.fromChain],
            ],
            fee: {
                type: 'level',
                config: { feeLevel: 'HIGH' },
            },
        });
    }
    /**
     * Get CCTP TokenMessenger contract address for chain
     */
    getCCTPContractAddress(chain) {
        const contracts = {
            'ETH-SEPOLIA': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
            'AVAX-FUJI': '0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0',
            'ARB-SEPOLIA': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        };
        return contracts[chain] || '';
    }
    /**
     * Get CCTP domain ID for chain
     */
    getChainDomain(chain) {
        const domains = {
            'ETH-SEPOLIA': 0,
            'AVAX-FUJI': 1,
            'ARB-SEPOLIA': 3,
            'MATIC-AMOY': 7,
        };
        return domains[chain] || 0;
    }
    /**
     * Convert address to bytes32 format
     */
    addressToBytes32(address) {
        return '0x' + address.slice(2).padStart(64, '0');
    }
    // ============ Utility Methods ============
    /**
     * Format USDC amount for display
     */
    static formatUSDC(amount) {
        const num = parseFloat(amount);
        return `${num.toFixed(2)} USDC`;
    }
    /**
     * Parse human-readable amount to wei
     */
    static parseAmount(amount) {
        // USDC has 6 decimals
        const num = parseFloat(amount);
        return (num * 1000000).toString();
    }
    /**
     * Validate Ethereum address
     */
    static isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
}
exports.CircleClient = CircleClient;
exports.default = CircleClient;
//# sourceMappingURL=circle-client.js.map