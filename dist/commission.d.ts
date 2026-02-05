/**
 * Commission Splitter Module
 *
 * Auto-distribute USDC commissions between multiple parties:
 * agents, brokers, referral partners, team members.
 */
export interface SplitRecipient {
    id: string;
    name: string;
    role: 'listing_agent' | 'buyer_agent' | 'broker' | 'referral' | 'team_member' | 'company' | 'custom';
    walletAddress: string;
    splitType: 'percentage' | 'fixed';
    splitValue: string;
    minAmount?: string;
    maxAmount?: string;
    tier?: number;
}
export interface CommissionSplit {
    id: string;
    name: string;
    description?: string;
    propertyAddress?: string;
    mlsNumber?: string;
    closingDate?: string;
    salePrice?: string;
    totalCommission: string;
    chain: string;
    sourceWalletId: string;
    recipients: SplitRecipient[];
    payouts: {
        recipientId: string;
        amount: string;
        status: 'pending' | 'processing' | 'sent' | 'failed';
        txHash?: string;
        sentAt?: string;
        error?: string;
    }[];
    status: 'draft' | 'ready' | 'processing' | 'completed' | 'partial' | 'failed';
    executeAt?: string;
    executedAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export interface SplitTemplate {
    id: string;
    name: string;
    description?: string;
    recipients: {
        role: SplitRecipient['role'];
        splitType: SplitRecipient['splitType'];
        splitValue: string;
        tier?: number;
    }[];
    usageCount: number;
    lastUsedAt?: string;
    createdAt: string;
}
/**
 * Commission Splitter
 */
export declare class CommissionSplitter {
    private splitsPath;
    private templatesPath;
    constructor(dataDir?: string);
    private loadSplits;
    private saveSplits;
    private loadTemplates;
    private saveTemplates;
    /**
     * Create a commission split
     */
    createSplit(params: {
        name: string;
        totalCommission: string;
        chain: string;
        sourceWalletId: string;
        recipients: Omit<SplitRecipient, 'id'>[];
        propertyAddress?: string;
        mlsNumber?: string;
        closingDate?: string;
        salePrice?: string;
        executeAt?: string;
        notes?: string;
    }): Promise<CommissionSplit>;
    /**
     * Create split from template
     */
    createFromTemplate(templateId: string, params: {
        totalCommission: string;
        chain: string;
        sourceWalletId: string;
        recipientAddresses: {
            role: string;
            name: string;
            address: string;
        }[];
        propertyAddress?: string;
        closingDate?: string;
        salePrice?: string;
    }): Promise<CommissionSplit>;
    /**
     * Quick split for common scenarios
     */
    quickSplit(params: {
        totalCommission: string;
        chain: string;
        sourceWalletId: string;
        scenario: 'listing_side' | 'buyer_side' | 'both_sides' | 'referral';
        agent: {
            name: string;
            address: string;
            split?: string;
        };
        broker: {
            name: string;
            address: string;
            split?: string;
        };
        referral?: {
            name: string;
            address: string;
            split?: string;
        };
        propertyAddress?: string;
    }): Promise<CommissionSplit>;
    /**
     * Calculate payouts for all recipients
     */
    private calculatePayouts;
    /**
     * Validate splits add up correctly
     */
    private validateSplits;
    /**
     * Execute a split (send all payouts)
     * Returns the split with updated payout statuses
     */
    execute(splitId: string, sendFn: (to: string, amount: string, chain: string) => Promise<{
        txHash: string;
    }>): Promise<CommissionSplit | null>;
    /**
     * Retry failed payouts
     */
    retryFailed(splitId: string, sendFn: (to: string, amount: string, chain: string) => Promise<{
        txHash: string;
    }>): Promise<CommissionSplit | null>;
    /**
     * Create a split template
     */
    createTemplate(params: {
        name: string;
        description?: string;
        recipients: SplitTemplate['recipients'];
    }): Promise<SplitTemplate>;
    /**
     * List templates
     */
    listTemplates(): Promise<SplitTemplate[]>;
    /**
     * Get common RE templates
     */
    getDefaultTemplates(): Promise<SplitTemplate[]>;
    /**
     * Get split by ID
     */
    get(id: string): Promise<CommissionSplit | null>;
    /**
     * List splits with filters
     */
    list(filters?: {
        status?: CommissionSplit['status'];
        recipientAddress?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<CommissionSplit[]>;
    /**
     * Get pending splits (ready but not executed)
     */
    getPending(): Promise<CommissionSplit[]>;
    /**
     * Get splits due for execution
     */
    getDue(): Promise<CommissionSplit[]>;
    /**
     * Format split summary
     */
    formatSplitSummary(split: CommissionSplit): string;
}
export default CommissionSplitter;
//# sourceMappingURL=commission.d.ts.map