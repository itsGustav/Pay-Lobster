"use strict";
/**
 * ERC-8004 Trustless Agents - Main Export
 *
 * Complete integration for agent identity, reputation, and discovery.
 * Designed for seamless integration with USDC payments and x402 protocol.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC8004Client = void 0;
exports.createTrustedX402Payment = createTrustedX402Payment;
exports.createERC8004Client = createERC8004Client;
__exportStar(require("./constants"), exports);
__exportStar(require("./identity"), exports);
__exportStar(require("./reputation"), exports);
__exportStar(require("./discovery"), exports);
const constants_1 = require("./constants");
const identity_1 = require("./identity");
const reputation_1 = require("./reputation");
const discovery_1 = require("./discovery");
/**
 * Unified ERC-8004 Client
 *
 * Provides high-level API for agent registration, discovery, and trust management.
 */
class ERC8004Client {
    constructor(config) {
        this.chain = config.chain;
        this.config = config;
        this.identity = new identity_1.IdentityClient({
            chain: config.chain,
            privateKey: config.privateKey,
        });
        this.reputation = new reputation_1.ReputationClient({
            chain: config.chain,
            privateKey: config.privateKey,
        });
        this.discovery = new discovery_1.DiscoveryService({
            chain: config.chain,
            privateKey: config.privateKey,
        });
    }
    /**
     * Register this agent with the ERC-8004 Identity Registry
     */
    async registerAgent(options) {
        const registration = (0, identity_1.createLobsterAgentRegistration)({
            name: options.name,
            description: options.description,
            image: options.image,
            chain: this.chain,
            capabilities: options.capabilities,
            paymentAddress: this.config.paymentAddress,
            x402Endpoint: this.config.x402Endpoint,
            escrowSupport: true,
            mcpEndpoint: options.mcpEndpoint,
            a2aEndpoint: options.a2aEndpoint,
        });
        this.myAgentId = await this.identity.register(registration);
        return this.myAgentId;
    }
    /**
     * Get my agent ID (if registered)
     */
    getMyAgentId() {
        return this.myAgentId;
    }
    /**
     * Set agent ID (if already registered)
     */
    setMyAgentId(agentId) {
        this.myAgentId = agentId;
    }
    /**
     * Verify an agent before transacting
     */
    async verifyAgent(agentId) {
        return this.discovery.verifyAgent(agentId);
    }
    /**
     * Check if payment is safe for an agent
     */
    async isPaymentSafe(agentId, amountUsdc) {
        return this.discovery.checkPaymentSafety(agentId, amountUsdc);
    }
    /**
     * Post feedback after a transaction
     */
    async postFeedback(options) {
        return this.reputation.postFeedback({
            agentId: options.agentId,
            score: options.score,
            context: options.context,
            taskHash: options.txHash,
        });
    }
    /**
     * Post positive feedback after successful payment
     */
    async postPaymentSuccess(agentId, txHash, amount) {
        const { score, context } = reputation_1.FeedbackTemplates.paymentSuccessful(txHash, amount);
        return this.postFeedback({ agentId, score, context, txHash });
    }
    /**
     * Post negative feedback after failed payment
     */
    async postPaymentFailure(agentId, reason) {
        const { score, context } = reputation_1.FeedbackTemplates.paymentFailed(reason);
        return this.postFeedback({ agentId, score, context });
    }
    /**
     * Post feedback after escrow completion
     */
    async postEscrowFeedback(agentId, escrowId, outcome, reason) {
        if (outcome === 'disputed') {
            const { score, context } = reputation_1.FeedbackTemplates.escrowDisputed(escrowId, reason || 'Unknown');
            return this.postFeedback({ agentId, score, context });
        }
        const { score, context } = reputation_1.FeedbackTemplates.escrowCompleted(escrowId, outcome);
        return this.postFeedback({ agentId, score, context });
    }
    /**
     * Find agents for payment
     */
    async findPaymentAgents(minTrustScore) {
        return this.discovery.findPaymentAgents({ minTrustScore });
    }
    /**
     * Find agents with escrow capability
     */
    async findEscrowAgents(minTrustLevel) {
        return this.discovery.findEscrowAgents({ minTrustLevel });
    }
    /**
     * Get my reputation summary
     */
    async getMyReputation() {
        if (!this.myAgentId)
            return null;
        return this.reputation.getReputationSummary(this.myAgentId);
    }
    /**
     * Get contract addresses for this chain
     */
    getContractAddresses() {
        return constants_1.CHAIN_CONFIG[this.chain].contracts;
    }
    /**
     * Get the agent registry identifier
     */
    getAgentRegistry() {
        return this.identity.getAgentRegistry();
    }
}
exports.ERC8004Client = ERC8004Client;
/**
 * Integration helper: Wrap x402 payment with trust verification
 */
async function createTrustedX402Payment(options) {
    // Verify agent first
    const verification = await options.erc8004.verifyAgent(options.targetAgentId);
    if (!verification.verified) {
        return {
            success: false,
            trustScore: verification.trustScore,
            feedbackPosted: false,
            error: `Agent verification failed: ${verification.reasons.join(', ')}`,
        };
    }
    // Check payment safety
    const safety = await options.erc8004.isPaymentSafe(options.targetAgentId, options.amountUsdc);
    if (!safety.safe) {
        console.warn(`Payment exceeds recommended limit: ${safety.reason}`);
        // Continue anyway, but warn
    }
    // Execute payment
    const result = await options.paymentFn();
    // Post feedback
    let feedbackPosted = false;
    try {
        if (result.success && result.txHash) {
            await options.erc8004.postPaymentSuccess(options.targetAgentId, result.txHash, options.amountUsdc.toString());
            feedbackPosted = true;
        }
        else if (!result.success) {
            await options.erc8004.postPaymentFailure(options.targetAgentId, result.error || 'Unknown error');
            feedbackPosted = true;
        }
    }
    catch (e) {
        console.warn('Failed to post feedback:', e);
    }
    return {
        success: result.success,
        txHash: result.txHash,
        trustScore: verification.trustScore,
        feedbackPosted,
        error: result.error,
    };
}
/**
 * Quick setup helper
 */
function createERC8004Client(chain, privateKey, options) {
    return new ERC8004Client({
        chain,
        privateKey,
        paymentAddress: options?.paymentAddress,
        x402Endpoint: options?.x402Endpoint,
    });
}
//# sourceMappingURL=index.js.map