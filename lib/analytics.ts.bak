/**
 * Transaction Analytics & Reporting
 * 
 * Insights, summaries, and reports on USDC activity.
 */

import fs from 'fs/promises';
import path from 'path';

export interface TransactionRecord {
  id: string;
  type: 'send' | 'receive' | 'bridge';
  amount: string;
  fromAddress: string;
  toAddress: string;
  chain: string;
  targetChain?: string;
  txHash: string;
  fee?: string;
  timestamp: string;
  contactName?: string;
  category?: string;
  memo?: string;
}

export interface DailySummary {
  date: string;
  sent: string;
  received: string;
  net: string;
  txCount: number;
  fees: string;
}

export interface CategorySummary {
  category: string;
  sent: string;
  received: string;
  txCount: number;
}

export interface ContactSummary {
  name: string;
  address: string;
  sent: string;
  received: string;
  txCount: number;
  lastTxDate: string;
}

const DATA_DIR = process.env.USDC_DATA_DIR || './data';

/**
 * Analytics Engine
 */
export class AnalyticsEngine {
  private txPath: string;

  constructor(dataDir = DATA_DIR) {
    this.txPath = path.join(dataDir, 'transactions.json');
  }

  private async loadTransactions(): Promise<TransactionRecord[]> {
    try {
      const data = await fs.readFile(this.txPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveTransactions(txs: TransactionRecord[]): Promise<void> {
    await fs.mkdir(path.dirname(this.txPath), { recursive: true });
    await fs.writeFile(this.txPath, JSON.stringify(txs, null, 2));
  }

  /**
   * Record a transaction for analytics
   */
  async recordTransaction(tx: Omit<TransactionRecord, 'id'>): Promise<TransactionRecord> {
    const txs = await this.loadTransactions();
    
    const record: TransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...tx,
    };

    txs.push(record);
    await this.saveTransactions(txs);
    
    return record;
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters?: {
    type?: TransactionRecord['type'];
    chain?: string;
    fromDate?: string;
    toDate?: string;
    minAmount?: string;
    maxAmount?: string;
    contact?: string;
    category?: string;
    limit?: number;
  }): Promise<TransactionRecord[]> {
    let txs = await this.loadTransactions();

    if (filters?.type) {
      txs = txs.filter(tx => tx.type === filters.type);
    }
    if (filters?.chain) {
      txs = txs.filter(tx => tx.chain === filters.chain);
    }
    if (filters?.fromDate) {
      txs = txs.filter(tx => tx.timestamp >= filters.fromDate!);
    }
    if (filters?.toDate) {
      txs = txs.filter(tx => tx.timestamp <= filters.toDate!);
    }
    if (filters?.minAmount) {
      txs = txs.filter(tx => parseFloat(tx.amount) >= parseFloat(filters.minAmount!));
    }
    if (filters?.maxAmount) {
      txs = txs.filter(tx => parseFloat(tx.amount) <= parseFloat(filters.maxAmount!));
    }
    if (filters?.contact) {
      const contactLower = filters.contact.toLowerCase();
      txs = txs.filter(tx => tx.contactName?.toLowerCase().includes(contactLower));
    }
    if (filters?.category) {
      txs = txs.filter(tx => tx.category === filters.category);
    }

    txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      txs = txs.slice(0, filters.limit);
    }

    return txs;
  }

  /**
   * Get daily summaries for a date range
   */
  async getDailySummaries(fromDate: string, toDate: string): Promise<DailySummary[]> {
    const txs = await this.getTransactions({ fromDate, toDate });
    const dailyMap = new Map<string, DailySummary>();

    for (const tx of txs) {
      const date = tx.timestamp.split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          sent: '0',
          received: '0',
          net: '0',
          txCount: 0,
          fees: '0',
        });
      }

      const summary = dailyMap.get(date)!;
      const amount = parseFloat(tx.amount);
      
      if (tx.type === 'send') {
        summary.sent = (parseFloat(summary.sent) + amount).toString();
      } else if (tx.type === 'receive') {
        summary.received = (parseFloat(summary.received) + amount).toString();
      }
      
      summary.txCount++;
      
      if (tx.fee) {
        summary.fees = (parseFloat(summary.fees) + parseFloat(tx.fee)).toString();
      }
    }

    // Calculate net
    for (const summary of dailyMap.values()) {
      summary.net = (parseFloat(summary.received) - parseFloat(summary.sent)).toString();
    }

    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(fromDate?: string, toDate?: string): Promise<CategorySummary[]> {
    const txs = await this.getTransactions({ fromDate, toDate });
    const categoryMap = new Map<string, CategorySummary>();

    for (const tx of txs) {
      const category = tx.category || 'Uncategorized';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          sent: '0',
          received: '0',
          txCount: 0,
        });
      }

      const summary = categoryMap.get(category)!;
      const amount = parseFloat(tx.amount);
      
      if (tx.type === 'send') {
        summary.sent = (parseFloat(summary.sent) + amount).toString();
      } else if (tx.type === 'receive') {
        summary.received = (parseFloat(summary.received) + amount).toString();
      }
      
      summary.txCount++;
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => parseFloat(b.sent) + parseFloat(b.received) - parseFloat(a.sent) - parseFloat(a.received));
  }

  /**
   * Get top contacts by volume
   */
  async getTopContacts(limit = 10, fromDate?: string, toDate?: string): Promise<ContactSummary[]> {
    const txs = await this.getTransactions({ fromDate, toDate });
    const contactMap = new Map<string, ContactSummary>();

    for (const tx of txs) {
      // Use contact name or address
      const key = tx.contactName || (tx.type === 'send' ? tx.toAddress : tx.fromAddress);
      const address = tx.type === 'send' ? tx.toAddress : tx.fromAddress;
      
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          name: tx.contactName || this.shortAddress(address),
          address,
          sent: '0',
          received: '0',
          txCount: 0,
          lastTxDate: tx.timestamp,
        });
      }

      const summary = contactMap.get(key)!;
      const amount = parseFloat(tx.amount);
      
      if (tx.type === 'send') {
        summary.sent = (parseFloat(summary.sent) + amount).toString();
      } else if (tx.type === 'receive') {
        summary.received = (parseFloat(summary.received) + amount).toString();
      }
      
      summary.txCount++;
      
      if (tx.timestamp > summary.lastTxDate) {
        summary.lastTxDate = tx.timestamp;
      }
    }

    return Array.from(contactMap.values())
      .sort((a, b) => {
        const volumeA = parseFloat(a.sent) + parseFloat(a.received);
        const volumeB = parseFloat(b.sent) + parseFloat(b.received);
        return volumeB - volumeA;
      })
      .slice(0, limit);
  }

  /**
   * Get total stats
   */
  async getTotalStats(fromDate?: string, toDate?: string): Promise<{
    totalSent: string;
    totalReceived: string;
    totalBridged: string;
    netFlow: string;
    totalFees: string;
    txCount: number;
    avgTxSize: string;
    largestTx: TransactionRecord | null;
    mostFrequentContact: ContactSummary | null;
  }> {
    const txs = await this.getTransactions({ fromDate, toDate });
    
    let totalSent = 0;
    let totalReceived = 0;
    let totalBridged = 0;
    let totalFees = 0;
    let largestTx: TransactionRecord | null = null;
    let largestAmount = 0;

    for (const tx of txs) {
      const amount = parseFloat(tx.amount);
      
      if (tx.type === 'send') {
        totalSent += amount;
      } else if (tx.type === 'receive') {
        totalReceived += amount;
      } else if (tx.type === 'bridge') {
        totalBridged += amount;
      }
      
      if (tx.fee) {
        totalFees += parseFloat(tx.fee);
      }
      
      if (amount > largestAmount) {
        largestAmount = amount;
        largestTx = tx;
      }
    }

    const contacts = await this.getTopContacts(1, fromDate, toDate);

    return {
      totalSent: totalSent.toFixed(2),
      totalReceived: totalReceived.toFixed(2),
      totalBridged: totalBridged.toFixed(2),
      netFlow: (totalReceived - totalSent).toFixed(2),
      totalFees: totalFees.toFixed(6),
      txCount: txs.length,
      avgTxSize: txs.length > 0 
        ? ((totalSent + totalReceived) / txs.length).toFixed(2) 
        : '0',
      largestTx,
      mostFrequentContact: contacts[0] || null,
    };
  }

  /**
   * Get chain distribution
   */
  async getChainDistribution(fromDate?: string, toDate?: string): Promise<{
    chain: string;
    sent: string;
    received: string;
    txCount: number;
    percentage: string;
  }[]> {
    const txs = await this.getTransactions({ fromDate, toDate });
    const chainMap = new Map<string, { sent: number; received: number; count: number }>();
    let totalVolume = 0;

    for (const tx of txs) {
      const chain = tx.chain;
      
      if (!chainMap.has(chain)) {
        chainMap.set(chain, { sent: 0, received: 0, count: 0 });
      }

      const stats = chainMap.get(chain)!;
      const amount = parseFloat(tx.amount);
      
      if (tx.type === 'send') {
        stats.sent += amount;
      } else if (tx.type === 'receive') {
        stats.received += amount;
      }
      
      stats.count++;
      totalVolume += amount;
    }

    return Array.from(chainMap.entries())
      .map(([chain, stats]) => ({
        chain,
        sent: stats.sent.toFixed(2),
        received: stats.received.toFixed(2),
        txCount: stats.count,
        percentage: totalVolume > 0 
          ? ((stats.sent + stats.received) / totalVolume * 100).toFixed(1)
          : '0',
      }))
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  }

  /**
   * Generate summary report text
   */
  async generateReport(fromDate?: string, toDate?: string): Promise<string> {
    const stats = await this.getTotalStats(fromDate, toDate);
    const dailies = await this.getDailySummaries(
      fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      toDate || new Date().toISOString()
    );
    const chains = await this.getChainDistribution(fromDate, toDate);
    const topContacts = await this.getTopContacts(5, fromDate, toDate);

    let report = '# 📊 USDC Activity Report\n\n';
    
    if (fromDate || toDate) {
      report += `Period: ${fromDate || 'start'} to ${toDate || 'now'}\n\n`;
    }

    report += '## Summary\n';
    report += `- Total Sent: **$${stats.totalSent} USDC**\n`;
    report += `- Total Received: **$${stats.totalReceived} USDC**\n`;
    report += `- Net Flow: **$${stats.netFlow} USDC**\n`;
    report += `- Transactions: ${stats.txCount}\n`;
    report += `- Avg Transaction: $${stats.avgTxSize} USDC\n`;
    report += `- Total Fees: $${stats.totalFees}\n\n`;

    if (stats.largestTx) {
      report += '## Largest Transaction\n';
      report += `$${stats.largestTx.amount} USDC (${stats.largestTx.type}) on ${new Date(stats.largestTx.timestamp).toLocaleDateString()}\n\n`;
    }

    if (chains.length > 0) {
      report += '## Chain Distribution\n';
      for (const chain of chains) {
        report += `- ${chain.chain}: ${chain.percentage}% (${chain.txCount} txs)\n`;
      }
      report += '\n';
    }

    if (topContacts.length > 0) {
      report += '## Top Contacts\n';
      for (const contact of topContacts) {
        const volume = (parseFloat(contact.sent) + parseFloat(contact.received)).toFixed(2);
        report += `- ${contact.name}: $${volume} USDC (${contact.txCount} txs)\n`;
      }
      report += '\n';
    }

    if (dailies.length > 0 && dailies.length <= 14) {
      report += '## Daily Activity (Last 14 Days)\n';
      for (const day of dailies.slice(0, 14)) {
        const netPrefix = parseFloat(day.net) >= 0 ? '+' : '';
        report += `- ${day.date}: ${day.txCount} txs, net: ${netPrefix}$${day.net}\n`;
      }
    }

    return report;
  }

  /**
   * Categorize a transaction
   */
  async categorize(txId: string, category: string): Promise<TransactionRecord | null> {
    const txs = await this.loadTransactions();
    const tx = txs.find(t => t.id === txId);
    
    if (tx) {
      tx.category = category;
      await this.saveTransactions(txs);
    }
    
    return tx || null;
  }

  /**
   * Export transactions to CSV
   */
  async exportCSV(fromDate?: string, toDate?: string): Promise<string> {
    const txs = await this.getTransactions({ fromDate, toDate });
    
    const header = 'Date,Type,Amount,From,To,Chain,TxHash,Fee,Category,Memo\n';
    const rows = txs.map(tx => 
      `${tx.timestamp},${tx.type},${tx.amount},${tx.fromAddress},${tx.toAddress},${tx.chain},${tx.txHash},${tx.fee || ''},${tx.category || ''},"${tx.memo || ''}"`
    );
    
    return header + rows.join('\n');
  }

  private shortAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export default AnalyticsEngine;
