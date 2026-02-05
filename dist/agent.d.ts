/**
 * LobsterAgent - Main class for Pay Lobster SDK
 * Now with REAL on-chain contracts! 🦞
 */
import type { LobsterConfig, Wallet, Transfer, Escrow, TrustScore, Agent, TransferOptions, EscrowOptions, DiscoverOptions, AutonomousConfig } from './types';
import { SwapOptions, SwapResult, SwapQuote } from './swap';
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
}
//# sourceMappingURL=agent.d.ts.map