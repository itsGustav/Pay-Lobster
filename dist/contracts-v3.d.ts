/**
 * Pay Lobster V3 Contract Wrappers
 * Enhanced contract interactions with Identity, Reputation, Credit, and Escrow
 */
import { ethers, Contract, Wallet, Provider } from 'ethers';
export declare const V3_ADDRESSES: {
    Identity: string;
    Reputation: string;
    Credit: string;
    Escrow: string;
    USDC: string;
};
export interface AgentMetadata {
    name: string;
    description: string;
    category: string;
    capabilities: string[];
    contact: string;
}
export interface AgentInfo {
    id: bigint;
    owner: string;
    metadata: AgentMetadata;
    registered: boolean;
    active: boolean;
}
export interface TrustVector {
    payment: number;
    delivery: number;
    quality: number;
    response: number;
    security: number;
}
export interface FeedbackEntry {
    id: bigint;
    escrowId: bigint;
    rater: string;
    rated: string;
    rating: number;
    category: number;
    comment: string;
    timestamp: bigint;
}
export interface CreditProfile {
    score: number;
    limit: bigint;
    used: bigint;
    available: bigint;
    activeLoans: bigint;
    totalBorrowed: bigint;
    totalRepaid: bigint;
    defaultCount: bigint;
    lastUpdated: bigint;
}
export interface LoanInfo {
    id: bigint;
    borrower: string;
    amount: bigint;
    repaidAmount: bigint;
    dueDate: bigint;
    repaidAt: bigint;
    status: number;
}
export interface EscrowInfo {
    id: bigint;
    payer: string;
    payee: string;
    amount: bigint;
    status: number;
    createdAt: bigint;
    fundedAt: bigint;
    completedAt: bigint;
    description: string;
    metadata: string;
}
/**
 * PayLobsterIdentity - Agent registration and identity management
 */
export declare class PayLobsterIdentity {
    contract: Contract;
    address: string;
    constructor(signerOrProvider: Wallet | Provider, address?: string);
    /**
     * Register a new agent
     */
    register(metadata: AgentMetadata): Promise<ethers.ContractTransactionResponse>;
    /**
     * Get agent info by address
     */
    getAgent(address: string): Promise<AgentInfo | null>;
    /**
     * Check if an address is registered
     */
    isRegistered(address: string): Promise<boolean>;
    /**
     * Get agent ID by address
     */
    getAgentId(address: string): Promise<bigint>;
    /**
     * Get total number of registered agents
     */
    getTotalAgents(): Promise<bigint>;
    /**
     * Update agent metadata
     */
    updateMetadata(metadata: AgentMetadata): Promise<ethers.ContractTransactionResponse>;
    /**
     * Deactivate agent
     */
    deactivate(): Promise<ethers.ContractTransactionResponse>;
    /**
     * Reactivate agent
     */
    reactivate(): Promise<ethers.ContractTransactionResponse>;
}
/**
 * PayLobsterReputation - Agent reputation and feedback system
 */
export declare class PayLobsterReputation {
    contract: Contract;
    address: string;
    constructor(signerOrProvider: Wallet | Provider, address?: string);
    /**
     * Get agent's overall trust score (0-1000)
     */
    getTrustScore(agentAddress: string): Promise<number>;
    /**
     * Get detailed trust vector for an agent
     */
    getTrustVector(agentAddress: string): Promise<TrustVector>;
    /**
     * Get category-specific score
     * Categories: 0=Payment, 1=Delivery, 2=Quality, 3=Response, 4=Security
     */
    getCategoryScore(agentAddress: string, category: number): Promise<number>;
    /**
     * Get recent feedback for an agent
     */
    getRecentFeedback(agentAddress: string, limit?: number): Promise<FeedbackEntry[]>;
    /**
     * Get total feedback count for an agent
     */
    getFeedbackCount(agentAddress: string): Promise<bigint>;
    /**
     * Submit feedback for an escrow transaction
     */
    submitFeedback(escrowId: bigint, ratedAgent: string, rating: number, category: number, comment: string): Promise<ethers.ContractTransactionResponse>;
    /**
     * Check if user can rate an escrow
     */
    canRate(escrowId: bigint, rater: string): Promise<boolean>;
}
/**
 * PayLobsterCredit - Agent credit scoring and lending
 */
export declare class PayLobsterCredit {
    contract: Contract;
    address: string;
    constructor(signerOrProvider: Wallet | Provider, address?: string);
    /**
     * Get agent's credit score (0-1000)
     */
    getScore(agentAddress: string): Promise<number>;
    /**
     * Get agent's credit limit (in USDC)
     */
    getCreditLimit(agentAddress: string): Promise<bigint>;
    /**
     * Get available credit (limit - used)
     */
    getAvailableCredit(agentAddress: string): Promise<bigint>;
    /**
     * Get full credit profile
     */
    getProfile(agentAddress: string): Promise<CreditProfile>;
    /**
     * Get active loans for an agent
     */
    getActiveLoans(agentAddress: string): Promise<LoanInfo[]>;
    /**
     * Check if agent has active debt
     */
    hasActiveDebt(agentAddress: string): Promise<boolean>;
    /**
     * Check if agent is eligible for credit amount
     */
    checkCreditEligibility(agentAddress: string, amount: bigint): Promise<boolean>;
    /**
     * Sync credit score from reputation
     */
    syncFromReputation(agentAddress: string): Promise<ethers.ContractTransactionResponse>;
}
/**
 * PayLobsterEscrow - Escrow and payment management with credit support
 */
export declare class PayLobsterEscrow {
    contract: Contract;
    address: string;
    private usdcContract;
    constructor(signerOrProvider: Wallet | Provider, address?: string);
    /**
     * Create a new escrow
     */
    create(payee: string, amount: bigint, description: string, metadata?: string): Promise<ethers.ContractTransactionResponse>;
    /**
     * Fund an existing escrow
     */
    fund(escrowId: bigint): Promise<ethers.ContractTransactionResponse>;
    /**
     * Create and fund escrow in one transaction (with credit support)
     */
    createAndFund(payee: string, amount: bigint, description: string, useCredit?: boolean, metadata?: string): Promise<ethers.ContractTransactionResponse>;
    /**
     * Release funds to payee
     */
    release(escrowId: bigint): Promise<ethers.ContractTransactionResponse>;
    /**
     * Request refund (payee must approve)
     */
    refund(escrowId: bigint, reason: string): Promise<ethers.ContractTransactionResponse>;
    /**
     * Approve refund request (payee only)
     */
    approveRefund(escrowId: bigint): Promise<ethers.ContractTransactionResponse>;
    /**
     * Submit rating after escrow completion
     */
    rate(escrowId: bigint, ratedAgent: string, rating: number, category: number, comment: string): Promise<ethers.ContractTransactionResponse>;
    /**
     * Get escrow details
     */
    getEscrow(escrowId: bigint): Promise<EscrowInfo>;
    /**
     * Get escrow status
     * 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Disputed
     */
    getEscrowStatus(escrowId: bigint): Promise<number>;
    /**
     * Cancel unfunded escrow
     */
    cancel(escrowId: bigint): Promise<ethers.ContractTransactionResponse>;
    /**
     * Repay credit used in escrow
     */
    repayCredit(escrowId: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse>;
    /**
     * Check if user can rate an escrow
     */
    canRate(escrowId: bigint, rater: string): Promise<boolean>;
}
/**
 * Create all V3 contract instances
 */
export declare function createV3Contracts(signerOrProvider: Wallet | Provider): {
    identity: PayLobsterIdentity;
    reputation: PayLobsterReputation;
    credit: PayLobsterCredit;
    escrow: PayLobsterEscrow;
};
//# sourceMappingURL=contracts-v3.d.ts.map