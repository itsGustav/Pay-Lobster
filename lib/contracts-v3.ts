/**
 * Pay Lobster V3 Contract Wrappers
 * Enhanced contract interactions with Identity, Reputation, Credit, and Escrow
 */

import { ethers, Contract, Wallet, Provider } from 'ethers';
import PayLobsterIdentityABI from './abis/PayLobsterIdentity.json';
import PayLobsterReputationABI from './abis/PayLobsterReputation.json';
import PayLobsterCreditABI from './abis/PayLobsterCredit.json';
import PayLobsterEscrowV3ABI from './abis/PayLobsterEscrowV3.json';
import IERC20ABI from './abis/IERC20.json';

// V3 Contract Addresses on Base Mainnet
export const V3_ADDRESSES = {
  Identity: '0xA174ee274F870631B3c330a85EBCad74120BE662',
  Reputation: '0x02bb4132a86134684976E2a52E43D59D89E64b29',
  Credit: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1',
  Escrow: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// Type definitions
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
  status: number; // 0: Active, 1: Repaid, 2: Defaulted
}

export interface EscrowInfo {
  id: bigint;
  payer: string;
  payee: string;
  amount: bigint;
  status: number; // 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Disputed
  createdAt: bigint;
  fundedAt: bigint;
  completedAt: bigint;
  description: string;
  metadata: string;
}

/**
 * PayLobsterIdentity - Agent registration and identity management
 */
export class PayLobsterIdentity {
  public contract: Contract;
  public address: string;

  constructor(signerOrProvider: Wallet | Provider, address?: string) {
    this.address = address || V3_ADDRESSES.Identity;
    this.contract = new Contract(this.address, PayLobsterIdentityABI, signerOrProvider);
  }

  /**
   * Register a new agent
   */
  async register(metadata: AgentMetadata): Promise<ethers.ContractTransactionResponse> {
    const metadataStr = JSON.stringify(metadata);
    return await this.contract.register(metadataStr);
  }

  /**
   * Get agent info by address
   */
  async getAgent(address: string): Promise<AgentInfo | null> {
    try {
      const agentId = await this.contract.getAgentId(address);
      if (agentId === 0n) return null;

      const owner = await this.contract.ownerOf(agentId);
      const metadataStr = await this.contract.agentMetadata(agentId);
      const metadata = JSON.parse(metadataStr || '{}');

      return {
        id: agentId,
        owner,
        metadata,
        registered: true,
        active: true,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if an address is registered
   */
  async isRegistered(address: string): Promise<boolean> {
    return await this.contract.isRegistered(address);
  }

  /**
   * Get agent ID by address
   */
  async getAgentId(address: string): Promise<bigint> {
    return await this.contract.getAgentId(address);
  }

  /**
   * Get total number of registered agents
   */
  async getTotalAgents(): Promise<bigint> {
    return await this.contract.totalAgents();
  }

  /**
   * Update agent metadata
   */
  async updateMetadata(metadata: AgentMetadata): Promise<ethers.ContractTransactionResponse> {
    const metadataStr = JSON.stringify(metadata);
    return await this.contract.updateMetadata(metadataStr);
  }

  /**
   * Deactivate agent
   */
  async deactivate(): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.deactivate();
  }

  /**
   * Reactivate agent
   */
  async reactivate(): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.reactivate();
  }
}

/**
 * PayLobsterReputation - Agent reputation and feedback system
 */
export class PayLobsterReputation {
  public contract: Contract;
  public address: string;

  constructor(signerOrProvider: Wallet | Provider, address?: string) {
    this.address = address || V3_ADDRESSES.Reputation;
    this.contract = new Contract(this.address, PayLobsterReputationABI, signerOrProvider);
  }

  /**
   * Get agent's overall trust score (0-1000)
   */
  async getTrustScore(agentAddress: string): Promise<number> {
    const score = await this.contract.getTrustScore(agentAddress);
    return Number(score);
  }

  /**
   * Get detailed trust vector for an agent
   */
  async getTrustVector(agentAddress: string): Promise<TrustVector> {
    const vector = await this.contract.getTrustVector(agentAddress);
    return {
      payment: Number(vector[0]),
      delivery: Number(vector[1]),
      quality: Number(vector[2]),
      response: Number(vector[3]),
      security: Number(vector[4]),
    };
  }

  /**
   * Get category-specific score
   * Categories: 0=Payment, 1=Delivery, 2=Quality, 3=Response, 4=Security
   */
  async getCategoryScore(agentAddress: string, category: number): Promise<number> {
    const score = await this.contract.getCategoryScore(agentAddress, category);
    return Number(score);
  }

  /**
   * Get recent feedback for an agent
   */
  async getRecentFeedback(agentAddress: string, limit: number = 10): Promise<FeedbackEntry[]> {
    const feedback = await this.contract.getRecentFeedback(agentAddress, limit);
    return feedback.map((f: any) => ({
      id: f.id,
      escrowId: f.escrowId,
      rater: f.rater,
      rated: f.rated,
      rating: Number(f.rating),
      category: Number(f.category),
      comment: f.comment,
      timestamp: f.timestamp,
    }));
  }

  /**
   * Get total feedback count for an agent
   */
  async getFeedbackCount(agentAddress: string): Promise<bigint> {
    return await this.contract.getFeedbackCount(agentAddress);
  }

  /**
   * Submit feedback for an escrow transaction
   */
  async submitFeedback(
    escrowId: bigint,
    ratedAgent: string,
    rating: number,
    category: number,
    comment: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.submitFeedback(escrowId, ratedAgent, rating, category, comment);
  }

  /**
   * Check if user can rate an escrow
   */
  async canRate(escrowId: bigint, rater: string): Promise<boolean> {
    return await this.contract.canRate(escrowId, rater);
  }
}

/**
 * PayLobsterCredit - Agent credit scoring and lending
 */
export class PayLobsterCredit {
  public contract: Contract;
  public address: string;

  constructor(signerOrProvider: Wallet | Provider, address?: string) {
    this.address = address || V3_ADDRESSES.Credit;
    this.contract = new Contract(this.address, PayLobsterCreditABI, signerOrProvider);
  }

  /**
   * Get agent's credit score (0-1000)
   */
  async getScore(agentAddress: string): Promise<number> {
    const score = await this.contract.getScore(agentAddress);
    return Number(score);
  }

  /**
   * Get agent's credit limit (in USDC)
   */
  async getCreditLimit(agentAddress: string): Promise<bigint> {
    return await this.contract.getCreditLimit(agentAddress);
  }

  /**
   * Get available credit (limit - used)
   */
  async getAvailableCredit(agentAddress: string): Promise<bigint> {
    return await this.contract.getAvailableCredit(agentAddress);
  }

  /**
   * Get full credit profile
   */
  async getProfile(agentAddress: string): Promise<CreditProfile> {
    const profile = await this.contract.getProfile(agentAddress);
    return {
      score: Number(profile.score),
      limit: profile.limit,
      used: profile.used,
      available: profile.available,
      activeLoans: profile.activeLoans,
      totalBorrowed: profile.totalBorrowed,
      totalRepaid: profile.totalRepaid,
      defaultCount: profile.defaultCount,
      lastUpdated: profile.lastUpdated,
    };
  }

  /**
   * Get active loans for an agent
   */
  async getActiveLoans(agentAddress: string): Promise<LoanInfo[]> {
    const loans = await this.contract.getActiveLoans(agentAddress);
    return loans.map((loan: any) => ({
      id: loan.id,
      borrower: loan.borrower,
      amount: loan.amount,
      repaidAmount: loan.repaidAmount,
      dueDate: loan.dueDate,
      repaidAt: loan.repaidAt,
      status: Number(loan.status),
    }));
  }

  /**
   * Check if agent has active debt
   */
  async hasActiveDebt(agentAddress: string): Promise<boolean> {
    return await this.contract.hasActiveDebt(agentAddress);
  }

  /**
   * Check if agent is eligible for credit amount
   */
  async checkCreditEligibility(agentAddress: string, amount: bigint): Promise<boolean> {
    return await this.contract.checkCreditEligibility(agentAddress, amount);
  }

  /**
   * Sync credit score from reputation
   */
  async syncFromReputation(agentAddress: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.syncFromReputation(agentAddress);
  }
}

/**
 * PayLobsterEscrow - Escrow and payment management with credit support
 */
export class PayLobsterEscrow {
  public contract: Contract;
  public address: string;
  private usdcContract: Contract;

  constructor(signerOrProvider: Wallet | Provider, address?: string) {
    this.address = address || V3_ADDRESSES.Escrow;
    this.contract = new Contract(this.address, PayLobsterEscrowV3ABI, signerOrProvider);
    this.usdcContract = new Contract(V3_ADDRESSES.USDC, IERC20ABI, signerOrProvider);
  }

  /**
   * Create a new escrow
   */
  async create(
    payee: string,
    amount: bigint,
    description: string,
    metadata: string = ''
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.createEscrow(payee, amount, description, metadata);
  }

  /**
   * Fund an existing escrow
   */
  async fund(escrowId: bigint): Promise<ethers.ContractTransactionResponse> {
    // First approve USDC
    const escrow = await this.getEscrow(escrowId);
    await this.usdcContract.approve(this.address, escrow.amount);
    
    return await this.contract.fundEscrow(escrowId);
  }

  /**
   * Create and fund escrow in one transaction (with credit support)
   */
  async createAndFund(
    payee: string,
    amount: bigint,
    description: string,
    useCredit: boolean = false,
    metadata: string = ''
  ): Promise<ethers.ContractTransactionResponse> {
    // Approve USDC if not using credit
    if (!useCredit) {
      await this.usdcContract.approve(this.address, amount);
    }
    
    return await this.contract.createAndFundEscrow(payee, amount, description, useCredit, metadata);
  }

  /**
   * Release funds to payee
   */
  async release(escrowId: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.releaseEscrow(escrowId);
  }

  /**
   * Request refund (payee must approve)
   */
  async refund(escrowId: bigint, reason: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.requestRefund(escrowId, reason);
  }

  /**
   * Approve refund request (payee only)
   */
  async approveRefund(escrowId: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.approveRefund(escrowId);
  }

  /**
   * Submit rating after escrow completion
   */
  async rate(
    escrowId: bigint,
    ratedAgent: string,
    rating: number,
    category: number,
    comment: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.submitRating(escrowId, ratedAgent, rating, category, comment);
  }

  /**
   * Get escrow details
   */
  async getEscrow(escrowId: bigint): Promise<EscrowInfo> {
    const escrow = await this.contract.getEscrow(escrowId);
    return {
      id: escrowId,
      payer: escrow.payer,
      payee: escrow.payee,
      amount: escrow.amount,
      status: Number(escrow.status),
      createdAt: escrow.createdAt,
      fundedAt: escrow.fundedAt,
      completedAt: escrow.completedAt,
      description: escrow.description,
      metadata: escrow.metadata,
    };
  }

  /**
   * Get escrow status
   * 0: Created, 1: Funded, 2: Released, 3: Refunded, 4: Disputed
   */
  async getEscrowStatus(escrowId: bigint): Promise<number> {
    const status = await this.contract.getEscrowStatus(escrowId);
    return Number(status);
  }

  /**
   * Cancel unfunded escrow
   */
  async cancel(escrowId: bigint): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.cancelEscrow(escrowId);
  }

  /**
   * Repay credit used in escrow
   */
  async repayCredit(escrowId: bigint, amount: bigint): Promise<ethers.ContractTransactionResponse> {
    // Approve USDC
    await this.usdcContract.approve(this.address, amount);
    
    return await this.contract.repayCredit(escrowId, amount);
  }

  /**
   * Check if user can rate an escrow
   */
  async canRate(escrowId: bigint, rater: string): Promise<boolean> {
    return await this.contract.canRate(escrowId, rater);
  }
}

/**
 * Create all V3 contract instances
 */
export function createV3Contracts(signerOrProvider: Wallet | Provider) {
  return {
    identity: new PayLobsterIdentity(signerOrProvider),
    reputation: new PayLobsterReputation(signerOrProvider),
    credit: new PayLobsterCredit(signerOrProvider),
    escrow: new PayLobsterEscrow(signerOrProvider),
  };
}
