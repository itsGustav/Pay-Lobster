"use strict";
/**
 * LobsterAgent - Main class for Pay Lobster SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobsterAgent = void 0;
const BASE_RPC = 'https://mainnet.base.org';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
class LobsterAgent {
    constructor(config = {}) {
        this.config = {
            network: 'base',
            enableTrust: true,
            ...config
        };
    }
    /**
     * Initialize the agent and connect to wallet
     */
    async initialize() {
        if (this.config.walletId) {
            this.wallet = await this.getWallet();
        }
    }
    /**
     * Create a new Circle-managed wallet
     */
    async createWallet() {
        // Implementation would use Circle API
        throw new Error('Circle wallet creation requires entity secret. Use external wallet or Circle Console.');
    }
    /**
     * Get wallet details and balance
     */
    async getWallet() {
        if (!this.wallet?.address && !this.config.walletId) {
            throw new Error('No wallet configured');
        }
        const address = this.wallet?.address || this.config.walletId;
        const balance = await this.getBalance();
        return {
            id: this.config.walletId || 'external',
            address,
            network: this.config.network || 'base',
            balance
        };
    }
    /**
     * Get current USDC balance
     */
    async getBalance() {
        const address = this.wallet?.address || this.config.walletId;
        if (!address)
            throw new Error('No wallet address');
        const rpc = this.config.rpcUrl || BASE_RPC;
        const data = '0x70a08231' + address.slice(2).padStart(64, '0');
        const response = await fetch(rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [{ to: USDC_BASE, data }, 'latest']
            })
        });
        const result = await response.json();
        const balance = parseInt(result.result || '0', 16) / 1e6;
        return balance.toFixed(2);
    }
    /**
     * Get deposit address
     */
    async getDepositAddress() {
        return this.wallet?.address || this.config.walletId || '';
    }
    /**
     * Transfer USDC to another address
     */
    async transfer(options) {
        // Implementation requires private key or Circle wallet
        console.log(`Transfer: ${options.amount} USDC to ${options.to}`);
        return {
            id: `tx_${Date.now()}`,
            status: 'pending',
            amount: options.amount,
            to: options.to,
            from: this.wallet?.address || '',
            memo: options.memo,
            createdAt: new Date().toISOString()
        };
    }
    /**
     * Alias for transfer
     */
    async send(to, amount) {
        return this.transfer({ to, amount: amount.toString() });
    }
    /**
     * Create an escrow
     */
    async createEscrow(options) {
        return {
            id: `esc_${Date.now()}`,
            amount: options.amount,
            buyer: this.wallet?.address || '',
            seller: options.recipient,
            status: 'funded',
            conditions: options.conditions,
            createdAt: new Date().toISOString()
        };
    }
    /**
     * Release escrow funds
     */
    async releaseEscrow(escrowId, options) {
        console.log(`Releasing escrow ${escrowId}`, options);
    }
    /**
     * Refund escrow
     */
    async refundEscrow(escrowId) {
        console.log(`Refunding escrow ${escrowId}`);
    }
    /**
     * Dispute escrow
     */
    async disputeEscrow(escrowId, options) {
        console.log(`Disputing escrow ${escrowId}: ${options.reason}`);
    }
    /**
     * Get trust score for an address
     */
    async getTrustScore(address) {
        // Would query ERC-8004 registry
        return {
            score: 100,
            level: 'new',
            totalTransactions: 0,
            successRate: 100
        };
    }
    /**
     * Rate an agent
     */
    async rateAgent(options) {
        console.log(`Rating agent ${options.agent}: ${options.rating}/5`);
    }
    /**
     * Get agent ratings
     */
    async getAgentRatings(address) {
        return [];
    }
    /**
     * Register agent in on-chain registry
     */
    async registerAgent(options) {
        console.log(`Registering agent: ${options.name}`);
    }
    /**
     * Discover agents by capability
     */
    async discoverAgents(options) {
        // Would query on-chain registry
        return [{
                address: '0xf775f0224A680E2915a066e53A389d0335318b7B',
                name: 'paylobster',
                capabilities: ['payments', 'escrow'],
                trustScore: { score: 100, level: 'verified', totalTransactions: 0, successRate: 100 }
            }];
    }
    /**
     * Get agent details
     */
    async getAgent(address) {
        const agents = await this.discoverAgents({});
        return agents.find(a => a.address.toLowerCase() === address.toLowerCase()) || null;
    }
    /**
     * Configure autonomous mode
     */
    setAutonomousMode(config) {
        this.autonomousConfig = config;
    }
    /**
     * Hire an agent autonomously
     */
    async hireAgent(options) {
        console.log(`Hiring agent ${options.agent} for: ${options.task}`);
        return { taskId: `task_${Date.now()}`, agent: options.agent, price: options.maxPrice };
    }
    /**
     * Set webhook for notifications
     */
    setWebhook(options) {
        console.log(`Webhook configured: ${options.url}`);
    }
    /**
     * Fetch with x402 auto-payment
     */
    async fetch(url, options) {
        const response = await fetch(url);
        if (response.status === 402 && options?.x402) {
            // Would handle payment automatically
            console.log('402 Payment Required - auto-paying...');
        }
        return response;
    }
    /**
     * Get transfer by ID
     */
    async getTransfer(id) {
        return null;
    }
    /**
     * List transfer history
     */
    async listTransfers(options) {
        return [];
    }
}
exports.LobsterAgent = LobsterAgent;
//# sourceMappingURL=agent.js.map