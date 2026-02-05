/**
 * Pay Lobster Stats Module
 * Tracks total volume, transaction counts, and analytics
 * 🦞
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { CONTRACTS, ERC20_ABI } from './contracts';

const BASE_RPC = 'https://mainnet.base.org';
const STATS_FILE = path.join(process.env.HOME || '/tmp', '.paylobster', 'stats.json');

export interface PayLobsterStats {
  // Lifetime totals
  totalVolume: string;           // Total USDC moved through Pay Lobster (all wallets)
  totalTransactions: number;      // Total transaction count
  totalEscrowVolume: string;     // Total USDC locked in escrows
  totalEscrowsCreated: number;   // Number of escrows created
  
  // Tracked wallets
  trackedWallets: string[];      // All wallets using Pay Lobster
  
  // Per-wallet stats
  walletStats: Record<string, WalletStats>;
  
  // Time-based
  dailyVolume: Record<string, string>;  // YYYY-MM-DD -> volume
  
  // Last updated
  lastUpdated: string;
  lastBlock: number;
}

export interface WalletStats {
  address: string;
  totalSent: string;
  totalReceived: string;
  transactionCount: number;
  firstSeen: string;
  lastActive: string;
}

const DEFAULT_STATS: PayLobsterStats = {
  totalVolume: '0',
  totalTransactions: 0,
  totalEscrowVolume: '0',
  totalEscrowsCreated: 0,
  trackedWallets: [],
  walletStats: {},
  dailyVolume: {},
  lastUpdated: new Date().toISOString(),
  lastBlock: 0
};

/**
 * Load stats from disk
 */
export function loadStats(): PayLobsterStats {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { ...DEFAULT_STATS };
}

/**
 * Save stats to disk
 */
export function saveStats(stats: PayLobsterStats): void {
  try {
    const dir = path.dirname(STATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    stats.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

/**
 * Record a transfer in stats
 */
export function recordTransfer(
  from: string,
  to: string,
  amount: string,
  txHash: string
): PayLobsterStats {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  const amountNum = parseFloat(amount);
  
  // Update totals
  stats.totalVolume = (parseFloat(stats.totalVolume) + amountNum).toFixed(2);
  stats.totalTransactions += 1;
  
  // Update daily volume
  const currentDaily = parseFloat(stats.dailyVolume[today] || '0');
  stats.dailyVolume[today] = (currentDaily + amountNum).toFixed(2);
  
  // Track wallets
  for (const addr of [from, to]) {
    if (!stats.trackedWallets.includes(addr.toLowerCase())) {
      stats.trackedWallets.push(addr.toLowerCase());
    }
    
    // Initialize wallet stats
    if (!stats.walletStats[addr.toLowerCase()]) {
      stats.walletStats[addr.toLowerCase()] = {
        address: addr,
        totalSent: '0',
        totalReceived: '0',
        transactionCount: 0,
        firstSeen: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
    }
    
    const ws = stats.walletStats[addr.toLowerCase()];
    ws.transactionCount += 1;
    ws.lastActive = new Date().toISOString();
    
    if (addr.toLowerCase() === from.toLowerCase()) {
      ws.totalSent = (parseFloat(ws.totalSent) + amountNum).toFixed(2);
    }
    if (addr.toLowerCase() === to.toLowerCase()) {
      ws.totalReceived = (parseFloat(ws.totalReceived) + amountNum).toFixed(2);
    }
  }
  
  saveStats(stats);
  return stats;
}

/**
 * Record an escrow creation
 */
export function recordEscrow(amount: string): PayLobsterStats {
  const stats = loadStats();
  const amountNum = parseFloat(amount);
  
  stats.totalEscrowVolume = (parseFloat(stats.totalEscrowVolume) + amountNum).toFixed(2);
  stats.totalEscrowsCreated += 1;
  
  // Escrow also counts toward total volume
  stats.totalVolume = (parseFloat(stats.totalVolume) + amountNum).toFixed(2);
  stats.totalTransactions += 1;
  
  saveStats(stats);
  return stats;
}

/**
 * Query on-chain stats for a wallet (real-time from blockchain)
 */
export async function queryOnChainStats(walletAddress: string): Promise<{
  usdcBalance: string;
  ethBalance: string;
  incomingVolume: string;
  outgoingVolume: string;
  transactionCount: number;
}> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const usdc = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, provider);
  
  // Get current balances
  const [usdcBalanceRaw, ethBalanceRaw] = await Promise.all([
    usdc.balanceOf(walletAddress),
    provider.getBalance(walletAddress)
  ]);
  
  const usdcBalance = ethers.formatUnits(usdcBalanceRaw, 6);
  const ethBalance = ethers.formatEther(ethBalanceRaw);
  
  // For now, return balances (full history would require event scanning)
  return {
    usdcBalance,
    ethBalance,
    incomingVolume: '0',  // Would need event logs
    outgoingVolume: '0',  // Would need event logs
    transactionCount: 0   // Would need event logs
  };
}

/**
 * Get formatted stats summary
 */
export function getStatsSummary(): string {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  const todayVolume = stats.dailyVolume[today] || '0';
  
  return `
🦞 Pay Lobster Global Stats

💰 Total Volume: $${formatNumber(stats.totalVolume)} USDC
📊 Transactions: ${stats.totalTransactions.toLocaleString()}
🔒 Escrow Volume: $${formatNumber(stats.totalEscrowVolume)} USDC
📝 Escrows Created: ${stats.totalEscrowsCreated}

📈 Today's Volume: $${formatNumber(todayVolume)} USDC
👥 Tracked Wallets: ${stats.trackedWallets.length}

Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}
`.trim();
}

/**
 * Get leaderboard of top wallets by volume
 */
export function getLeaderboard(limit: number = 10): Array<{
  rank: number;
  address: string;
  totalVolume: string;
  transactions: number;
}> {
  const stats = loadStats();
  
  const wallets = Object.values(stats.walletStats)
    .map(w => ({
      address: w.address,
      totalVolume: (parseFloat(w.totalSent) + parseFloat(w.totalReceived)).toFixed(2),
      transactions: w.transactionCount
    }))
    .sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume))
    .slice(0, limit)
    .map((w, i) => ({ rank: i + 1, ...w }));
  
  return wallets;
}

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
  return n.toFixed(2);
}

export const stats = {
  load: loadStats,
  save: saveStats,
  recordTransfer,
  recordEscrow,
  queryOnChain: queryOnChainStats,
  getSummary: getStatsSummary,
  getLeaderboard
};
