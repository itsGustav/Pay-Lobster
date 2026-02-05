/**
 * Universal Escrow Module (Escrow as a Service - EaaS)
 *
 * Smart contract-style escrow for multiple verticals:
 * - Real estate (earnest money, security deposits, closing)
 * - Freelance/Services (milestones, deliverables)
 * - Commerce (purchases, trades, swaps)
 * - P2P (OTC trades, loans)
 * - Digital (licenses, subscriptions, content)
 * - Custom (user-defined)
 */
import type { BuiltCondition } from './condition-builder';
export type EscrowType = 'earnest_money' | 'security_deposit' | 'closing_funds' | 'milestone' | 'freelance' | 'purchase' | 'trade' | 'general';
export type EscrowStatus = 'created' | 'funded' | 'pending_release' | 'released' | 'refunded' | 'disputed' | 'cancelled';
/**
 * Standard roles across verticals
 */
export type StandardRole = 'depositor' | 'recipient' | 'buyer' | 'seller' | 'client' | 'provider' | 'landlord' | 'tenant' | 'agent' | 'title_company' | 'arbiter' | 'witness' | 'lender' | 'borrower' | 'party_a' | 'party_b' | 'marketplace' | 'platform' | 'consultant' | 'contractor' | 'inspector' | 'vendor' | 'subscriber' | 'creator';
export interface EscrowParty {
    role: StandardRole | string;
    name: string;
    email?: string;
    phone?: string;
    walletAddress?: string;
    sessionId?: string;
}
export interface EscrowCondition {
    id: string;
    description: string;
    type: 'inspection' | 'financing' | 'appraisal' | 'title' | 'closing' | 'move_out' | 'milestone' | 'delivery' | 'approval' | 'revision' | 'shipping' | 'receipt' | 'verification' | 'document' | 'deadline' | 'custom';
    status: 'pending' | 'satisfied' | 'waived' | 'failed';
    deadline?: string;
    satisfiedAt?: string;
    satisfiedBy?: string;
    evidence?: string;
    releaseAmount?: string;
    releasePercentage?: string;
    metadata?: Record<string, any>;
}
export interface Escrow {
    id: string;
    type: EscrowType;
    status: EscrowStatus;
    property?: {
        address: string;
        city: string;
        state: string;
        zip: string;
        mlsNumber?: string;
    };
    parties: EscrowParty[];
    amount: string;
    chain: string;
    escrowAddress: string;
    fundingTxHash?: string;
    fundedAt?: string;
    conditions: EscrowCondition[];
    releaseRequires: 'all_conditions' | 'majority_approval' | 'any_party';
    approvals: {
        partyRole: string;
        approved: boolean;
        timestamp: string;
        note?: string;
    }[];
    requiredApprovals: string[];
    releaseTo?: string;
    releaseToRole?: string;
    releaseTxHash?: string;
    releasedAt?: string;
    dispute?: {
        raisedBy: string;
        reason: string;
        raisedAt: string;
        resolution?: string;
        resolvedAt?: string;
    };
    fundingDeadline?: string;
    closingDate?: string;
    leaseEndDate?: string;
    notes?: string;
    documents: {
        name: string;
        url: string;
        uploadedAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}
/**
 * Escrow Manager
 */
export declare class EscrowManager {
    private dataPath;
    constructor(dataDir?: string);
    private loadEscrows;
    private saveEscrows;
    /**
     * Create earnest money escrow
     */
    createEarnestMoney(params: {
        property: Escrow['property'];
        amount: string;
        chain: string;
        buyer: Omit<EscrowParty, 'role'>;
        seller: Omit<EscrowParty, 'role'>;
        agent?: Omit<EscrowParty, 'role'>;
        closingDate?: string;
        conditions?: Omit<EscrowCondition, 'id' | 'status'>[];
    }): Promise<Escrow>;
    /**
     * Create rental security deposit escrow
     */
    createSecurityDeposit(params: {
        property: Escrow['property'];
        amount: string;
        chain: string;
        landlord: Omit<EscrowParty, 'role'>;
        tenant: Omit<EscrowParty, 'role'>;
        leaseEndDate: string;
    }): Promise<Escrow>;
    /**
     * Create general escrow
     */
    createGeneral(params: {
        amount: string;
        chain: string;
        depositor: Omit<EscrowParty, 'role'>;
        recipient: Omit<EscrowParty, 'role'>;
        conditions?: Omit<EscrowCondition, 'id' | 'status'>[];
        description?: string;
    }): Promise<Escrow>;
    /**
     * Create milestone escrow for freelance/service work
     */
    createMilestone(params: {
        amount: string;
        chain: string;
        client: Omit<EscrowParty, 'role'>;
        freelancer: Omit<EscrowParty, 'role'>;
        projectName: string;
        milestones: {
            description: string;
            amount?: string;
            percentage?: string;
            deadline?: string;
        }[];
    }): Promise<Escrow>;
    /**
     * Create purchase escrow (buyer/seller goods transaction)
     */
    createPurchase(params: {
        amount: string;
        chain: string;
        buyer: Omit<EscrowParty, 'role'>;
        seller: Omit<EscrowParty, 'role'>;
        itemDescription: string;
        requiresShipping?: boolean;
        inspectionPeriodDays?: number;
    }): Promise<Escrow>;
    /**
     * Release partial amount (for milestone escrows)
     */
    releasePartial(escrowId: string, conditionId: string, toAddress: string, txHash: string): Promise<Escrow | null>;
    /**
     * Get escrow by ID
     */
    get(id: string): Promise<Escrow | null>;
    /**
     * List escrows with filters
     */
    list(filters?: {
        type?: EscrowType;
        status?: EscrowStatus;
        partyAddress?: string;
        propertyAddress?: string;
    }): Promise<Escrow[]>;
    /**
     * Mark escrow as funded
     */
    markFunded(id: string, txHash: string): Promise<Escrow | null>;
    /**
     * Satisfy a condition
     */
    satisfyCondition(escrowId: string, conditionId: string, satisfiedBy: string, evidence?: string): Promise<Escrow | null>;
    /**
     * Waive a condition
     */
    waiveCondition(escrowId: string, conditionId: string, waivedBy: string): Promise<Escrow | null>;
    /**
     * Fail a condition (triggers refund flow)
     */
    failCondition(escrowId: string, conditionId: string, reason: string): Promise<Escrow | null>;
    /**
     * Submit approval for release
     */
    approve(escrowId: string, partyRole: string, note?: string): Promise<Escrow | null>;
    /**
     * Execute release
     */
    release(escrowId: string, toAddress: string, txHash: string): Promise<Escrow | null>;
    /**
     * Execute refund
     */
    refund(escrowId: string, txHash: string): Promise<Escrow | null>;
    /**
     * Raise dispute
     */
    raiseDispute(escrowId: string, raisedBy: string, reason: string): Promise<Escrow | null>;
    /**
     * Cancel escrow (before funding)
     */
    cancel(escrowId: string): Promise<Escrow | null>;
    /**
     * Add document to escrow
     */
    addDocument(escrowId: string, name: string, url: string): Promise<Escrow | null>;
    /**
     * Create escrow from template
     *
     * @example
     * await escrowManager.create({
     *   template: 'project_milestone',
     *   amount: '1000',
     *   chain: 'polygon',
     *   parties: [
     *     { role: 'client', name: 'Alice' },
     *     { role: 'provider', name: 'Bob' }
     *   ]
     * })
     */
    create(params: {
        template: string;
        amount: string;
        chain: string;
        parties: Omit<EscrowParty, 'role'> & {
            role: string;
        }[];
        customConditions?: Omit<EscrowCondition, 'id' | 'status'>[];
        metadata?: Record<string, any>;
        autoReleaseDays?: number;
    }): Promise<Escrow>;
    /**
     * Create custom escrow with builder conditions
     *
     * @example
     * import { ConditionBuilder } from './condition-builder';
     *
     * await escrowManager.createCustom({
     *   amount: '5000',
     *   chain: 'ethereum',
     *   parties: [
     *     { role: 'buyer', name: 'Alice' },
     *     { role: 'seller', name: 'Bob' }
     *   ],
     *   conditions: [
     *     ConditionBuilder.milestone('Phase 1', 30),
     *     ConditionBuilder.milestone('Phase 2', 70),
     *   ],
     *   releaseRequires: 'condition_based'
     * })
     */
    createCustom(params: {
        amount: string;
        chain: string;
        parties: Omit<EscrowParty, 'role'> & {
            role: string;
        }[];
        conditions: BuiltCondition[];
        releaseRequires?: 'all_conditions' | 'majority_approval' | 'condition_based' | 'any_party';
        requiredApprovals?: string[];
        metadata?: Record<string, any>;
        autoReleaseDays?: number;
    }): Promise<Escrow>;
    /**
     * Map vertical to legacy EscrowType
     */
    private mapVerticalToType;
    /**
     * Format escrow summary for display
     */
    formatEscrowSummary(escrow: Escrow): string;
    private generateEscrowAddress;
    private addDays;
}
/**
 * x402 Premium Escrow Features
 *
 * Gate premium escrow operations behind x402 payments
 */
export interface PremiumEscrowFeatures {
    yieldOptimization?: boolean;
    insurance?: boolean;
    prioritySupport?: boolean;
    analytics?: boolean;
}
export interface X402EscrowEndpoints {
    optimize: string;
    insure: string;
    analytics: string;
    support: string;
}
export declare const PREMIUM_ESCROW_PRICING: {
    yieldOptimization: string;
    insurance: string;
    prioritySupport: string;
    analytics: string;
};
/**
 * Generate x402 premium feature URLs for escrow
 */
export declare function generateX402EscrowUrls(escrowId: string, baseUrl?: string): X402EscrowEndpoints;
/**
 * Example: Enable premium features on escrow
 */
export declare function enablePremiumFeatures(escrow: Escrow, features: PremiumEscrowFeatures, x402Fetch: (url: string) => Promise<Response>): Promise<{
    enabled: string[];
    failed: string[];
}>;
export default EscrowManager;
//# sourceMappingURL=escrow.d.ts.map