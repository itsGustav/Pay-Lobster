/**
 * Pay Lobster Type Definitions
 */
export interface LobsterConfig {
    /** Circle API key for wallet operations */
    circleApiKey?: string;
    /** Ethereum private key for direct transactions */
    privateKey?: string;
    /** Network: 'base' | 'base-sepolia' | 'ethereum' */
    network?: 'base' | 'base-sepolia' | 'ethereum';
    /** Existing Circle wallet ID */
    walletId?: string;
    /** Custom RPC URL */
    rpcUrl?: string;
    /** Enable ERC-8004 trust verification */
    enableTrust?: boolean;
}
export interface Wallet {
    id: string;
    address: string;
    network: string;
    balance?: string;
    createdAt?: string;
}
export interface Transfer {
    id: string;
    hash?: string;
    status: 'pending' | 'confirmed' | 'failed';
    amount: string;
    to: string;
    toName?: string;
    from: string;
    memo?: string;
    createdAt: string;
}
export interface Escrow {
    id: string;
    amount: string;
    buyer: string;
    seller: string;
    status: 'funded' | 'released' | 'disputed' | 'refunded';
    conditions?: EscrowConditions;
    createdAt: string;
}
export interface EscrowConditions {
    type: 'milestone' | 'time' | 'approval';
    description: string;
    deadline?: string;
}
export interface TrustScore {
    score: number;
    level: 'new' | 'established' | 'trusted' | 'verified';
    totalTransactions: number;
    successRate: number;
    ratings?: Rating[];
}
export interface Rating {
    rating: number;
    comment?: string;
    from: string;
    createdAt: string;
}
export interface Agent {
    address: string;
    name: string;
    capabilities: string[];
    pricing?: Record<string, string>;
    trustScore?: TrustScore;
    metadata?: Record<string, any>;
}
export interface TransferOptions {
    to: string;
    amount: string;
    memo?: string;
    idempotencyKey?: string;
}
export interface EscrowOptions {
    amount: string;
    recipient: string;
    conditions?: EscrowConditions;
    template?: 'freelance' | 'marketplace' | 'rental';
    deadline?: string;
    milestones?: {
        name: string;
        amount: string;
    }[];
}
export interface DiscoverOptions {
    capability?: string;
    minTrustScore?: number;
    maxPrice?: string;
    limit?: number;
}
export interface AutonomousConfig {
    enabled: boolean;
    dailyLimit: string;
    perTransactionLimit: string;
    autoApproveBelow: string;
    allowedCapabilities: string[];
}
//# sourceMappingURL=types.d.ts.map