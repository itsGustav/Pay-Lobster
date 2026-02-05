/**
 * Transaction Approval System
 * 
 * Multi-step approval workflow for large or sensitive transactions.
 * Integrates with Clawdbot for conversational approvals.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface ApprovalPolicy {
  id: string;
  name: string;
  enabled: boolean;
  
  // Conditions that trigger approval requirement
  conditions: {
    minAmount?: string;        // Require approval above this amount
    maxDailyLimit?: string;    // Require approval if daily limit exceeded
    addresses?: string[];      // Require approval for these addresses
    chains?: string[];         // Require approval for these chains
    always?: boolean;          // Always require approval
  };
  
  // Approval requirements
  approvers: string[];         // List of approver IDs (Clawdbot sessions, emails, etc.)
  requiredApprovals: number;   // Number of approvals needed
  timeout: number;             // Timeout in seconds (default 24h)
  
  // Actions on timeout
  timeoutAction: 'cancel' | 'auto-approve';
  
  createdAt: string;
  updatedAt: string;
}

export interface PendingTransaction {
  id: string;
  policyId: string;
  
  // Transaction details
  type: 'send' | 'bridge' | 'recurring';
  fromWalletId: string;
  toAddress: string;
  toName?: string;
  amount: string;
  chain: string;
  targetChain?: string;  // For bridges
  memo?: string;
  
  // Approval status
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'executed';
  approvals: {
    approverId: string;
    decision: 'approve' | 'reject';
    timestamp: string;
    note?: string;
  }[];
  rejectionReason?: string;
  
  // Execution
  txHash?: string;
  executedAt?: string;
  
  // Metadata
  requestedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface DailySpending {
  date: string;
  walletId: string;
  total: string;
  transactions: { amount: string; txHash: string; timestamp: string }[];
}

const DATA_DIR = process.env.USDC_DATA_DIR || './data';

/**
 * Approval Manager
 */
export class ApprovalManager {
  private policiesPath: string;
  private pendingPath: string;
  private spendingPath: string;

  constructor(dataDir = DATA_DIR) {
    this.policiesPath = path.join(dataDir, 'approval-policies.json');
    this.pendingPath = path.join(dataDir, 'pending-transactions.json');
    this.spendingPath = path.join(dataDir, 'daily-spending.json');
  }

  private async loadPolicies(): Promise<ApprovalPolicy[]> {
    try {
      const data = await fs.readFile(this.policiesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async savePolicies(policies: ApprovalPolicy[]): Promise<void> {
    await fs.mkdir(path.dirname(this.policiesPath), { recursive: true });
    await fs.writeFile(this.policiesPath, JSON.stringify(policies, null, 2));
  }

  private async loadPending(): Promise<PendingTransaction[]> {
    try {
      const data = await fs.readFile(this.pendingPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async savePending(pending: PendingTransaction[]): Promise<void> {
    await fs.mkdir(path.dirname(this.pendingPath), { recursive: true });
    await fs.writeFile(this.pendingPath, JSON.stringify(pending, null, 2));
  }

  private async loadSpending(): Promise<DailySpending[]> {
    try {
      const data = await fs.readFile(this.spendingPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveSpending(spending: DailySpending[]): Promise<void> {
    await fs.mkdir(path.dirname(this.spendingPath), { recursive: true });
    await fs.writeFile(this.spendingPath, JSON.stringify(spending, null, 2));
  }

  // ============ Policy Management ============

  /**
   * Create approval policy
   */
  async createPolicy(params: {
    name: string;
    conditions: ApprovalPolicy['conditions'];
    approvers: string[];
    requiredApprovals?: number;
    timeout?: number;
    timeoutAction?: ApprovalPolicy['timeoutAction'];
  }): Promise<ApprovalPolicy> {
    const policies = await this.loadPolicies();

    const policy: ApprovalPolicy = {
      id: crypto.randomUUID(),
      name: params.name,
      enabled: true,
      conditions: params.conditions,
      approvers: params.approvers,
      requiredApprovals: params.requiredApprovals || 1,
      timeout: params.timeout || 86400, // 24 hours default
      timeoutAction: params.timeoutAction || 'cancel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    policies.push(policy);
    await this.savePolicies(policies);
    
    return policy;
  }

  /**
   * Get active policies for a transaction
   */
  async getMatchingPolicies(tx: {
    amount: string;
    toAddress: string;
    chain: string;
    walletId: string;
  }): Promise<ApprovalPolicy[]> {
    const policies = await this.loadPolicies();
    const spending = await this.getDailySpending(tx.walletId);
    const matchingPolicies: ApprovalPolicy[] = [];

    for (const policy of policies) {
      if (!policy.enabled) continue;

      const { conditions } = policy;
      let matches = false;

      // Check amount threshold
      if (conditions.minAmount && parseFloat(tx.amount) >= parseFloat(conditions.minAmount)) {
        matches = true;
      }

      // Check daily limit
      if (conditions.maxDailyLimit) {
        const todayTotal = parseFloat(spending?.total || '0') + parseFloat(tx.amount);
        if (todayTotal > parseFloat(conditions.maxDailyLimit)) {
          matches = true;
        }
      }

      // Check specific addresses
      if (conditions.addresses && conditions.addresses.length > 0) {
        if (conditions.addresses.some(a => a.toLowerCase() === tx.toAddress.toLowerCase())) {
          matches = true;
        }
      }

      // Check chains
      if (conditions.chains && conditions.chains.length > 0) {
        if (conditions.chains.includes(tx.chain)) {
          matches = true;
        }
      }

      // Always require approval
      if (conditions.always) {
        matches = true;
      }

      if (matches) {
        matchingPolicies.push(policy);
      }
    }

    return matchingPolicies;
  }

  /**
   * List all policies
   */
  async listPolicies(): Promise<ApprovalPolicy[]> {
    return this.loadPolicies();
  }

  /**
   * Toggle policy enabled state
   */
  async togglePolicy(id: string, enabled: boolean): Promise<ApprovalPolicy | null> {
    const policies = await this.loadPolicies();
    const policy = policies.find(p => p.id === id);
    
    if (policy) {
      policy.enabled = enabled;
      policy.updatedAt = new Date().toISOString();
      await this.savePolicies(policies);
    }
    
    return policy || null;
  }

  /**
   * Delete policy
   */
  async deletePolicy(id: string): Promise<boolean> {
    const policies = await this.loadPolicies();
    const index = policies.findIndex(p => p.id === id);
    
    if (index >= 0) {
      policies.splice(index, 1);
      await this.savePolicies(policies);
      return true;
    }
    
    return false;
  }

  // ============ Pending Transactions ============

  /**
   * Submit transaction for approval
   */
  async submitForApproval(tx: {
    type: PendingTransaction['type'];
    fromWalletId: string;
    toAddress: string;
    toName?: string;
    amount: string;
    chain: string;
    targetChain?: string;
    memo?: string;
    requestedBy: string;
  }): Promise<PendingTransaction | { approved: true }> {
    // Check if approval is required
    const policies = await this.getMatchingPolicies({
      amount: tx.amount,
      toAddress: tx.toAddress,
      chain: tx.chain,
      walletId: tx.fromWalletId,
    });

    // No policies match - auto-approve
    if (policies.length === 0) {
      return { approved: true };
    }

    // Use the strictest policy (most approvals required)
    const policy = policies.reduce((strictest, p) => 
      p.requiredApprovals > strictest.requiredApprovals ? p : strictest
    );

    const pending = await this.loadPending();

    const transaction: PendingTransaction = {
      id: crypto.randomUUID(),
      policyId: policy.id,
      type: tx.type,
      fromWalletId: tx.fromWalletId,
      toAddress: tx.toAddress,
      toName: tx.toName,
      amount: tx.amount,
      chain: tx.chain,
      targetChain: tx.targetChain,
      memo: tx.memo,
      status: 'pending',
      approvals: [],
      requestedBy: tx.requestedBy,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + policy.timeout * 1000).toISOString(),
    };

    pending.push(transaction);
    await this.savePending(pending);
    
    return transaction;
  }

  /**
   * Approve or reject a pending transaction
   */
  async decide(
    txId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    note?: string
  ): Promise<PendingTransaction | null> {
    const pending = await this.loadPending();
    const tx = pending.find(t => t.id === txId);
    
    if (!tx || tx.status !== 'pending') {
      return null;
    }

    // Check if already decided by this approver
    if (tx.approvals.some(a => a.approverId === approverId)) {
      throw new Error('Already submitted decision');
    }

    // Check if approver is authorized
    const policies = await this.loadPolicies();
    const policy = policies.find(p => p.id === tx.policyId);
    
    if (!policy || !policy.approvers.includes(approverId)) {
      throw new Error('Not authorized to approve this transaction');
    }

    // Record decision
    tx.approvals.push({
      approverId,
      decision,
      timestamp: new Date().toISOString(),
      note,
    });

    // Check if rejected
    if (decision === 'reject') {
      tx.status = 'rejected';
      tx.rejectionReason = note || 'Rejected by approver';
    }
    // Check if enough approvals
    else {
      const approvalCount = tx.approvals.filter(a => a.decision === 'approve').length;
      if (approvalCount >= policy.requiredApprovals) {
        tx.status = 'approved';
      }
    }

    await this.savePending(pending);
    return tx;
  }

  /**
   * Mark transaction as executed
   */
  async markExecuted(txId: string, txHash: string): Promise<PendingTransaction | null> {
    const pending = await this.loadPending();
    const tx = pending.find(t => t.id === txId);
    
    if (tx && tx.status === 'approved') {
      tx.status = 'executed';
      tx.txHash = txHash;
      tx.executedAt = new Date().toISOString();
      
      // Record spending
      await this.recordSpending(tx.fromWalletId, tx.amount, txHash);
      
      await this.savePending(pending);
    }
    
    return tx || null;
  }

  /**
   * Cancel a pending transaction
   */
  async cancel(txId: string, requesterId: string): Promise<PendingTransaction | null> {
    const pending = await this.loadPending();
    const tx = pending.find(t => t.id === txId);
    
    if (tx && tx.status === 'pending' && tx.requestedBy === requesterId) {
      tx.status = 'cancelled';
      await this.savePending(pending);
    }
    
    return tx || null;
  }

  /**
   * Get pending transactions
   */
  async getPending(options?: {
    status?: PendingTransaction['status'];
    approverId?: string;
  }): Promise<PendingTransaction[]> {
    let pending = await this.loadPending();
    
    if (options?.status) {
      pending = pending.filter(t => t.status === options.status);
    }
    
    if (options?.approverId) {
      const policies = await this.loadPolicies();
      const approverPolicies = policies.filter(p => 
        p.approvers.includes(options.approverId!)
      ).map(p => p.id);
      
      pending = pending.filter(t => approverPolicies.includes(t.policyId));
    }
    
    return pending.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Check and expire old transactions
   */
  async processExpired(): Promise<PendingTransaction[]> {
    const pending = await this.loadPending();
    const policies = await this.loadPolicies();
    const now = new Date();
    const expired: PendingTransaction[] = [];

    for (const tx of pending) {
      if (tx.status !== 'pending') continue;
      if (new Date(tx.expiresAt) > now) continue;

      const policy = policies.find(p => p.id === tx.policyId);
      
      if (policy?.timeoutAction === 'auto-approve') {
        tx.status = 'approved';
      } else {
        tx.status = 'expired';
      }
      
      expired.push(tx);
    }

    if (expired.length > 0) {
      await this.savePending(pending);
    }

    return expired;
  }

  // ============ Daily Spending Tracking ============

  /**
   * Get daily spending for a wallet
   */
  async getDailySpending(walletId: string): Promise<DailySpending | null> {
    const spending = await this.loadSpending();
    const today = new Date().toISOString().split('T')[0];
    return spending.find(s => s.date === today && s.walletId === walletId) || null;
  }

  /**
   * Record spending
   */
  private async recordSpending(walletId: string, amount: string, txHash: string): Promise<void> {
    const spending = await this.loadSpending();
    const today = new Date().toISOString().split('T')[0];
    
    let todaySpending = spending.find(s => s.date === today && s.walletId === walletId);
    
    if (!todaySpending) {
      todaySpending = {
        date: today,
        walletId,
        total: '0',
        transactions: [],
      };
      spending.push(todaySpending);
    }

    todaySpending.total = (parseFloat(todaySpending.total) + parseFloat(amount)).toString();
    todaySpending.transactions.push({
      amount,
      txHash,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const filtered = spending.filter(s => s.date >= thirtyDaysAgo);
    
    await this.saveSpending(filtered);
  }

  /**
   * Get spending history
   */
  async getSpendingHistory(walletId: string, days = 30): Promise<DailySpending[]> {
    const spending = await this.loadSpending();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return spending
      .filter(s => s.walletId === walletId && s.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ============ Helpers ============

  /**
   * Format pending transaction for display
   */
  formatPendingTx(tx: PendingTransaction): string {
    const typeEmoji = tx.type === 'send' ? '📤' : tx.type === 'bridge' ? '🌉' : '🔄';
    const statusEmoji = {
      pending: '⏳',
      approved: '✅',
      rejected: '❌',
      cancelled: '🚫',
      expired: '⌛',
      executed: '✓',
    }[tx.status];

    let text = `${typeEmoji} **${tx.amount} USDC** → ${tx.toName || this.shortAddress(tx.toAddress)}\n`;
    text += `Status: ${statusEmoji} ${tx.status.toUpperCase()}\n`;
    text += `Chain: ${tx.chain}${tx.targetChain ? ` → ${tx.targetChain}` : ''}\n`;
    
    if (tx.approvals.length > 0) {
      text += `Approvals: ${tx.approvals.filter(a => a.decision === 'approve').length}/${tx.approvals.length}\n`;
    }
    
    text += `Expires: ${new Date(tx.expiresAt).toLocaleString()}\n`;
    
    if (tx.memo) {
      text += `Memo: ${tx.memo}\n`;
    }

    return text;
  }

  private shortAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Create default approval policy for new users
   */
  async createDefaultPolicy(approverIds: string[]): Promise<ApprovalPolicy> {
    return this.createPolicy({
      name: 'Large Transactions (>500 USDC)',
      conditions: { minAmount: '500' },
      approvers: approverIds,
      requiredApprovals: 1,
      timeout: 86400, // 24 hours
      timeoutAction: 'cancel',
    });
  }
}

export default ApprovalManager;
