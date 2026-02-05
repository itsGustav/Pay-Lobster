"use strict";
/**
 * ERC-8004 Agent Discovery Service
 *
 * Find and verify agents for trustless interactions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const identity_1 = require("./identity");
const reputation_1 = require("./reputation");
class DiscoveryService {
    constructor(config) {
        this.chain = config.chain;
        this.identityClient = new identity_1.IdentityClient({
            chain: config.chain,
            privateKey: config.privateKey,
        });
        this.reputationClient = new reputation_1.ReputationClient({
            chain: config.chain,
            privateKey: config.privateKey,
        });
    }
    /**
     * Search for agents matching criteria with reputation data
     */
    async searchAgents(options = {}) {
        // First, get agents from identity registry
        const agents = await this.identityClient.searchAgents({
            capability: options.capabilities?.[0], // Simple single capability for now
            service: options.serviceType,
            x402Support: options.x402Support,
            limit: (options.limit || 20) * 2, // Fetch extra to account for filtering
        });
        // Enrich with reputation data and filter
        const enrichedAgents = [];
        for (const agent of agents) {
            if (enrichedAgents.length >= (options.limit || 20))
                break;
            const [reputation, trustScore] = await Promise.all([
                this.reputationClient.getReputationSummary(agent.agentId),
                this.reputationClient.calculateTrustScore(agent.agentId),
            ]);
            // Filter by trust level
            if (options.minTrustLevel) {
                const meetsMinTrust = await this.reputationClient.meetsMinimumTrust(agent.agentId, options.minTrustLevel);
                if (!meetsMinTrust)
                    continue;
            }
            // Filter by trust score
            if (options.minTrustScore && trustScore < options.minTrustScore) {
                continue;
            }
            // Filter by escrow support
            if (options.escrowSupport !== undefined) {
                const hasEscrow = agent.registration?.usdcAgent?.escrowSupport;
                if (hasEscrow !== options.escrowSupport)
                    continue;
            }
            // Filter by all capabilities (not just first)
            if (options.capabilities && options.capabilities.length > 1) {
                const agentCaps = agent.registration?.usdcAgent?.capabilities || [];
                const hasAllCaps = options.capabilities.every(cap => agentCaps.includes(cap));
                if (!hasAllCaps)
                    continue;
            }
            enrichedAgents.push({
                agent,
                reputation,
                trustScore,
                paymentAddress: agent.registration?.usdcAgent?.paymentAddress,
                x402Endpoint: agent.registration?.usdcAgent?.x402Endpoint,
            });
        }
        // Sort by trust score (highest first)
        return enrichedAgents.sort((a, b) => b.trustScore - a.trustScore);
    }
    /**
     * Find agents that can receive USDC payments
     */
    async findPaymentAgents(options = {}) {
        return this.searchAgents({
            x402Support: true,
            minTrustScore: options.minTrustScore || 50, // Default to requiring some trust
            limit: options.limit,
        });
    }
    /**
     * Find agents with escrow capability
     */
    async findEscrowAgents(options = {}) {
        return this.searchAgents({
            escrowSupport: true,
            minTrustLevel: options.minTrustLevel || 'emerging',
            limit: options.limit,
        });
    }
    /**
     * Verify an agent before transacting
     *
     * Returns verification result with recommendation
     */
    async verifyAgent(agentId) {
        const [agent, reputation, trustScore] = await Promise.all([
            this.identityClient.getAgent(agentId),
            this.reputationClient.getReputationSummary(agentId),
            this.reputationClient.calculateTrustScore(agentId),
        ]);
        const reasons = [];
        let recommendation = 'safe';
        // Check if agent exists
        if (!agent) {
            return {
                verified: false,
                trustScore: 0,
                reputation: {
                    agentId,
                    averageScore: 0,
                    totalFeedback: 0,
                    recentFeedback: [],
                    trustLevel: 'untrusted',
                },
                recommendation: 'avoid',
                reasons: ['Agent not found in registry'],
            };
        }
        // Check registration status
        if (!agent.registration?.active) {
            reasons.push('Agent registration is not active');
            recommendation = 'avoid';
        }
        // Check reputation
        if (reputation.totalFeedback === 0) {
            reasons.push('No feedback history - new agent');
            recommendation = recommendation === 'safe' ? 'caution' : recommendation;
        }
        else if (reputation.averageScore < 0) {
            reasons.push(`Negative average score: ${reputation.averageScore}`);
            recommendation = 'risky';
        }
        else if (reputation.averageScore < 50) {
            reasons.push(`Low average score: ${reputation.averageScore}`);
            recommendation = recommendation === 'safe' ? 'caution' : recommendation;
        }
        // Check trust level
        if (reputation.trustLevel === 'untrusted') {
            reasons.push('Trust level: untrusted');
            recommendation = 'avoid';
        }
        // Check recent feedback
        const recentNegative = reputation.recentFeedback.filter(f => f.score < 0);
        if (recentNegative.length >= 3) {
            reasons.push(`${recentNegative.length} negative reviews in recent feedback`);
            recommendation = 'risky';
        }
        // Positive signals
        if (trustScore >= 80) {
            reasons.push(`High trust score: ${trustScore}`);
        }
        if (reputation.trustLevel === 'verified' || reputation.trustLevel === 'trusted') {
            reasons.push(`Strong trust level: ${reputation.trustLevel}`);
        }
        return {
            verified: recommendation !== 'avoid',
            trustScore,
            reputation,
            recommendation,
            reasons,
        };
    }
    /**
     * Check if it's safe to pay an agent a certain amount
     *
     * Higher amounts require higher trust
     */
    async checkPaymentSafety(agentId, amountUsdc) {
        const trustScore = await this.reputationClient.calculateTrustScore(agentId);
        // Payment tiers based on trust score
        const maxAmounts = [
            [90, 10000], // Trust 90+ = up to $10,000
            [80, 1000], // Trust 80+ = up to $1,000
            [70, 500], // Trust 70+ = up to $500
            [50, 100], // Trust 50+ = up to $100
            [30, 25], // Trust 30+ = up to $25
            [0, 5], // Any trust = up to $5
        ];
        let maxRecommendedAmount = 5;
        for (const [minTrust, amount] of maxAmounts) {
            if (trustScore >= minTrust) {
                maxRecommendedAmount = amount;
                break;
            }
        }
        const safe = amountUsdc <= maxRecommendedAmount;
        return {
            safe,
            trustScore,
            maxRecommendedAmount,
            reason: safe
                ? `Payment amount within safe limit for trust score ${trustScore}`
                : `Payment amount $${amountUsdc} exceeds recommended limit of $${maxRecommendedAmount} for trust score ${trustScore}`,
        };
    }
    /**
     * Get the identity client for direct access
     */
    getIdentityClient() {
        return this.identityClient;
    }
    /**
     * Get the reputation client for direct access
     */
    getReputationClient() {
        return this.reputationClient;
    }
}
exports.DiscoveryService = DiscoveryService;
//# sourceMappingURL=discovery.js.map