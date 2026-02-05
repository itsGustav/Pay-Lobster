/**
 * ERC-8004 Trustless Agents - Main Export
 *
 * Complete integration for agent identity, reputation, and discovery.
 * Designed for seamless integration with USDC payments and x402 protocol.
 */
export * from './constants';
export * from './identity';
export * from './reputation';
export * from './discovery';
import { SupportedChain } from './constants';
import { IdentityClient } from './identity';
import { ReputationClient, ReputationSummary } from './reputation';
import { DiscoveryService, DiscoveredAgent } from './discovery';
export interface ERC8004ClientConfig {
    chain: SupportedChain;
    privateKey?: string;
    paymentAddress?: string;
    x402Endpoint?: string;
}
/**
 * Unified ERC-8004 Client
 *
 * Provides high-level API for agent registration, discovery, and trust management.
 */
export declare class ERC8004Client {
    readonly chain: SupportedChain;
    readonly identity: IdentityClient;
    readonly reputation: ReputationClient;
    readonly discovery: DiscoveryService;
    private config;
    private myAgentId?;
    constructor(config: ERC8004ClientConfig);
    /**
     * Register this agent with the ERC-8004 Identity Registry
     */
    registerAgent(options: {
        name: string;
        description: string;
        image?: string;
        capabilities: string[];
        mcpEndpoint?: string;
        a2aEndpoint?: string;
    }): Promise<number>;
    /**
     * Get my agent ID (if registered)
     */
    getMyAgentId(): number | undefined;
    /**
     * Set agent ID (if already registered)
     */
    setMyAgentId(agentId: number): void;
    /**
     * Verify an agent before transacting
     */
    verifyAgent(agentId: number): Promise<{
        verified: boolean;
        trustScore: number;
        reputation: ReputationSummary;
        recommendation: "safe" | "caution" | "risky" | "avoid";
        reasons: string[];
    }>;
    /**
     * Check if payment is safe for an agent
     */
    isPaymentSafe(agentId: number, amountUsdc: number): Promise<{
        safe: boolean;
        trustScore: number;
        maxRecommendedAmount: number;
        reason: string;
    }>;
    /**
     * Post feedback after a transaction
     */
    postFeedback(options: {
        agentId: number;
        score: number;
        context: string;
        txHash?: string;
    }): Promise<number>;
    /**
     * Post positive feedback after successful payment
     */
    postPaymentSuccess(agentId: number, txHash: string, amount: string): Promise<number>;
    /**
     * Post negative feedback after failed payment
     */
    postPaymentFailure(agentId: number, reason: string): Promise<number>;
    /**
     * Post feedback after escrow completion
     */
    postEscrowFeedback(agentId: number, escrowId: string, outcome: 'released' | 'refunded' | 'disputed', reason?: string): Promise<number>;
    /**
     * Find agents for payment
     */
    findPaymentAgents(minTrustScore?: number): Promise<DiscoveredAgent[]>;
    /**
     * Find agents with escrow capability
     */
    findEscrowAgents(minTrustLevel?: ReputationSummary['trustLevel']): Promise<DiscoveredAgent[]>;
    /**
     * Get my reputation summary
     */
    getMyReputation(): Promise<ReputationSummary | null>;
    /**
     * Get contract addresses for this chain
     */
    getContractAddresses(): {
        readonly identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e";
        readonly reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713";
    } | {
        readonly identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
        readonly reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
    };
    /**
     * Get the agent registry identifier
     */
    getAgentRegistry(): string;
}
/**
 * Integration helper: Wrap x402 payment with trust verification
 */
export declare function createTrustedX402Payment(options: {
    erc8004: ERC8004Client;
    targetAgentId: number;
    amountUsdc: number;
    endpoint: string;
    paymentFn: () => Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
}): Promise<{
    success: boolean;
    txHash?: string;
    trustScore: number;
    feedbackPosted: boolean;
    error?: string;
}>;
/**
 * Quick setup helper
 */
export declare function createERC8004Client(chain: SupportedChain, privateKey?: string, options?: {
    paymentAddress?: string;
    x402Endpoint?: string;
}): ERC8004Client;
//# sourceMappingURL=index.d.ts.map