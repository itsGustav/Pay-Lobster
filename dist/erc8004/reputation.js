"use strict";
/**
 * ERC-8004 Reputation Registry Client
 *
 * Post feedback, query reputation, and manage trust levels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackTemplates = exports.ReputationClient = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("./constants");
class ReputationClient {
    constructor(config) {
        this.chain = config.chain;
        const chainConfig = constants_1.CHAIN_CONFIG[config.chain];
        this.provider = config.provider || new ethers_1.ethers.JsonRpcProvider(chainConfig.rpcUrl);
        if (config.privateKey) {
            this.signer = new ethers_1.ethers.Wallet(config.privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(chainConfig.contracts.reputationRegistry, constants_1.REPUTATION_REGISTRY_ABI, this.signer);
        }
        this.readOnlyContract = new ethers_1.ethers.Contract(chainConfig.contracts.reputationRegistry, constants_1.REPUTATION_REGISTRY_ABI, this.provider);
    }
    /**
     * Post feedback for an agent
     *
     * @param feedback Feedback to post
     * @returns The feedbackId
     */
    async postFeedback(feedback) {
        if (!this.contract || !this.signer) {
            throw new Error('Signer required to post feedback');
        }
        // Validate score range
        if (feedback.score < -100 || feedback.score > 100) {
            throw new Error('Score must be between -100 and 100');
        }
        // Create task hash if not provided
        const taskHash = feedback.taskHash
            ? ethers_1.ethers.id(feedback.taskHash)
            : ethers_1.ethers.id(`feedback-${Date.now()}-${Math.random()}`);
        console.log(`Posting feedback for agent ${feedback.agentId}: score=${feedback.score}`);
        const tx = await this.contract.postFeedback(feedback.agentId, feedback.score, feedback.context, taskHash);
        const receipt = await tx.wait();
        // Extract feedbackId from event
        const event = receipt.logs.find((log) => {
            try {
                const parsed = this.contract.interface.parseLog(log);
                return parsed?.name === 'FeedbackPosted';
            }
            catch {
                return false;
            }
        });
        if (!event) {
            throw new Error('FeedbackPosted event not found');
        }
        const parsed = this.contract.interface.parseLog(event);
        const feedbackId = Number(parsed?.args?.feedbackId);
        console.log(`Feedback posted with ID: ${feedbackId}`);
        return feedbackId;
    }
    /**
     * Post feedback after a successful x402 payment
     *
     * Links the feedback to the payment transaction for verification
     */
    async postPaymentFeedback(options) {
        const enrichedContext = JSON.stringify({
            type: 'x402-payment-feedback',
            context: options.context,
            payment: {
                txHash: options.paymentTxHash,
                amount: options.paymentAmount,
                service: options.serviceUsed,
            },
            timestamp: new Date().toISOString(),
        });
        return this.postFeedback({
            agentId: options.agentId,
            score: options.score,
            context: enrichedContext,
            taskHash: options.paymentTxHash,
        });
    }
    /**
     * Get a specific feedback entry
     */
    async getFeedback(feedbackId) {
        try {
            const result = await this.readOnlyContract.getFeedback(feedbackId);
            return {
                feedbackId,
                agentId: Number(result.agentId),
                author: result.author,
                score: Number(result.score),
                context: result.context,
                taskHash: result.taskHash,
                timestamp: Number(result.timestamp),
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Get feedback count for an agent
     */
    async getFeedbackCount(agentId) {
        const count = await this.readOnlyContract.getFeedbackCount(agentId);
        return Number(count);
    }
    /**
     * Get recent feedback for an agent
     */
    async getRecentFeedback(agentId, limit = 10) {
        const feedbackIds = await this.readOnlyContract.getFeedbackByAgent(agentId, 0, limit);
        const feedbacks = await Promise.all(feedbackIds.map(id => this.getFeedback(Number(id))));
        return feedbacks.filter((f) => f !== null);
    }
    /**
     * Get average score for an agent
     */
    async getAverageScore(agentId) {
        const [average, count] = await this.readOnlyContract.getAverageScore(agentId);
        return {
            average: Number(average),
            count: Number(count),
        };
    }
    /**
     * Get comprehensive reputation summary for an agent
     */
    async getReputationSummary(agentId) {
        const [{ average, count }, recentFeedback] = await Promise.all([
            this.getAverageScore(agentId),
            this.getRecentFeedback(agentId, 5),
        ]);
        // Determine trust level based on score and feedback count
        let trustLevel = 'untrusted';
        if (count >= constants_1.TRUST_LEVELS.verified.minFeedback && average >= constants_1.TRUST_LEVELS.verified.minScore) {
            trustLevel = 'verified';
        }
        else if (count >= constants_1.TRUST_LEVELS.trusted.minFeedback && average >= constants_1.TRUST_LEVELS.trusted.minScore) {
            trustLevel = 'trusted';
        }
        else if (count >= constants_1.TRUST_LEVELS.established.minFeedback && average >= constants_1.TRUST_LEVELS.established.minScore) {
            trustLevel = 'established';
        }
        else if (count >= constants_1.TRUST_LEVELS.emerging.minFeedback && average >= constants_1.TRUST_LEVELS.emerging.minScore) {
            trustLevel = 'emerging';
        }
        else if (count >= constants_1.TRUST_LEVELS.new.minFeedback && average >= constants_1.TRUST_LEVELS.new.minScore) {
            trustLevel = 'new';
        }
        return {
            agentId,
            averageScore: average,
            totalFeedback: count,
            recentFeedback,
            trustLevel,
        };
    }
    /**
     * Authorize an address to post feedback for your agent
     */
    async authorizeFeedbackAuthor(agentId, author) {
        if (!this.contract) {
            throw new Error('Signer required');
        }
        const tx = await this.contract.authorizeFeedback(agentId, author);
        await tx.wait();
        console.log(`Authorized ${author} to post feedback for agent ${agentId}`);
    }
    /**
     * Revoke feedback authorization
     */
    async revokeFeedbackAuthorization(agentId, author) {
        if (!this.contract) {
            throw new Error('Signer required');
        }
        const tx = await this.contract.revokeFeedbackAuthorization(agentId, author);
        await tx.wait();
        console.log(`Revoked feedback authorization for ${author} on agent ${agentId}`);
    }
    /**
     * Check if an address is authorized to post feedback
     */
    async isAuthorizedFeedbackAuthor(agentId, author) {
        return this.readOnlyContract.isAuthorizedFeedbackAuthor(agentId, author);
    }
    /**
     * Check if an agent meets minimum trust requirements
     */
    async meetsMinimumTrust(agentId, minLevel) {
        const summary = await this.getReputationSummary(agentId);
        const levelOrder = [
            'untrusted', 'new', 'emerging', 'established', 'trusted', 'verified'
        ];
        return levelOrder.indexOf(summary.trustLevel) >= levelOrder.indexOf(minLevel);
    }
    /**
     * Calculate trust score for payment decisions
     *
     * Returns a 0-100 score combining reputation and feedback volume
     */
    async calculateTrustScore(agentId) {
        const summary = await this.getReputationSummary(agentId);
        // Weight: 70% average score, 30% volume bonus
        const scoreComponent = Math.max(0, (summary.averageScore + 100) / 2); // Normalize -100..100 to 0..100
        const volumeBonus = Math.min(30, summary.totalFeedback * 0.3); // Max 30 points from volume
        return Math.round(scoreComponent * 0.7 + volumeBonus);
    }
}
exports.ReputationClient = ReputationClient;
/**
 * Standard feedback templates for common scenarios
 */
exports.FeedbackTemplates = {
    // Positive feedback
    excellentService: (details) => ({
        score: 95,
        context: `Excellent service. ${details || 'Highly recommended.'}`,
    }),
    goodService: (details) => ({
        score: 75,
        context: `Good service. ${details || 'Would use again.'}`,
    }),
    satisfactory: (details) => ({
        score: 50,
        context: `Satisfactory service. ${details || 'Met expectations.'}`,
    }),
    // Negative feedback
    poorService: (details) => ({
        score: -50,
        context: `Poor service. ${details || 'Did not meet expectations.'}`,
    }),
    failed: (details) => ({
        score: -90,
        context: `Service failed. ${details || 'Would not recommend.'}`,
    }),
    // Payment-specific
    paymentSuccessful: (txHash, amount) => ({
        score: 80,
        context: JSON.stringify({
            type: 'payment-feedback',
            result: 'success',
            txHash,
            amount,
        }),
    }),
    paymentFailed: (reason) => ({
        score: -70,
        context: JSON.stringify({
            type: 'payment-feedback',
            result: 'failed',
            reason,
        }),
    }),
    // Escrow-specific
    escrowCompleted: (escrowId, outcome) => ({
        score: outcome === 'released' ? 85 : 40,
        context: JSON.stringify({
            type: 'escrow-feedback',
            escrowId,
            outcome,
        }),
    }),
    escrowDisputed: (escrowId, reason) => ({
        score: -30,
        context: JSON.stringify({
            type: 'escrow-feedback',
            escrowId,
            outcome: 'disputed',
            reason,
        }),
    }),
};
//# sourceMappingURL=reputation.js.map