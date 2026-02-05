/**
 * Pay Lobster Stats Module
 * Tracks total volume, transaction counts, and analytics
 * 🦞
 */
export interface PayLobsterStats {
    totalVolume: string;
    totalTransactions: number;
    totalEscrowVolume: string;
    totalEscrowsCreated: number;
    trackedWallets: string[];
    walletStats: Record<string, WalletStats>;
    dailyVolume: Record<string, string>;
    lastUpdated: string;
    lastBlock: number;
}
export interface WalletStats {
    address: string;
    totalSent: string;
    totalReceived: string;
    transactionCount: number;
    firstSeen: string;
    lastActive: string;
}
/**
 * Load stats from disk
 */
export declare function loadStats(): PayLobsterStats;
/**
 * Save stats to disk
 */
export declare function saveStats(stats: PayLobsterStats): void;
/**
 * Record a transfer in stats
 */
export declare function recordTransfer(from: string, to: string, amount: string, txHash: string): PayLobsterStats;
/**
 * Record an escrow creation
 */
export declare function recordEscrow(amount: string): PayLobsterStats;
/**
 * Query on-chain stats for a wallet (real-time from blockchain)
 */
export declare function queryOnChainStats(walletAddress: string): Promise<{
    usdcBalance: string;
    ethBalance: string;
    incomingVolume: string;
    outgoingVolume: string;
    transactionCount: number;
}>;
/**
 * Get formatted stats summary
 */
export declare function getStatsSummary(): string;
/**
 * Get leaderboard of top wallets by volume
 */
export declare function getLeaderboard(limit?: number): Array<{
    rank: number;
    address: string;
    totalVolume: string;
    transactions: number;
}>;
export declare const stats: {
    load: typeof loadStats;
    save: typeof saveStats;
    recordTransfer: typeof recordTransfer;
    recordEscrow: typeof recordEscrow;
    queryOnChain: typeof queryOnChainStats;
    getSummary: typeof getStatsSummary;
    getLeaderboard: typeof getLeaderboard;
};
//# sourceMappingURL=stats.d.ts.map