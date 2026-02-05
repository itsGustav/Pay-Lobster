/**
 * Transaction Approval System
 *
 * Multi-step approval workflow for large or sensitive transactions.
 * Integrates with Clawdbot for conversational approvals.
 */
export interface ApprovalPolicy {
    id: string;
    name: string;
    enabled: boolean;
    conditions: {
        minAmount?: string;
        maxDailyLimit?: string;
        addresses?: string[];
        chains?: string[];
        always?: boolean;
    };
    approvers: string[];
    requiredApprovals: number;
    timeout: number;
    timeoutAction: 'cancel' | 'auto-approve';
    createdAt: string;
    updatedAt: string;
}
export interface PendingTransaction {
    id: string;
    policyId: string;
    type: 'send' | 'bridge' | 'recurring';
    fromWalletId: string;
    toAddress: string;
    toName?: string;
    amount: string;
    chain: string;
    targetChain?: string;
    memo?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'executed';
    approvals: {
        approverId: string;
        decision: 'approve' | 'reject';
        timestamp: string;
        note?: string;
    }[];
    rejectionReason?: string;
    txHash?: string;
    executedAt?: string;
    requestedBy: string;
    createdAt: string;
    expiresAt: string;
}
export interface DailySpending {
    date: string;
    walletId: string;
    total: string;
    transactions: {
        amount: string;
        txHash: string;
        timestamp: string;
    }[];
}
/**
 * Approval Manager
 */
export declare class ApprovalManager {
    private policiesPath;
    private pendingPath;
    private spendingPath;
    constructor(dataDir?: string);
    private loadPolicies;
    private savePolicies;
    private loadPending;
    private savePending;
    private loadSpending;
    private saveSpending;
    /**
     * Create approval policy
     */
    createPolicy(params: {
        name: string;
        conditions: ApprovalPolicy['conditions'];
        approvers: string[];
        requiredApprovals?: number;
        timeout?: number;
        timeoutAction?: ApprovalPolicy['timeoutAction'];
    }): Promise<ApprovalPolicy>;
    /**
     * Get active policies for a transaction
     */
    getMatchingPolicies(tx: {
        amount: string;
        toAddress: string;
        chain: string;
        walletId: string;
    }): Promise<ApprovalPolicy[]>;
    /**
     * List all policies
     */
    listPolicies(): Promise<ApprovalPolicy[]>;
    /**
     * Toggle policy enabled state
     */
    togglePolicy(id: string, enabled: boolean): Promise<ApprovalPolicy | null>;
    /**
     * Delete policy
     */
    deletePolicy(id: string): Promise<boolean>;
    /**
     * Submit transaction for approval
     */
    submitForApproval(tx: {
        type: PendingTransaction['type'];
        fromWalletId: string;
        toAddress: string;
        toName?: string;
        amount: string;
        chain: string;
        targetChain?: string;
        memo?: string;
        requestedBy: string;
    }): Promise<PendingTransaction | {
        approved: true;
    }>;
    /**
     * Approve or reject a pending transaction
     */
    decide(txId: string, approverId: string, decision: 'approve' | 'reject', note?: string): Promise<PendingTransaction | null>;
    /**
     * Mark transaction as executed
     */
    markExecuted(txId: string, txHash: string): Promise<PendingTransaction | null>;
    /**
     * Cancel a pending transaction
     */
    cancel(txId: string, requesterId: string): Promise<PendingTransaction | null>;
    /**
     * Get pending transactions
     */
    getPending(options?: {
        status?: PendingTransaction['status'];
        approverId?: string;
    }): Promise<PendingTransaction[]>;
    /**
     * Check and expire old transactions
     */
    processExpired(): Promise<PendingTransaction[]>;
    /**
     * Get daily spending for a wallet
     */
    getDailySpending(walletId: string): Promise<DailySpending | null>;
    /**
     * Record spending
     */
    private recordSpending;
    /**
     * Get spending history
     */
    getSpendingHistory(walletId: string, days?: number): Promise<DailySpending[]>;
    /**
     * Format pending transaction for display
     */
    formatPendingTx(tx: PendingTransaction): string;
    private shortAddress;
    /**
     * Create default approval policy for new users
     */
    createDefaultPolicy(approverIds: string[]): Promise<ApprovalPolicy>;
}
export default ApprovalManager;
//# sourceMappingURL=approvals.d.ts.map