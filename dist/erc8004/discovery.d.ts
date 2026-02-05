/**
 * ERC-8004 Agent Discovery Service
 *
 * Find and verify agents for trustless interactions.
 */
import { IdentityClient, RegisteredAgent } from './identity';
import { ReputationClient, ReputationSummary } from './reputation';
import { SupportedChain } from './constants';
export interface DiscoveryConfig {
    chain: SupportedChain;
    privateKey?: string;
}
export interface AgentSearchOptions {
    capabilities?: string[];
    serviceType?: string;
    x402Support?: boolean;
    escrowSupport?: boolean;
    minTrustLevel?: ReputationSummary['trustLevel'];
    minTrustScore?: number;
    limit?: number;
}
export interface DiscoveredAgent {
    agent: RegisteredAgent;
    reputation: ReputationSummary;
    trustScore: number;
    paymentAddress?: string;
    x402Endpoint?: string;
}
export declare class DiscoveryService {
    private identityClient;
    private reputationClient;
    private chain;
    constructor(config: DiscoveryConfig);
    /**
     * Search for agents matching criteria with reputation data
     */
    searchAgents(options?: AgentSearchOptions): Promise<DiscoveredAgent[]>;
    /**
     * Find agents that can receive USDC payments
     */
    findPaymentAgents(options?: {
        minTrustScore?: number;
        limit?: number;
    }): Promise<DiscoveredAgent[]>;
    /**
     * Find agents with escrow capability
     */
    findEscrowAgents(options?: {
        minTrustLevel?: ReputationSummary['trustLevel'];
        limit?: number;
    }): Promise<DiscoveredAgent[]>;
    /**
     * Verify an agent before transacting
     *
     * Returns verification result with recommendation
     */
    verifyAgent(agentId: number): Promise<{
        verified: boolean;
        trustScore: number;
        reputation: ReputationSummary;
        recommendation: 'safe' | 'caution' | 'risky' | 'avoid';
        reasons: string[];
    }>;
    /**
     * Check if it's safe to pay an agent a certain amount
     *
     * Higher amounts require higher trust
     */
    checkPaymentSafety(agentId: number, amountUsdc: number): Promise<{
        safe: boolean;
        trustScore: number;
        maxRecommendedAmount: number;
        reason: string;
    }>;
    /**
     * Get the identity client for direct access
     */
    getIdentityClient(): IdentityClient;
    /**
     * Get the reputation client for direct access
     */
    getReputationClient(): ReputationClient;
}
//# sourceMappingURL=discovery.d.ts.map