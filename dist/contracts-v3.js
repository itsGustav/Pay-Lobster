"use strict";
/**
 * Pay Lobster V3 Contract Wrappers
 * Enhanced contract interactions with Identity, Reputation, Credit, and Escrow
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayLobsterEscrow = exports.PayLobsterCredit = exports.PayLobsterReputation = exports.PayLobsterIdentity = exports.V3_ADDRESSES = void 0;
exports.createV3Contracts = createV3Contracts;
const ethers_1 = require("ethers");
const PayLobsterIdentity_json_1 = __importDefault(require("./abis/PayLobsterIdentity.json"));
const PayLobsterReputation_json_1 = __importDefault(require("./abis/PayLobsterReputation.json"));
const PayLobsterCredit_json_1 = __importDefault(require("./abis/PayLobsterCredit.json"));
const PayLobsterEscrowV3_json_1 = __importDefault(require("./abis/PayLobsterEscrowV3.json"));
const IERC20_json_1 = __importDefault(require("./abis/IERC20.json"));
// V3 Contract Addresses on Base Mainnet
exports.V3_ADDRESSES = {
    Identity: '0xA174ee274F870631B3c330a85EBCad74120BE662',
    Reputation: '0x02bb4132a86134684976E2a52E43D59D89E64b29',
    Credit: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1',
    Escrow: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};
/**
 * PayLobsterIdentity - Agent registration and identity management
 */
class PayLobsterIdentity {
    constructor(signerOrProvider, address) {
        this.address = address || exports.V3_ADDRESSES.Identity;
        this.contract = new ethers_1.Contract(this.address, PayLobsterIdentity_json_1.default, signerOrProvider);
    }
    /**
     * Register a new agent
     */
    async register(metadata) {
        const metadataStr = JSON.stringify(metadata);
        return await this.contract.register(metadataStr);
    }
    /**
     * Get agent info by address
     */
    async getAgent(address) {
        try {
            const agentId = await this.contract.getAgentId(address);
            if (agentId === 0n)
                return null;
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
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if an address is registered
     */
    async isRegistered(address) {
        return await this.contract.isRegistered(address);
    }
    /**
     * Get agent ID by address
     */
    async getAgentId(address) {
        return await this.contract.getAgentId(address);
    }
    /**
     * Get total number of registered agents
     */
    async getTotalAgents() {
        return await this.contract.totalAgents();
    }
    /**
     * Update agent metadata
     */
    async updateMetadata(metadata) {
        const metadataStr = JSON.stringify(metadata);
        return await this.contract.updateMetadata(metadataStr);
    }
    /**
     * Deactivate agent
     */
    async deactivate() {
        return await this.contract.deactivate();
    }
    /**
     * Reactivate agent
     */
    async reactivate() {
        return await this.contract.reactivate();
    }
}
exports.PayLobsterIdentity = PayLobsterIdentity;
/**
 * PayLobsterReputation - Agent reputation and feedback system
 */
class PayLobsterReputation {
    constructor(signerOrProvider, address) {
        this.address = address || exports.V3_ADDRESSES.Reputation;
        this.contract = new ethers_1.Contract(this.address, PayLobsterReputation_json_1.default, signerOrProvider);
    }
    /**
     * Get agent's overall trust score (0-1000)
     */
    async getTrustScore(agentAddress) {
        const score = await this.contract.getTrustScore(agentAddress);
        return Number(score);
    }
    /**
     * Get detailed trust vector for an agent
     */
    async getTrustVector(agentAddress) {
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
    async getCategoryScore(agentAddress, category) {
        const score = await this.contract.getCategoryScore(agentAddress, category);
        return Number(score);
    }
    /**
     * Get recent feedback for an agent
     */
    async getRecentFeedback(agentAddress, limit = 10) {
        const feedback = await this.contract.getRecentFeedback(agentAddress, limit);
        return feedback.map((f) => ({
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
    async getFeedbackCount(agentAddress) {
        return await this.contract.getFeedbackCount(agentAddress);
    }
    /**
     * Submit feedback for an escrow transaction
     */
    async submitFeedback(escrowId, ratedAgent, rating, category, comment) {
        return await this.contract.submitFeedback(escrowId, ratedAgent, rating, category, comment);
    }
    /**
     * Check if user can rate an escrow
     */
    async canRate(escrowId, rater) {
        return await this.contract.canRate(escrowId, rater);
    }
}
exports.PayLobsterReputation = PayLobsterReputation;
/**
 * PayLobsterCredit - Agent credit scoring and lending
 */
class PayLobsterCredit {
    constructor(signerOrProvider, address) {
        this.address = address || exports.V3_ADDRESSES.Credit;
        this.contract = new ethers_1.Contract(this.address, PayLobsterCredit_json_1.default, signerOrProvider);
    }
    /**
     * Get agent's credit score (0-1000)
     */
    async getScore(agentAddress) {
        const score = await this.contract.getScore(agentAddress);
        return Number(score);
    }
    /**
     * Get agent's credit limit (in USDC)
     */
    async getCreditLimit(agentAddress) {
        return await this.contract.getCreditLimit(agentAddress);
    }
    /**
     * Get available credit (limit - used)
     */
    async getAvailableCredit(agentAddress) {
        return await this.contract.getAvailableCredit(agentAddress);
    }
    /**
     * Get full credit profile
     */
    async getProfile(agentAddress) {
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
    async getActiveLoans(agentAddress) {
        const loans = await this.contract.getActiveLoans(agentAddress);
        return loans.map((loan) => ({
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
    async hasActiveDebt(agentAddress) {
        return await this.contract.hasActiveDebt(agentAddress);
    }
    /**
     * Check if agent is eligible for credit amount
     */
    async checkCreditEligibility(agentAddress, amount) {
        return await this.contract.checkCreditEligibility(agentAddress, amount);
    }
    /**
     * Sync credit score from reputation
     */
    async syncFromReputation(agentAddress) {
        return await this.contract.syncFromReputation(agentAddress);
    }
}
exports.PayLobsterCredit = PayLobsterCredit;
/**
 * PayLobsterEscrow - Escrow and payment management with credit support
 */
class PayLobsterEscrow {
    constructor(signerOrProvider, address) {
        this.address = address || exports.V3_ADDRESSES.Escrow;
        this.contract = new ethers_1.Contract(this.address, PayLobsterEscrowV3_json_1.default, signerOrProvider);
        this.usdcContract = new ethers_1.Contract(exports.V3_ADDRESSES.USDC, IERC20_json_1.default, signerOrProvider);
    }
    /**
     * Create a new escrow
     */
    async create(payee, amount, description, metadata = '') {
        return await this.contract.createEscrow(payee, amount, description, metadata);
    }
    /**
     * Fund an existing escrow
     */
    async fund(escrowId) {
        // First approve USDC
        const escrow = await this.getEscrow(escrowId);
        await this.usdcContract.approve(this.address, escrow.amount);
        return await this.contract.fundEscrow(escrowId);
    }
    /**
     * Create and fund escrow in one transaction (with credit support)
     */
    async createAndFund(payee, amount, description, useCredit = false, metadata = '') {
        // Approve USDC if not using credit
        if (!useCredit) {
            await this.usdcContract.approve(this.address, amount);
        }
        return await this.contract.createAndFundEscrow(payee, amount, description, useCredit, metadata);
    }
    /**
     * Release funds to payee
     */
    async release(escrowId) {
        return await this.contract.releaseEscrow(escrowId);
    }
    /**
     * Request refund (payee must approve)
     */
    async refund(escrowId, reason) {
        return await this.contract.requestRefund(escrowId, reason);
    }
    /**
     * Approve refund request (payee only)
     */
    async approveRefund(escrowId) {
        return await this.contract.approveRefund(escrowId);
    }
    /**
     * Submit rating after escrow completion
     */
    async rate(escrowId, ratedAgent, rating, category, comment) {
        return await this.contract.submitRating(escrowId, ratedAgent, rating, category, comment);
    }
    /**
     * Get escrow details
     */
    async getEscrow(escrowId) {
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
    async getEscrowStatus(escrowId) {
        const status = await this.contract.getEscrowStatus(escrowId);
        return Number(status);
    }
    /**
     * Cancel unfunded escrow
     */
    async cancel(escrowId) {
        return await this.contract.cancelEscrow(escrowId);
    }
    /**
     * Repay credit used in escrow
     */
    async repayCredit(escrowId, amount) {
        // Approve USDC
        await this.usdcContract.approve(this.address, amount);
        return await this.contract.repayCredit(escrowId, amount);
    }
    /**
     * Check if user can rate an escrow
     */
    async canRate(escrowId, rater) {
        return await this.contract.canRate(escrowId, rater);
    }
}
exports.PayLobsterEscrow = PayLobsterEscrow;
/**
 * Create all V3 contract instances
 */
function createV3Contracts(signerOrProvider) {
    return {
        identity: new PayLobsterIdentity(signerOrProvider),
        reputation: new PayLobsterReputation(signerOrProvider),
        credit: new PayLobsterCredit(signerOrProvider),
        escrow: new PayLobsterEscrow(signerOrProvider),
    };
}
//# sourceMappingURL=contracts-v3.js.map