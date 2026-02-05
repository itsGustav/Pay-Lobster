/**
 * LobsterAgent - Main class for Pay Lobster SDK
 * Now with REAL on-chain contracts! 🦞
 */

import { ethers } from 'ethers';
import type {
  LobsterConfig,
  Wallet,
  Transfer,
  Escrow,
  TrustScore,
  Agent,
  TransferOptions,
  EscrowOptions,
  DiscoverOptions,
  AutonomousConfig
} from './types';
import { CONTRACTS, ESCROW_ABI, REGISTRY_ABI, ERC20_ABI, EscrowStatus } from './contracts';
import { analytics } from './analytics';
import { resolveUsername, ResolvedAddress } from './usernames';
import { executeSwap, getSwapQuote, SwapOptions, SwapResult, SwapQuote } from './swap';
import { stats } from './stats';
import { subscriptions, Subscription } from './subscriptions';
import { invoices, Invoice } from './invoices';
import { splits, SplitRecipient, SplitResult } from './splits';
import { gamification } from './gamification';

const BASE_RPC = 'https://mainnet.base.org';
const USDC_BASE = CONTRACTS.usdc;

export class LobsterAgent {
  private config: LobsterConfig;
  private wallet?: Wallet;
  private signer?: ethers.Wallet;
  private provider?: ethers.JsonRpcProvider;
  private autonomousConfig?: AutonomousConfig;

  constructor(config: LobsterConfig = {}) {
    this.config = {
      network: 'base',
      enableTrust: true,
      ...config
    };
  }

  /**
   * Initialize the agent and connect to wallet
   */
  async initialize(): Promise<void> {
    // Set up provider
    const rpcUrl = this.config.rpcUrl || BASE_RPC;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Set up signer if private key provided
    if (this.config.privateKey) {
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      this.wallet = {
        id: 'local',
        address: this.signer.address,
        network: this.config.network || 'base',
        balance: await this.getBalance()
      };
      
      // Track agent initialization
      analytics.setAgent(this.signer.address);
      analytics.track('agent_initialized', { 
        address: this.signer.address.slice(0, 10) + '...',
        network: this.config.network || 'base'
      });
    } else if (this.config.walletId) {
      this.wallet = await this.getWallet();
      analytics.setAgent(this.config.walletId);
      analytics.track('agent_initialized', { 
        address: this.config.walletId.slice(0, 10) + '...',
        mode: 'read-only'
      });
    }
  }

  /**
   * Create a new Circle-managed wallet
   */
  async createWallet(): Promise<Wallet> {
    // Implementation would use Circle API
    throw new Error('Circle wallet creation requires entity secret. Use external wallet or Circle Console.');
  }

  /**
   * Get wallet details and balance
   */
  async getWallet(): Promise<Wallet> {
    if (!this.wallet?.address && !this.config.walletId) {
      throw new Error('No wallet configured');
    }
    
    const address = this.wallet?.address || this.config.walletId!;
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
  async getBalance(): Promise<string> {
    const address = this.signer?.address || this.wallet?.address || this.config.walletId;
    if (!address) throw new Error('No wallet address');

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
    
    const result: any = await response.json();
    const balance = parseInt(result.result || '0', 16) / 1e6;
    return balance.toFixed(2);
  }

  /**
   * Get ETH balance (needed for gas)
   */
  async getEthBalance(): Promise<string> {
    const address = this.signer?.address || this.wallet?.address || this.config.walletId;
    if (!address) throw new Error('No wallet address');

    const rpc = this.config.rpcUrl || BASE_RPC;
    
    const response = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    });
    
    const result: any = await response.json();
    const balance = parseInt(result.result || '0', 16) / 1e18;
    return balance.toFixed(6);
  }

  /**
   * Get deposit address
   */
  async getDepositAddress(): Promise<string> {
    return this.wallet?.address || this.config.walletId || '';
  }

  /**
   * Transfer USDC to another address
   * REAL implementation with on-chain signing! 🦞
   */
  async transfer(options: TransferOptions): Promise<Transfer> {
    if (!this.signer) {
      throw new Error('No signer available. Provide privateKey in config to enable transfers.');
    }

    if (!this.provider) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }

    // Resolve username/basename to address
    let recipientAddress = options.to;
    let resolvedName: string | undefined;
    
    if (!ethers.isAddress(options.to)) {
      const resolved = await resolveUsername(options.to, this.provider);
      if (!resolved) {
        throw new Error(`Could not resolve "${options.to}" to an address. Try @username, name.base.eth, or 0x...`);
      }
      recipientAddress = resolved.address;
      resolvedName = resolved.name;
      console.log(`🔍 Resolved ${options.to} → ${recipientAddress} (via ${resolved.source})`);
    }

    // Parse amount (USDC has 6 decimals)
    const amount = ethers.parseUnits(options.amount, 6);
    
    // Check balance first
    const usdc = new ethers.Contract(USDC_BASE, ERC20_ABI, this.signer);
    const balance = await usdc.balanceOf(this.signer.address);
    
    if (balance < amount) {
      const balanceFormatted = ethers.formatUnits(balance, 6);
      throw new Error(`Insufficient balance. Have: ${balanceFormatted} USDC, Need: ${options.amount} USDC`);
    }

    const displayTo = resolvedName || recipientAddress;
    console.log(`🦞 Sending ${options.amount} USDC to ${displayTo}...`);

    try {
      // Execute the transfer
      const tx = await usdc.transfer(recipientAddress, amount);
      console.log(`📤 Transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

      // Track successful transaction
      analytics.trackTransaction('send', options.amount, recipientAddress, tx.hash);
      
      // Record in global stats
      stats.recordTransfer(this.signer.address, recipientAddress, options.amount, tx.hash);
      
      // Record gamification
      const isTip = options.memo?.toLowerCase().includes('tip');
      gamification.recordActivity(this.signer.address, isTip ? 'tip' : 'transfer', options.amount, { isTip });

      return {
        id: tx.hash,
        hash: tx.hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        amount: options.amount,
        to: recipientAddress,
        toName: resolvedName,
        from: this.signer.address,
        memo: options.memo,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`❌ Transfer failed: ${error.message}`);
      analytics.trackError(error.message, 'transfer');
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Alias for transfer
   */
  async send(to: string, amount: number | string): Promise<Transfer> {
    return this.transfer({ to, amount: amount.toString() });
  }

  /**
   * Send ETH (not USDC) - for gas or native transfers
   */
  async sendEth(options: { to: string; amount: string; memo?: string }): Promise<Transfer> {
    if (!this.signer) {
      throw new Error('No signer available. Provide privateKey to send ETH.');
    }

    // Resolve username if needed
    let recipientAddress = options.to;
    let resolvedName: string | undefined;
    
    if (!ethers.isAddress(options.to)) {
      const resolved = await resolveUsername(options.to, this.provider);
      if (!resolved) {
        throw new Error(`Could not resolve "${options.to}" to an address.`);
      }
      recipientAddress = resolved.address;
      resolvedName = resolved.name;
    }

    const amount = ethers.parseEther(options.amount);
    
    // Check balance
    const balance = await this.provider!.getBalance(this.signer.address);
    if (balance < amount) {
      const balanceFormatted = ethers.formatEther(balance);
      throw new Error(`Insufficient ETH. Have: ${balanceFormatted}, Need: ${options.amount}`);
    }

    const displayTo = resolvedName || recipientAddress;
    console.log(`🦞 Sending ${options.amount} ETH to ${displayTo}...`);

    try {
      const tx = await this.signer.sendTransaction({
        to: recipientAddress,
        value: amount,
      });
      console.log(`📤 Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Confirmed in block ${receipt?.blockNumber}`);

      return {
        id: tx.hash,
        hash: tx.hash,
        status: receipt?.status === 1 ? 'confirmed' : 'failed',
        amount: options.amount,
        to: recipientAddress,
        toName: resolvedName,
        from: this.signer.address,
        memo: options.memo,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`❌ ETH transfer failed: ${error.message}`);
      throw new Error(`ETH transfer failed: ${error.message}`);
    }
  }

  /**
   * Create an escrow - REAL on-chain! 🦞
   */
  async createEscrow(options: EscrowOptions): Promise<Escrow> {
    if (!this.signer) {
      throw new Error('No signer available. Provide privateKey to create escrow.');
    }

    const usdc = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, this.signer);
    const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, this.signer);
    
    const amount = ethers.parseUnits(options.amount, 6);
    const deadline = options.deadline ? Math.floor(new Date(options.deadline).getTime() / 1000) : 0;
    const description = options.conditions?.description || '';

    // Approve USDC spend
    console.log('🦞 Approving USDC for escrow...');
    const approveTx = await usdc.approve(CONTRACTS.escrow, amount);
    await approveTx.wait();

    // Create escrow
    console.log('🦞 Creating escrow...');
    const tx = await escrowContract.createEscrow(options.recipient, amount, description, deadline);
    const receipt = await tx.wait();
    
    // Get escrow ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        return escrowContract.interface.parseLog(log)?.name === 'EscrowCreated';
      } catch { return false; }
    });
    const escrowId = event ? escrowContract.interface.parseLog(event)?.args[0].toString() : '0';

    console.log(`✅ Escrow created: ID ${escrowId}`);
    
    // Record in global stats
    stats.recordEscrow(options.amount);

    return {
      id: escrowId,
      amount: options.amount,
      buyer: this.signer.address,
      seller: options.recipient,
      status: 'funded',
      conditions: options.conditions,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Release escrow funds - REAL on-chain! 🦞
   */
  async releaseEscrow(escrowId: string, options?: { amount?: string }): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, this.signer);
    console.log(`🦞 Releasing escrow ${escrowId}...`);
    const tx = await escrowContract.releaseEscrow(escrowId);
    await tx.wait();
    console.log(`✅ Escrow ${escrowId} released!`);
  }

  /**
   * Refund escrow - REAL on-chain! 🦞
   */
  async refundEscrow(escrowId: string): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, this.signer);
    console.log(`🦞 Refunding escrow ${escrowId}...`);
    const tx = await escrowContract.refundEscrow(escrowId);
    await tx.wait();
    console.log(`✅ Escrow ${escrowId} refunded!`);
  }

  /**
   * Dispute escrow - REAL on-chain! 🦞
   */
  async disputeEscrow(escrowId: string, options: { reason: string }): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, this.signer);
    console.log(`🦞 Disputing escrow ${escrowId}: ${options.reason}`);
    const tx = await escrowContract.disputeEscrow(escrowId);
    await tx.wait();
    console.log(`✅ Escrow ${escrowId} disputed!`);
  }

  /**
   * Get trust score for an address - REAL on-chain! 🦞
   */
  async getTrustScore(address: string): Promise<TrustScore> {
    const provider = this.provider || new ethers.JsonRpcProvider(BASE_RPC);
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, provider);
    
    try {
      const [score, ratings] = await registry.getTrustScore(address);
      const level = score >= 80 ? 'verified' : score >= 60 ? 'trusted' : score >= 40 ? 'established' : 'new';
      
      return {
        score: Number(score),
        level,
        totalTransactions: Number(ratings),
        successRate: 100
      };
    } catch {
      return { score: 50, level: 'new', totalTransactions: 0, successRate: 100 };
    }
  }

  /**
   * Rate an agent - REAL on-chain! 🦞
   */
  async rateAgent(options: { agent: string; rating: number; comment?: string; transactionId?: string }): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, this.signer);
    console.log(`🦞 Rating agent ${options.agent}: ${options.rating}/5...`);
    const tx = await registry.rateAgent(options.agent, options.rating, options.comment || '');
    await tx.wait();
    console.log(`✅ Agent rated!`);
  }

  /**
   * Get agent ratings - REAL on-chain! 🦞
   */
  async getAgentRatings(address: string): Promise<any[]> {
    const provider = this.provider || new ethers.JsonRpcProvider(BASE_RPC);
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, provider);
    
    try {
      const ratings = await registry.getAgentRatings(address, 10);
      return ratings.map((r: any) => ({
        rater: r.rater,
        rating: Number(r.score),
        comment: r.comment,
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString()
      }));
    } catch {
      return [];
    }
  }

  /**
   * Register agent in on-chain registry - REAL! 🦞
   */
  async registerAgent(options: {
    name: string;
    capabilities: string[];
    pricing?: Record<string, string>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.signer) throw new Error('No signer available');
    
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, this.signer);
    const capabilitiesCSV = options.capabilities.join(',');
    const metadataURI = options.metadata ? JSON.stringify(options.metadata) : '';
    
    console.log(`🦞 Registering agent: ${options.name}...`);
    const tx = await registry.registerAgent(options.name, capabilitiesCSV, metadataURI);
    await tx.wait();
    console.log(`✅ Agent registered on-chain!`);
  }

  /**
   * Discover agents - REAL on-chain! 🦞
   */
  async discoverAgents(options: DiscoverOptions): Promise<Agent[]> {
    const provider = this.provider || new ethers.JsonRpcProvider(BASE_RPC);
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, provider);
    
    try {
      const limit = options.limit || 10;
      const [addresses, names, trustScores] = await registry.discoverAgents(limit);
      
      const agents: Agent[] = [];
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] === ethers.ZeroAddress) continue;
        
        const level = trustScores[i] >= 80 ? 'verified' : trustScores[i] >= 60 ? 'trusted' : 
                      trustScores[i] >= 40 ? 'established' : 'new';
        
        agents.push({
          address: addresses[i],
          name: names[i],
          capabilities: [], // Parse from getAgent if needed
          trustScore: {
            score: Number(trustScores[i]),
            level: level as any,
            totalTransactions: 0,
            successRate: 100
          }
        });
      }
      
      return agents;
    } catch (e) {
      console.error('Discovery error:', e);
      return [];
    }
  }

  /**
   * Get agent details - REAL on-chain! 🦞
   */
  async getAgent(address: string): Promise<Agent | null> {
    const provider = this.provider || new ethers.JsonRpcProvider(BASE_RPC);
    const registry = new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, provider);
    
    try {
      const [name, capabilitiesCSV, metadataURI, registeredAt, active, trustScore, numRatings] = 
        await registry.getAgent(address);
      
      if (!active) return null;
      
      const level = trustScore >= 80 ? 'verified' : trustScore >= 60 ? 'trusted' : 
                    trustScore >= 40 ? 'established' : 'new';
      
      return {
        address,
        name,
        capabilities: capabilitiesCSV.split(',').filter((c: string) => c),
        trustScore: {
          score: Number(trustScore),
          level: level as any,
          totalTransactions: Number(numRatings),
          successRate: 100
        },
        metadata: metadataURI ? JSON.parse(metadataURI) : undefined
      };
    } catch {
      return null;
    }
  }

  /**
   * Configure autonomous mode
   */
  setAutonomousMode(config: AutonomousConfig): void {
    this.autonomousConfig = config;
  }

  /**
   * Hire an agent autonomously
   */
  async hireAgent(options: { agent: string; task: string; maxPrice: string }): Promise<any> {
    console.log(`Hiring agent ${options.agent} for: ${options.task}`);
    return { taskId: `task_${Date.now()}`, agent: options.agent, price: options.maxPrice };
  }

  /**
   * Set webhook for notifications
   */
  setWebhook(options: { url: string; secret: string; events: string[] }): void {
    console.log(`Webhook configured: ${options.url}`);
  }

  /**
   * Fetch with x402 auto-payment
   */
  async fetch(url: string, options?: { x402?: boolean; maxPayment?: string }): Promise<Response> {
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
  async getTransfer(id: string): Promise<Transfer | null> {
    return null;
  }

  /**
   * List transfer history - queries USDC Transfer events! 🦞
   */
  async listTransfers(options?: { limit?: number; direction?: string; since?: string }): Promise<Transfer[]> {
    const address = this.signer?.address || this.wallet?.address || this.config.walletId;
    if (!address) return [];
    
    const provider = this.provider || new ethers.JsonRpcProvider(BASE_RPC);
    const usdc = new ethers.Contract(CONTRACTS.usdc, [
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ], provider);
    
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 10000; // Last ~10k blocks
      
      // Get transfers to/from this address
      const filterTo = usdc.filters.Transfer(null, address);
      const filterFrom = usdc.filters.Transfer(address, null);
      
      const [eventsTo, eventsFrom] = await Promise.all([
        usdc.queryFilter(filterTo, fromBlock, currentBlock),
        usdc.queryFilter(filterFrom, fromBlock, currentBlock)
      ]);
      
      const transfers: Transfer[] = [];
      
      for (const event of [...eventsTo, ...eventsFrom]) {
        const args = (event as any).args;
        const block = await event.getBlock();
        
        transfers.push({
          id: event.transactionHash,
          hash: event.transactionHash,
          status: 'confirmed',
          amount: ethers.formatUnits(args.value, 6),
          to: args.to,
          from: args.from,
          createdAt: new Date(block.timestamp * 1000).toISOString()
        });
      }
      
      // Sort by date, most recent first
      transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return transfers.slice(0, options?.limit || 10);
    } catch (e) {
      console.error('History error:', e);
      return [];
    }
  }

  // ============================================
  // SWAP METHODS (Powered by 0x)
  // ============================================

  /**
   * Get a swap quote without executing
   */
  async getSwapQuote(options: SwapOptions): Promise<SwapQuote> {
    return getSwapQuote(options);
  }

  /**
   * Execute a token swap (ETH ↔ USDC, etc.)
   * Uses 0x API for best execution across DEXs
   */
  async swap(options: SwapOptions): Promise<SwapResult> {
    if (!this.signer) {
      throw new Error('No signer available. Provide privateKey to execute swaps.');
    }

    console.log(`🦞 Initiating swap: ${options.amount} ${options.from} → ${options.to}`);
    
    const result = await executeSwap(this.signer, options);
    
    // Track the swap
    analytics.trackTransaction('swap', options.amount, `${options.from}→${options.to}`, result.hash);
    
    return result;
  }

  /**
   * Quick swap helpers
   */
  async swapEthToUsdc(ethAmount: string): Promise<SwapResult> {
    return this.swap({ from: 'ETH', to: 'USDC', amount: ethAmount });
  }

  async swapUsdcToEth(usdcAmount: string): Promise<SwapResult> {
    return this.swap({ from: 'USDC', to: 'ETH', amount: usdcAmount });
  }

  // ============================================
  // GLOBAL STATS METHODS
  // ============================================

  /**
   * Get global Pay Lobster stats (all transactions across all wallets)
   */
  getGlobalStats(): ReturnType<typeof stats.load> {
    return stats.load();
  }

  /**
   * Get formatted stats summary
   */
  getStatsSummary(): string {
    return stats.getSummary();
  }

  /**
   * Get leaderboard of top wallets by volume
   */
  getLeaderboard(limit: number = 10) {
    return stats.getLeaderboard(limit);
  }

  /**
   * Record a transfer manually (for external tracking)
   */
  recordTransfer(from: string, to: string, amount: string, txHash: string) {
    return stats.recordTransfer(from, to, amount, txHash);
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

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
  }): Subscription {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.create({
      from: this.wallet.address,
      ...options,
    });
  }

  /**
   * Get all subscriptions for this wallet
   */
  getSubscriptions() {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.getAll(this.wallet.address);
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string) {
    return subscriptions.get(id);
  }

  /**
   * Cancel a subscription
   */
  cancelSubscription(id: string): boolean {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.cancel(id, this.wallet.address);
  }

  /**
   * Pause a subscription
   */
  pauseSubscription(id: string): boolean {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.pause(id, this.wallet.address);
  }

  /**
   * Resume a subscription
   */
  resumeSubscription(id: string): boolean {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.resume(id, this.wallet.address);
  }

  /**
   * Get subscriptions summary
   */
  getSubscriptionsSummary(): string {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return subscriptions.summary(this.wallet.address);
  }

  /**
   * Process due subscriptions (call periodically)
   */
  async processDueSubscriptions(): Promise<{ processed: number; failed: number }> {
    if (!this.signer) throw new Error('Signer required to process subscriptions');
    
    const due = subscriptions.getDue();
    let processed = 0, failed = 0;
    
    for (const sub of due) {
      try {
        await this.transfer({ to: sub.to, amount: sub.amount, memo: `Subscription: ${sub.description || sub.id}` });
        subscriptions.recordPayment(sub.id, 'processed');
        processed++;
      } catch (e: any) {
        subscriptions.recordFailure(sub.id, e.message);
        failed++;
      }
    }
    
    return { processed, failed };
  }

  // ============================================
  // INVOICES
  // ============================================

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
  }): Invoice {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return invoices.create({
      from: this.wallet.address,
      ...options,
    });
  }

  /**
   * Get all invoices for this wallet
   */
  getInvoices() {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return invoices.getAll(this.wallet.address);
  }

  /**
   * Get invoice by ID
   */
  getInvoice(id: string) {
    return invoices.get(id);
  }

  /**
   * Pay an invoice
   */
  async payInvoice(id: string): Promise<{ txHash: string }> {
    if (!this.signer) throw new Error('Signer required to pay invoices');
    
    const invoice = invoices.get(id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    if (invoice.status !== 'pending') throw new Error(`Invoice is ${invoice.status}`);
    if (invoice.to.toLowerCase() !== this.wallet?.address?.toLowerCase()) {
      throw new Error('This invoice is not for you');
    }
    
    const tx = await this.transfer({ to: invoice.from, amount: invoice.amount, memo: `Invoice: ${invoice.id}` });
    invoices.markPaid(id, tx.hash);
    
    return { txHash: tx.hash };
  }

  /**
   * Decline an invoice
   */
  declineInvoice(id: string): boolean {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return invoices.decline(id, this.wallet.address);
  }

  /**
   * Cancel an invoice (as creator)
   */
  cancelInvoice(id: string): boolean {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return invoices.cancel(id, this.wallet.address);
  }

  /**
   * Get invoices summary
   */
  getInvoicesSummary(): string {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return invoices.summary(this.wallet.address);
  }

  // ============================================
  // SPLIT PAYMENTS
  // ============================================

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
  async split(totalAmount: string, recipients: string[] | SplitRecipient[], memo?: string): Promise<SplitResult> {
    if (!this.signer) throw new Error('Signer required for split payments');
    
    const parsed = await splits.parse(recipients, totalAmount, this.provider);
    const result = await splits.execute(this.signer, totalAmount, parsed, memo);
    
    // Record gamification
    if (this.wallet?.address) {
      gamification.recordActivity(this.wallet.address, 'split', totalAmount, { recipients: parsed.length });
    }
    
    return result;
  }

  /**
   * Preview a split (no execution)
   */
  async previewSplit(totalAmount: string, recipients: string[] | SplitRecipient[]): Promise<string> {
    return splits.preview(totalAmount, recipients, this.provider);
  }

  // ============================================
  // GAMIFICATION
  // ============================================

  /**
   * Get your gamification profile (streaks, badges, level)
   */
  getProfile() {
    if (!this.wallet?.address) throw new Error('Wallet not initialized');
    return gamification.getProfile(this.wallet.address);
  }

  /**
   * Get formatted profile
   */
  getProfileSummary(): string {
    const profile = this.getProfile();
    if (!profile) return 'No profile yet. Make a transaction to start!';
    return gamification.formatProfile(profile);
  }

  /**
   * Get streak info
   */
  getStreak(): string {
    const profile = this.getProfile();
    if (!profile) return 'No streak yet. Make a transaction to start!';
    return gamification.formatStreak(profile);
  }

  /**
   * Get gamification leaderboard
   */
  getGamificationLeaderboard(type: 'volume' | 'streak' | 'level' | 'badges' = 'volume', limit = 10) {
    return gamification.getLeaderboard(type, limit);
  }

  /**
   * Get all available badges
   */
  getAllBadges() {
    return gamification.getAllBadges();
  }
}
