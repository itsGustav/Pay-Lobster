/**
 * Circle Programmable Wallets Client
 *
 * Wrapper around Circle's Developer-Controlled Wallets API
 * for USDC operations on testnet.
 */
export interface CircleConfig {
    apiKey: string;
    entitySecret: string;
    baseUrl?: string;
}
export interface Wallet {
    id: string;
    address: string;
    blockchain: string;
    state: string;
    walletSetId: string;
    createDate: string;
}
export interface WalletSet {
    id: string;
    name: string;
    custodyType: string;
    createDate: string;
}
export interface Balance {
    token: {
        id: string;
        name: string;
        symbol: string;
        decimals: number;
        blockchain: string;
    };
    amount: string;
}
export interface Transaction {
    id: string;
    state: string;
    txHash?: string;
    amounts: string[];
    sourceAddress: string;
    destinationAddress: string;
    blockchain: string;
    createDate: string;
}
export interface SendOptions {
    fromWalletId: string;
    toAddress: string;
    amount: string;
    tokenId?: string;
    feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface BridgeOptions {
    fromWalletId: string;
    toAddress: string;
    fromChain: string;
    toChain: string;
    amount: string;
}
export declare const USDC_TOKENS: Record<string, string>;
export declare const CHAIN_NAMES: Record<string, string>;
/**
 * Circle Programmable Wallets Client
 */
export declare class CircleClient {
    private apiKey;
    private entitySecret;
    private baseUrl;
    constructor(config: CircleConfig);
    /**
     * Generate entity secret ciphertext for API calls
     */
    private generateEntitySecretCiphertext;
    /**
     * Make authenticated API request
     */
    private request;
    /**
     * Create a new wallet set
     */
    createWalletSet(name: string): Promise<WalletSet>;
    /**
     * List all wallet sets
     */
    listWalletSets(): Promise<WalletSet[]>;
    /**
     * Create wallets in a wallet set
     */
    createWallets(walletSetId: string, blockchains: string[], count?: number): Promise<Wallet[]>;
    /**
     * Get wallet by ID
     */
    getWallet(walletId: string): Promise<Wallet>;
    /**
     * List all wallets
     */
    listWallets(): Promise<Wallet[]>;
    /**
     * Get token balances for a wallet
     */
    getBalances(walletId: string): Promise<Balance[]>;
    /**
     * Get USDC balance across all wallets
     */
    getAllUSDCBalances(): Promise<{
        wallet: Wallet;
        balance: string;
        chain: string;
    }[]>;
    /**
     * Send USDC to an address
     */
    sendUSDC(options: SendOptions): Promise<Transaction>;
    /**
     * Get transaction by ID
     */
    getTransaction(transactionId: string): Promise<Transaction>;
    /**
     * List recent transactions
     */
    listTransactions(walletId?: string): Promise<Transaction[]>;
    /**
     * Bridge USDC across chains via CCTP
     */
    bridgeUSDC(options: BridgeOptions): Promise<Transaction>;
    /**
     * Get CCTP TokenMessenger contract address for chain
     */
    private getCCTPContractAddress;
    /**
     * Get CCTP domain ID for chain
     */
    private getChainDomain;
    /**
     * Convert address to bytes32 format
     */
    private addressToBytes32;
    /**
     * Format USDC amount for display
     */
    static formatUSDC(amount: string): string;
    /**
     * Parse human-readable amount to wei
     */
    static parseAmount(amount: string): string;
    /**
     * Validate Ethereum address
     */
    static isValidAddress(address: string): boolean;
}
export default CircleClient;
//# sourceMappingURL=circle-client.d.ts.map