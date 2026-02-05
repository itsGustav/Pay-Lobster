/**
 * ERC-8004 Reputation Registry Client
 *
 * Post feedback, query reputation, and manage trust levels.
 */
import { ethers } from 'ethers';
import { SupportedChain, Feedback, ReputationSummary } from './constants';
export interface ReputationClientConfig {
    chain: SupportedChain;
    privateKey?: string;
    provider?: ethers.Provider;
}
export interface FeedbackInput {
    agentId: number;
    score: number;
    context: string;
    taskHash?: string;
}
export declare class ReputationClient {
    private chain;
    private provider;
    private signer?;
    private contract;
    private readOnlyContract;
    constructor(config: ReputationClientConfig);
    /**
     * Post feedback for an agent
     *
     * @param feedback Feedback to post
     * @returns The feedbackId
     */
    postFeedback(feedback: FeedbackInput): Promise<number>;
    /**
     * Post feedback after a successful x402 payment
     *
     * Links the feedback to the payment transaction for verification
     */
    postPaymentFeedback(options: {
        agentId: number;
        score: number;
        context: string;
        paymentTxHash: string;
        paymentAmount: string;
        serviceUsed: string;
    }): Promise<number>;
    /**
     * Get a specific feedback entry
     */
    getFeedback(feedbackId: number): Promise<Feedback | null>;
    /**
     * Get feedback count for an agent
     */
    getFeedbackCount(agentId: number): Promise<number>;
    /**
     * Get recent feedback for an agent
     */
    getRecentFeedback(agentId: number, limit?: number): Promise<Feedback[]>;
    /**
     * Get average score for an agent
     */
    getAverageScore(agentId: number): Promise<{
        average: number;
        count: number;
    }>;
    /**
     * Get comprehensive reputation summary for an agent
     */
    getReputationSummary(agentId: number): Promise<ReputationSummary>;
    /**
     * Authorize an address to post feedback for your agent
     */
    authorizeFeedbackAuthor(agentId: number, author: string): Promise<void>;
    /**
     * Revoke feedback authorization
     */
    revokeFeedbackAuthorization(agentId: number, author: string): Promise<void>;
    /**
     * Check if an address is authorized to post feedback
     */
    isAuthorizedFeedbackAuthor(agentId: number, author: string): Promise<boolean>;
    /**
     * Check if an agent meets minimum trust requirements
     */
    meetsMinimumTrust(agentId: number, minLevel: ReputationSummary['trustLevel']): Promise<boolean>;
    /**
     * Calculate trust score for payment decisions
     *
     * Returns a 0-100 score combining reputation and feedback volume
     */
    calculateTrustScore(agentId: number): Promise<number>;
}
/**
 * Standard feedback templates for common scenarios
 */
export declare const FeedbackTemplates: {
    excellentService: (details?: string) => {
        score: number;
        context: string;
    };
    goodService: (details?: string) => {
        score: number;
        context: string;
    };
    satisfactory: (details?: string) => {
        score: number;
        context: string;
    };
    poorService: (details?: string) => {
        score: number;
        context: string;
    };
    failed: (details?: string) => {
        score: number;
        context: string;
    };
    paymentSuccessful: (txHash: string, amount: string) => {
        score: number;
        context: string;
    };
    paymentFailed: (reason: string) => {
        score: number;
        context: string;
    };
    escrowCompleted: (escrowId: string, outcome: "released" | "refunded") => {
        score: number;
        context: string;
    };
    escrowDisputed: (escrowId: string, reason: string) => {
        score: number;
        context: string;
    };
};
//# sourceMappingURL=reputation.d.ts.map