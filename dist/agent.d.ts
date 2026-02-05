/**
 * LobsterAgent - Main class for Pay Lobster SDK
 * Now with REAL on-chain contracts! 🦞
 */
import type { LobsterConfig, Wallet, Transfer, Escrow, TrustScore, Agent, TransferOptions, EscrowOptions, DiscoverOptions, AutonomousConfig } from './types';
import { SwapOptions, SwapResult, SwapQuote } from './swap';
import { stats } from './stats';
import { Subscription } from './subscriptions';
import { Invoice } from './invoices';
import { SplitRecipient, SplitResult } from './splits';
export declare class LobsterAgent {
    private config;
    private wallet?;
    private signer?;
    private provider?;
    private autonomousConfig?;
    constructor(config?: LobsterConfig);
    /**
     * Initialize the agent and connect to wallet
     */
    initialize(): Promise<void>;
    /**
     * Create a new Circle-managed wallet
     */
    createWallet(): Promise<Wallet>;
    /**
     * Get wallet details and balance
     */
    getWallet(): Promise<Wallet>;
    /**
     * Get current USDC balance
     */
    getBalance(): Promise<string>;
    /**
     * Get ETH balance (needed for gas)
     */
    getEthBalance(): Promise<string>;
    /**
     * Get deposit address
     */
    getDepositAddress(): Promise<string>;
    /**
     * Transfer USDC to another address
     * REAL implementation with on-chain signing! 🦞
     */
    transfer(options: TransferOptions): Promise<Transfer>;
    /**
     * Alias for transfer
     */
    send(to: string, amount: number | string): Promise<Transfer>;
    /**
     * Send ETH (not USDC) - for gas or native transfers
     */
    sendEth(options: {
        to: string;
        amount: string;
        memo?: string;
    }): Promise<Transfer>;
    /**
     * Create an escrow - REAL on-chain! 🦞
     */
    createEscrow(options: EscrowOptions): Promise<Escrow>;
    /**
     * Release escrow funds - REAL on-chain! 🦞
     */
    releaseEscrow(escrowId: string, options?: {
        amount?: string;
    }): Promise<void>;
    /**
     * Refund escrow - REAL on-chain! 🦞
     */
    refundEscrow(escrowId: string): Promise<void>;
    /**
     * Dispute escrow - REAL on-chain! 🦞
     */
    disputeEscrow(escrowId: string, options: {
        reason: string;
    }): Promise<void>;
    /**
     * Get trust score for an address - REAL on-chain! 🦞
     */
    getTrustScore(address: string): Promise<TrustScore>;
    /**
     * Rate an agent - REAL on-chain! 🦞
     */
    rateAgent(options: {
        agent: string;
        rating: number;
        comment?: string;
        transactionId?: string;
    }): Promise<void>;
    /**
     * Get agent ratings - REAL on-chain! 🦞
     */
    getAgentRatings(address: string): Promise<any[]>;
    /**
     * Register agent in on-chain registry - REAL! 🦞
     */
    registerAgent(options: {
        name: string;
        capabilities: string[];
        pricing?: Record<string, string>;
        metadata?: Record<string, any>;
    }): Promise<void>;
    /**
     * Discover agents - REAL on-chain! 🦞
     */
    discoverAgents(options: DiscoverOptions): Promise<Agent[]>;
    /**
     * Get agent details - REAL on-chain! 🦞
     */
    getAgent(address: string): Promise<Agent | null>;
    /**
     * Configure autonomous mode
     */
    setAutonomousMode(config: AutonomousConfig): void;
    /**
     * Hire an agent autonomously
     */
    hireAgent(options: {
        agent: string;
        task: string;
        maxPrice: string;
    }): Promise<any>;
    /**
     * Set webhook for notifications
     */
    setWebhook(options: {
        url: string;
        secret: string;
        events: string[];
    }): void;
    /**
     * Fetch with x402 auto-payment
     */
    fetch(url: string, options?: {
        x402?: boolean;
        maxPayment?: string;
    }): Promise<Response>;
    /**
     * Get transfer by ID
     */
    getTransfer(id: string): Promise<Transfer | null>;
    /**
     * List transfer history - queries USDC Transfer events! 🦞
     */
    listTransfers(options?: {
        limit?: number;
        direction?: string;
        since?: string;
    }): Promise<Transfer[]>;
    /**
     * Get a swap quote without executing
     */
    getSwapQuote(options: SwapOptions): Promise<SwapQuote>;
    /**
     * Execute a token swap (ETH ↔ USDC, etc.)
     * Uses 0x API for best execution across DEXs
     */
    swap(options: SwapOptions): Promise<SwapResult>;
    /**
     * Quick swap helpers
     */
    swapEthToUsdc(ethAmount: string): Promise<SwapResult>;
    swapUsdcToEth(usdcAmount: string): Promise<SwapResult>;
    /**
     * Get global Pay Lobster stats (all transactions across all wallets)
     */
    getGlobalStats(): ReturnType<typeof stats.load>;
    /**
     * Get formatted stats summary
     */
    getStatsSummary(): string;
    /**
     * Get leaderboard of top wallets by volume
     */
    getLeaderboard(limit?: number): {
        rank: number;
        address: string;
        totalVolume: string;
        transactions: number;
    }[];
    /**
     * Record a transfer manually (for external tracking)
     */
    recordTransfer(from: string, to: string, amount: string, txHash: string): import("./stats").PayLobsterStats;
    /**
     * Create a recurring subscription
     */
    createSubscription(options: {
        to: string;
        toName?: string;
        amount: string;
        period: 'daily' | 'weekly' | 'monthly' | 'yearly';
        description?: string;
        startNow?: boolean;
    }): Subscription;
    /**
     * Get all subscriptions for this wallet
     */
    getSubscriptions(): {
        paying: Subscription[];
        receiving: Subscription[];
    };
    /**
     * Get subscription by ID
     */
    getSubscription(id: string): Subscription;
    /**
     * Cancel a subscription
     */
    cancelSubscription(id: string): boolean;
    /**
     * Pause a subscription
     */
    pauseSubscription(id: string): boolean;
    /**
     * Resume a subscription
     */
    resumeSubscription(id: string): boolean;
    /**
     * Get subscriptions summary
     */
    getSubscriptionsSummary(): string;
    /**
     * Process due subscriptions (call periodically)
     */
    processDueSubscriptions(): Promise<{
        processed: number;
        failed: number;
    }>;
    /**
     * Create an invoice (request payment)
     */
    createInvoice(options: {
        to: string;
        toName?: string;
        amount: string;
        description: string;
        reference?: string;
        expiresInDays?: number;
    }): Invoice;
    /**
     * Get all invoices for this wallet
     */
    getInvoices(): {
        sent: Invoice[];
        received: Invoice[];
    };
    /**
     * Get invoice by ID
     */
    getInvoice(id: string): Invoice;
    /**
     * Pay an invoice
     */
    payInvoice(id: string): Promise<{
        txHash: string;
    }>;
    /**
     * Decline an invoice
     */
    declineInvoice(id: string): boolean;
    /**
     * Cancel an invoice (as creator)
     */
    cancelInvoice(id: string): boolean;
    /**
     * Get invoices summary
     */
    getInvoicesSummary(): string;
    /**
     * Split payment to multiple recipients
     *
     * @example
     * // Equal split
     * await agent.split('100', ['@alice', '@bob', '@charlie']);
     *
     * // Percentage split
     * await agent.split('100', ['@alice:50', '@bob:30', '@charlie:20']);
     */
    split(totalAmount: string, recipients: string[] | SplitRecipient[], memo?: string): Promise<SplitResult>;
    /**
     * Preview a split (no execution)
     */
    previewSplit(totalAmount: string, recipients: string[] | SplitRecipient[]): Promise<string>;
    /**
     * Get your gamification profile (streaks, badges, level)
     */
    getProfile(): import("./gamification").PlayerStats;
    /**
     * Get formatted profile
     */
    getProfileSummary(): string;
    /**
     * Get streak info
     */
    getStreak(): string;
    /**
     * Get gamification leaderboard
     */
    getGamificationLeaderboard(type?: 'volume' | 'streak' | 'level' | 'badges', limit?: number): {
        rank: number;
        address: string;
        value: string | number;
        level: number;
        badges: number;
    }[];
    /**
     * Get all available badges
     */
    getAllBadges(): import("./gamification").Badge[];
}
//# sourceMappingURL=agent.d.ts.map