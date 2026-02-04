/**
 * Commission Splitter Module
 * 
 * Auto-distribute USDC commissions between multiple parties:
 * agents, brokers, referral partners, team members.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface SplitRecipient {
  id: string;
  name: string;
  role: 'listing_agent' | 'buyer_agent' | 'broker' | 'referral' | 'team_member' | 'company' | 'custom';
  walletAddress: string;
  
  // Split calculation
  splitType: 'percentage' | 'fixed';
  splitValue: string;  // e.g., "70" for 70% or "500" for $500 fixed
  
  // Caps and minimums
  minAmount?: string;
  maxAmount?: string;
  
  // For tiered splits (e.g., broker gets more after agent hits cap)
  tier?: number;
}

export interface CommissionSplit {
  id: string;
  name: string;
  description?: string;
  
  // Transaction details
  propertyAddress?: string;
  mlsNumber?: string;
  closingDate?: string;
  salePrice?: string;
  
  // Commission
  totalCommission: string;
  chain: string;
  sourceWalletId: string;
  
  // Recipients and their splits
  recipients: SplitRecipient[];
  
  // Calculated payouts
  payouts: {
    recipientId: string;
    amount: string;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    txHash?: string;
    sentAt?: string;
    error?: string;
  }[];
  
  // Overall status
  status: 'draft' | 'ready' | 'processing' | 'completed' | 'partial' | 'failed';
  
  // Execution
  executeAt?: string;  // Schedule for future
  executedAt?: string;
  
  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SplitTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Template recipients (without specific addresses)
  recipients: {
    role: SplitRecipient['role'];
    splitType: SplitRecipient['splitType'];
    splitValue: string;
    tier?: number;
  }[];
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: string;
  
  createdAt: string;
}

const DATA_DIR = process.env.USDC_DATA_DIR || './data';

/**
 * Commission Splitter
 */
export class CommissionSplitter {
  private splitsPath: string;
  private templatesPath: string;

  constructor(dataDir = DATA_DIR) {
    this.splitsPath = path.join(dataDir, 'commission-splits.json');
    this.templatesPath = path.join(dataDir, 'split-templates.json');
  }

  private async loadSplits(): Promise<CommissionSplit[]> {
    try {
      const data = await fs.readFile(this.splitsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveSplits(splits: CommissionSplit[]): Promise<void> {
    await fs.mkdir(path.dirname(this.splitsPath), { recursive: true });
    await fs.writeFile(this.splitsPath, JSON.stringify(splits, null, 2));
  }

  private async loadTemplates(): Promise<SplitTemplate[]> {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveTemplates(templates: SplitTemplate[]): Promise<void> {
    await fs.mkdir(path.dirname(this.templatesPath), { recursive: true });
    await fs.writeFile(this.templatesPath, JSON.stringify(templates, null, 2));
  }

  // ============ Split Creation ============

  /**
   * Create a commission split
   */
  async createSplit(params: {
    name: string;
    totalCommission: string;
    chain: string;
    sourceWalletId: string;
    recipients: Omit<SplitRecipient, 'id'>[];
    propertyAddress?: string;
    mlsNumber?: string;
    closingDate?: string;
    salePrice?: string;
    executeAt?: string;
    notes?: string;
  }): Promise<CommissionSplit> {
    const splits = await this.loadSplits();

    // Validate splits add up correctly
    const validation = this.validateSplits(params.totalCommission, params.recipients as SplitRecipient[]);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const split: CommissionSplit = {
      id: `CS-${Date.now().toString(36).toUpperCase()}`,
      name: params.name,
      totalCommission: params.totalCommission,
      chain: params.chain,
      sourceWalletId: params.sourceWalletId,
      propertyAddress: params.propertyAddress,
      mlsNumber: params.mlsNumber,
      closingDate: params.closingDate,
      salePrice: params.salePrice,
      recipients: params.recipients.map(r => ({
        ...r,
        id: crypto.randomUUID(),
      })),
      payouts: [],
      status: 'draft',
      executeAt: params.executeAt,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate payouts
    split.payouts = this.calculatePayouts(split);
    split.status = 'ready';

    splits.push(split);
    await this.saveSplits(splits);
    
    return split;
  }

  /**
   * Create split from template
   */
  async createFromTemplate(
    templateId: string,
    params: {
      totalCommission: string;
      chain: string;
      sourceWalletId: string;
      recipientAddresses: { role: string; name: string; address: string }[];
      propertyAddress?: string;
      closingDate?: string;
      salePrice?: string;
    }
  ): Promise<CommissionSplit> {
    const templates = await this.loadTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Map template roles to actual recipients
    const recipients: Omit<SplitRecipient, 'id'>[] = template.recipients.map(tr => {
      const actual = params.recipientAddresses.find(ra => ra.role === tr.role);
      if (!actual) {
        throw new Error(`No address provided for role: ${tr.role}`);
      }
      return {
        name: actual.name,
        role: tr.role,
        walletAddress: actual.address,
        splitType: tr.splitType,
        splitValue: tr.splitValue,
        tier: tr.tier,
      };
    });

    // Update template usage
    template.usageCount++;
    template.lastUsedAt = new Date().toISOString();
    await this.saveTemplates(templates);

    return this.createSplit({
      name: `${template.name} - ${params.propertyAddress || new Date().toLocaleDateString()}`,
      totalCommission: params.totalCommission,
      chain: params.chain,
      sourceWalletId: params.sourceWalletId,
      recipients,
      propertyAddress: params.propertyAddress,
      closingDate: params.closingDate,
      salePrice: params.salePrice,
    });
  }

  /**
   * Quick split for common scenarios
   */
  async quickSplit(params: {
    totalCommission: string;
    chain: string;
    sourceWalletId: string;
    scenario: 'listing_side' | 'buyer_side' | 'both_sides' | 'referral';
    agent: { name: string; address: string; split?: string };
    broker: { name: string; address: string; split?: string };
    referral?: { name: string; address: string; split?: string };
    propertyAddress?: string;
  }): Promise<CommissionSplit> {
    const recipients: Omit<SplitRecipient, 'id'>[] = [];

    // Default splits based on scenario
    const defaultSplits = {
      listing_side: { agent: '70', broker: '30' },
      buyer_side: { agent: '70', broker: '30' },
      both_sides: { agent: '70', broker: '30' },
      referral: { agent: '50', broker: '25', referral: '25' },
    };

    const splits = defaultSplits[params.scenario];

    // Agent
    recipients.push({
      name: params.agent.name,
      role: params.scenario === 'buyer_side' ? 'buyer_agent' : 'listing_agent',
      walletAddress: params.agent.address,
      splitType: 'percentage',
      splitValue: params.agent.split || splits.agent,
    });

    // Broker
    recipients.push({
      name: params.broker.name,
      role: 'broker',
      walletAddress: params.broker.address,
      splitType: 'percentage',
      splitValue: params.broker.split || splits.broker,
    });

    // Referral (if applicable)
    if (params.referral && params.scenario === 'referral') {
      recipients.push({
        name: params.referral.name,
        role: 'referral',
        walletAddress: params.referral.address,
        splitType: 'percentage',
        splitValue: params.referral.split || splits.referral || '25',
      });
    }

    return this.createSplit({
      name: `Commission - ${params.propertyAddress || 'Quick Split'}`,
      totalCommission: params.totalCommission,
      chain: params.chain,
      sourceWalletId: params.sourceWalletId,
      recipients,
      propertyAddress: params.propertyAddress,
    });
  }

  // ============ Payout Calculation ============

  /**
   * Calculate payouts for all recipients
   */
  private calculatePayouts(split: CommissionSplit): CommissionSplit['payouts'] {
    const total = parseFloat(split.totalCommission);
    const payouts: CommissionSplit['payouts'] = [];
    let remaining = total;

    // Sort by tier (lower tier = paid first)
    const sortedRecipients = [...split.recipients].sort((a, b) => 
      (a.tier || 0) - (b.tier || 0)
    );

    for (const recipient of sortedRecipients) {
      let amount: number;

      if (recipient.splitType === 'percentage') {
        amount = total * (parseFloat(recipient.splitValue) / 100);
      } else {
        amount = parseFloat(recipient.splitValue);
      }

      // Apply min/max caps
      if (recipient.minAmount && amount < parseFloat(recipient.minAmount)) {
        amount = parseFloat(recipient.minAmount);
      }
      if (recipient.maxAmount && amount > parseFloat(recipient.maxAmount)) {
        amount = parseFloat(recipient.maxAmount);
      }

      // Don't exceed remaining
      if (amount > remaining) {
        amount = remaining;
      }

      remaining -= amount;

      payouts.push({
        recipientId: recipient.id,
        amount: amount.toFixed(2),
        status: 'pending',
      });
    }

    return payouts;
  }

  /**
   * Validate splits add up correctly
   */
  private validateSplits(
    total: string, 
    recipients: SplitRecipient[]
  ): { valid: boolean; error?: string } {
    const totalAmount = parseFloat(total);
    let percentageSum = 0;
    let fixedSum = 0;

    for (const r of recipients) {
      if (r.splitType === 'percentage') {
        percentageSum += parseFloat(r.splitValue);
      } else {
        fixedSum += parseFloat(r.splitValue);
      }
    }

    // Check percentages
    if (percentageSum > 100) {
      return { valid: false, error: `Percentages sum to ${percentageSum}%, exceeds 100%` };
    }

    // Check fixed amounts
    const percentageAmount = totalAmount * (percentageSum / 100);
    if (fixedSum + percentageAmount > totalAmount) {
      return { valid: false, error: 'Fixed amounts + percentages exceed total commission' };
    }

    return { valid: true };
  }

  // ============ Execution ============

  /**
   * Execute a split (send all payouts)
   * Returns the split with updated payout statuses
   */
  async execute(
    splitId: string, 
    sendFn: (to: string, amount: string, chain: string) => Promise<{ txHash: string }>
  ): Promise<CommissionSplit | null> {
    const splits = await this.loadSplits();
    const split = splits.find(s => s.id === splitId);
    
    if (!split || split.status !== 'ready') {
      return null;
    }

    split.status = 'processing';
    await this.saveSplits(splits);

    let successCount = 0;
    let failCount = 0;

    for (const payout of split.payouts) {
      const recipient = split.recipients.find(r => r.id === payout.recipientId);
      if (!recipient) continue;

      payout.status = 'processing';
      
      try {
        const result = await sendFn(recipient.walletAddress, payout.amount, split.chain);
        payout.status = 'sent';
        payout.txHash = result.txHash;
        payout.sentAt = new Date().toISOString();
        successCount++;
      } catch (err: any) {
        payout.status = 'failed';
        payout.error = err.message;
        failCount++;
      }

      await this.saveSplits(splits);
    }

    // Update overall status
    if (failCount === 0) {
      split.status = 'completed';
    } else if (successCount === 0) {
      split.status = 'failed';
    } else {
      split.status = 'partial';
    }

    split.executedAt = new Date().toISOString();
    split.updatedAt = new Date().toISOString();
    await this.saveSplits(splits);

    return split;
  }

  /**
   * Retry failed payouts
   */
  async retryFailed(
    splitId: string,
    sendFn: (to: string, amount: string, chain: string) => Promise<{ txHash: string }>
  ): Promise<CommissionSplit | null> {
    const splits = await this.loadSplits();
    const split = splits.find(s => s.id === splitId);
    
    if (!split) return null;

    const failedPayouts = split.payouts.filter(p => p.status === 'failed');
    
    for (const payout of failedPayouts) {
      const recipient = split.recipients.find(r => r.id === payout.recipientId);
      if (!recipient) continue;

      try {
        const result = await sendFn(recipient.walletAddress, payout.amount, split.chain);
        payout.status = 'sent';
        payout.txHash = result.txHash;
        payout.sentAt = new Date().toISOString();
        payout.error = undefined;
      } catch (err: any) {
        payout.error = err.message;
      }
    }

    // Recalculate status
    const statuses = split.payouts.map(p => p.status);
    if (statuses.every(s => s === 'sent')) {
      split.status = 'completed';
    } else if (statuses.some(s => s === 'sent')) {
      split.status = 'partial';
    }

    split.updatedAt = new Date().toISOString();
    await this.saveSplits(splits);

    return split;
  }

  // ============ Templates ============

  /**
   * Create a split template
   */
  async createTemplate(params: {
    name: string;
    description?: string;
    recipients: SplitTemplate['recipients'];
  }): Promise<SplitTemplate> {
    const templates = await this.loadTemplates();

    const template: SplitTemplate = {
      id: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      recipients: params.recipients,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    templates.push(template);
    await this.saveTemplates(templates);
    
    return template;
  }

  /**
   * List templates
   */
  async listTemplates(): Promise<SplitTemplate[]> {
    return this.loadTemplates();
  }

  /**
   * Get common RE templates
   */
  async getDefaultTemplates(): Promise<SplitTemplate[]> {
    return [
      {
        id: 'default-70-30',
        name: 'Standard 70/30 Split',
        description: 'Agent gets 70%, broker gets 30%',
        recipients: [
          { role: 'listing_agent', splitType: 'percentage', splitValue: '70' },
          { role: 'broker', splitType: 'percentage', splitValue: '30' },
        ],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'default-80-20',
        name: 'Senior Agent 80/20',
        description: 'Senior agent split - 80% agent, 20% broker',
        recipients: [
          { role: 'listing_agent', splitType: 'percentage', splitValue: '80' },
          { role: 'broker', splitType: 'percentage', splitValue: '20' },
        ],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'default-referral',
        name: 'Referral Split',
        description: '25% to referral agent, remaining split 70/30',
        recipients: [
          { role: 'referral', splitType: 'percentage', splitValue: '25', tier: 1 },
          { role: 'listing_agent', splitType: 'percentage', splitValue: '52.5', tier: 2 },
          { role: 'broker', splitType: 'percentage', splitValue: '22.5', tier: 2 },
        ],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'default-team',
        name: 'Team Split',
        description: 'Team lead, agent, broker, team fee',
        recipients: [
          { role: 'company', splitType: 'fixed', splitValue: '500', tier: 1 },  // Team fee
          { role: 'listing_agent', splitType: 'percentage', splitValue: '50', tier: 2 },
          { role: 'team_member', splitType: 'percentage', splitValue: '20', tier: 2 },
          { role: 'broker', splitType: 'percentage', splitValue: '30', tier: 2 },
        ],
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ============ Queries ============

  /**
   * Get split by ID
   */
  async get(id: string): Promise<CommissionSplit | null> {
    const splits = await this.loadSplits();
    return splits.find(s => s.id === id) || null;
  }

  /**
   * List splits with filters
   */
  async list(filters?: {
    status?: CommissionSplit['status'];
    recipientAddress?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<CommissionSplit[]> {
    let splits = await this.loadSplits();
    
    if (filters?.status) {
      splits = splits.filter(s => s.status === filters.status);
    }
    if (filters?.recipientAddress) {
      splits = splits.filter(s => 
        s.recipients.some(r => 
          r.walletAddress.toLowerCase() === filters.recipientAddress!.toLowerCase()
        )
      );
    }
    if (filters?.fromDate) {
      splits = splits.filter(s => s.createdAt >= filters.fromDate!);
    }
    if (filters?.toDate) {
      splits = splits.filter(s => s.createdAt <= filters.toDate!);
    }
    
    return splits.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get pending splits (ready but not executed)
   */
  async getPending(): Promise<CommissionSplit[]> {
    return this.list({ status: 'ready' });
  }

  /**
   * Get splits due for execution
   */
  async getDue(): Promise<CommissionSplit[]> {
    const splits = await this.list({ status: 'ready' });
    const now = new Date().toISOString();
    
    return splits.filter(s => !s.executeAt || s.executeAt <= now);
  }

  // ============ Formatting ============

  /**
   * Format split summary
   */
  formatSplitSummary(split: CommissionSplit): string {
    const statusEmoji = {
      draft: '📝',
      ready: '✅',
      processing: '⏳',
      completed: '✓',
      partial: '⚠️',
      failed: '❌',
    }[split.status];

    let summary = `${statusEmoji} **Commission Split ${split.id}**\n\n`;
    
    if (split.propertyAddress) {
      summary += `📍 ${split.propertyAddress}\n`;
    }
    
    summary += `💵 Total: **$${split.totalCommission} USDC**\n`;
    summary += `Status: ${split.status.toUpperCase()}\n\n`;
    
    summary += `**Payouts:**\n`;
    for (const payout of split.payouts) {
      const recipient = split.recipients.find(r => r.id === payout.recipientId);
      const payoutEmoji = payout.status === 'sent' ? '✓' : payout.status === 'failed' ? '✗' : '○';
      summary += `${payoutEmoji} ${recipient?.name} (${recipient?.role}): $${payout.amount}\n`;
    }
    
    return summary;
  }
}

export default CommissionSplitter;
