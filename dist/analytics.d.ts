/**
 * Transaction Analytics & Reporting
 *
 * Insights, summaries, and reports on USDC activity.
 */
export interface TransactionRecord {
    id: string;
    type: 'send' | 'receive' | 'bridge';
    amount: string;
    fromAddress: string;
    toAddress: string;
    chain: string;
    targetChain?: string;
    txHash: string;
    fee?: string;
    timestamp: string;
    contactName?: string;
    category?: string;
    memo?: string;
}
export interface DailySummary {
    date: string;
    sent: string;
    received: string;
    net: string;
    txCount: number;
    fees: string;
}
export interface CategorySummary {
    category: string;
    sent: string;
    received: string;
    txCount: number;
}
export interface ContactSummary {
    name: string;
    address: string;
    sent: string;
    received: string;
    txCount: number;
    lastTxDate: string;
}
/**
 * Analytics Engine
 */
export declare class AnalyticsEngine {
    private txPath;
    constructor(dataDir?: string);
    private loadTransactions;
    private saveTransactions;
    /**
     * Record a transaction for analytics
     */
    recordTransaction(tx: Omit<TransactionRecord, 'id'>): Promise<TransactionRecord>;
    /**
     * Get transactions with filters
     */
    getTransactions(filters?: {
        type?: TransactionRecord['type'];
        chain?: string;
        fromDate?: string;
        toDate?: string;
        minAmount?: string;
        maxAmount?: string;
        contact?: string;
        category?: string;
        limit?: number;
    }): Promise<TransactionRecord[]>;
    /**
     * Get daily summaries for a date range
     */
    getDailySummaries(fromDate: string, toDate: string): Promise<DailySummary[]>;
    /**
     * Get category breakdown
     */
    getCategoryBreakdown(fromDate?: string, toDate?: string): Promise<CategorySummary[]>;
    /**
     * Get top contacts by volume
     */
    getTopContacts(limit?: number, fromDate?: string, toDate?: string): Promise<ContactSummary[]>;
    /**
     * Get total stats
     */
    getTotalStats(fromDate?: string, toDate?: string): Promise<{
        totalSent: string;
        totalReceived: string;
        totalBridged: string;
        netFlow: string;
        totalFees: string;
        txCount: number;
        avgTxSize: string;
        largestTx: TransactionRecord | null;
        mostFrequentContact: ContactSummary | null;
    }>;
    /**
     * Get chain distribution
     */
    getChainDistribution(fromDate?: string, toDate?: string): Promise<{
        chain: string;
        sent: string;
        received: string;
        txCount: number;
        percentage: string;
    }[]>;
    /**
     * Generate summary report text
     */
    generateReport(fromDate?: string, toDate?: string): Promise<string>;
    /**
     * Categorize a transaction
     */
    categorize(txId: string, category: string): Promise<TransactionRecord | null>;
    /**
     * Export transactions to CSV
     */
    exportCSV(fromDate?: string, toDate?: string): Promise<string>;
    private shortAddress;
}
export default AnalyticsEngine;
//# sourceMappingURL=analytics.d.ts.map