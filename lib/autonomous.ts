/**
 * Pay Lobster Autonomous Agent Features
 * Trust-gating and spending limits for autonomous AI agent operation
 */

import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import { PayLobsterReputation, PayLobsterCredit, V3_ADDRESSES } from './contracts-v3';

// Config directory
const CONFIG_DIR = path.join(process.env.HOME || '~', '.paylobster');
const AUTONOMOUS_CONFIG_FILE = path.join(CONFIG_DIR, 'autonomous.json');
const SPENDING_HISTORY_FILE = path.join(CONFIG_DIR, 'spending-history.json');
const AUDIT_LOG_FILE = path.join(CONFIG_DIR, 'audit.log');

// Constants
export const SCORE_FOR_CREDIT = 600;
export const TIER_SCORES = {
  STANDARD: 0,
  BUILDING: 400,
  GOOD: 600,
  EXCELLENT: 750,
  ELITE: 900,
};

// Type definitions
export interface TrustGateConfig {
  enabled: boolean;
  minScore: number;
  minTier: 'STANDARD' | 'BUILDING' | 'GOOD' | 'EXCELLENT' | 'ELITE';
  allowUnscored: boolean;
  exceptions: string[];
}

export interface SpendingLimit {
  address: string;
  maxAmount: bigint;
  dailyLimit?: bigint;
  weeklyLimit?: bigint;
  monthlyLimit?: bigint;
  totalLimit?: bigint;
}

export interface SpendingConfig {
  enabled: boolean;
  globalLimits?: {
    maxTransaction: bigint;
    dailyLimit: bigint;
    weeklyLimit: bigint;
    monthlyLimit: bigint;
  };
  perAgent: Record<string, SpendingLimit>;
}

export interface AutonomousConfig {
  trustGate: TrustGateConfig;
  spending: SpendingConfig;
  version: string;
}

export interface SpendingRecord {
  timestamp: number;
  recipient: string;
  amount: string;
  txHash?: string;
}

export interface SpendingHistory {
  records: SpendingRecord[];
  lastCleanup: number;
}

export interface TrustGateResult {
  allowed: boolean;
  reason?: string;
  score?: number;
  tier?: string;
}

export interface SpendingLimitResult {
  allowed: boolean;
  reason?: string;
  remaining?: {
    transaction: bigint;
    daily: bigint;
    weekly: bigint;
    monthly: bigint;
  };
}

// Default configurations
const DEFAULT_TRUST_GATE_CONFIG: TrustGateConfig = {
  enabled: false,
  minScore: SCORE_FOR_CREDIT,
  minTier: 'GOOD',
  allowUnscored: false,
  exceptions: [],
};

const DEFAULT_SPENDING_CONFIG: SpendingConfig = {
  enabled: false,
  globalLimits: {
    maxTransaction: ethers.parseUnits('1000', 6), // 1000 USDC
    dailyLimit: ethers.parseUnits('5000', 6),
    weeklyLimit: ethers.parseUnits('20000', 6),
    monthlyLimit: ethers.parseUnits('50000', 6),
  },
  perAgent: {},
};

const DEFAULT_CONFIG: AutonomousConfig = {
  trustGate: DEFAULT_TRUST_GATE_CONFIG,
  spending: DEFAULT_SPENDING_CONFIG,
  version: '3.1.0',
};

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load autonomous configuration
 */
export function loadConfig(): AutonomousConfig {
  ensureConfigDir();
  
  if (!fs.existsSync(AUTONOMOUS_CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  
  try {
    const data = fs.readFileSync(AUTONOMOUS_CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    
    // Convert string amounts to bigint
    if (config.spending?.globalLimits) {
      const gl = config.spending.globalLimits;
      gl.maxTransaction = BigInt(gl.maxTransaction);
      gl.dailyLimit = BigInt(gl.dailyLimit);
      gl.weeklyLimit = BigInt(gl.weeklyLimit);
      gl.monthlyLimit = BigInt(gl.monthlyLimit);
    }
    
    if (config.spending?.perAgent) {
      Object.keys(config.spending.perAgent).forEach(addr => {
        const limit = config.spending.perAgent[addr];
        limit.maxAmount = BigInt(limit.maxAmount);
        if (limit.dailyLimit) limit.dailyLimit = BigInt(limit.dailyLimit);
        if (limit.weeklyLimit) limit.weeklyLimit = BigInt(limit.weeklyLimit);
        if (limit.monthlyLimit) limit.monthlyLimit = BigInt(limit.monthlyLimit);
        if (limit.totalLimit) limit.totalLimit = BigInt(limit.totalLimit);
      });
    }
    
    return config;
  } catch (error) {
    console.error('Error loading config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save autonomous configuration
 */
export function saveConfig(config: AutonomousConfig): void {
  ensureConfigDir();
  
  // Convert bigint to string for JSON serialization
  const serializable = JSON.parse(JSON.stringify(config, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
  
  fs.writeFileSync(AUTONOMOUS_CONFIG_FILE, JSON.stringify(serializable, null, 2));
}

/**
 * Load spending history
 */
export function loadSpendingHistory(): SpendingHistory {
  ensureConfigDir();
  
  if (!fs.existsSync(SPENDING_HISTORY_FILE)) {
    return { records: [], lastCleanup: Date.now() };
  }
  
  try {
    const data = fs.readFileSync(SPENDING_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading spending history:', error);
    return { records: [], lastCleanup: Date.now() };
  }
}

/**
 * Save spending history
 */
function saveSpendingHistory(history: SpendingHistory): void {
  ensureConfigDir();
  fs.writeFileSync(SPENDING_HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Append to audit log
 */
export function auditLog(message: string, data?: any): void {
  ensureConfigDir();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  fs.appendFileSync(AUDIT_LOG_FILE, logEntry);
}

/**
 * Check trust gate before payment
 */
export async function checkTrustGate(
  recipient: string,
  provider: ethers.Provider,
  config?: TrustGateConfig
): Promise<TrustGateResult> {
  const cfg = config || loadConfig().trustGate;
  
  if (!cfg.enabled) {
    return { allowed: true };
  }
  
  // Check exceptions list
  const recipientLower = recipient.toLowerCase();
  if (cfg.exceptions.some(addr => addr.toLowerCase() === recipientLower)) {
    auditLog('Trust gate: Allowed (exception)', { recipient });
    return { allowed: true, reason: 'Address in exceptions list' };
  }
  
  try {
    // Query reputation contract
    const reputation = new PayLobsterReputation(provider);
    const score = await reputation.getTrustScore(recipient);
    
    // Check if unscored
    if (score === 0) {
      if (cfg.allowUnscored) {
        auditLog('Trust gate: Allowed (unscored, allowUnscored=true)', { recipient });
        return { allowed: true, score, reason: 'Unscored agent allowed by policy' };
      } else {
        auditLog('Trust gate: Blocked (unscored)', { recipient, score });
        return {
          allowed: false,
          score,
          reason: `Agent has no trust score. Minimum required: ${cfg.minScore}`,
        };
      }
    }
    
    // Check minimum score
    if (score < cfg.minScore) {
      auditLog('Trust gate: Blocked (low score)', { recipient, score, minScore: cfg.minScore });
      return {
        allowed: false,
        score,
        reason: `Agent score ${score} below minimum ${cfg.minScore}`,
      };
    }
    
    // Check tier
    const tierScore = TIER_SCORES[cfg.minTier];
    if (score < tierScore) {
      auditLog('Trust gate: Blocked (low tier)', { recipient, score, minTier: cfg.minTier });
      return {
        allowed: false,
        score,
        tier: getTierName(score),
        reason: `Agent tier ${getTierName(score)} below required ${cfg.minTier}`,
      };
    }
    
    auditLog('Trust gate: Allowed', { recipient, score });
    return { allowed: true, score, tier: getTierName(score) };
    
  } catch (error) {
    auditLog('Trust gate: Error checking reputation', { recipient, error: String(error) });
    // Fail closed - reject on error
    return {
      allowed: false,
      reason: `Error checking reputation: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get tier name from score
 */
function getTierName(score: number): string {
  if (score >= TIER_SCORES.ELITE) return 'ELITE';
  if (score >= TIER_SCORES.EXCELLENT) return 'EXCELLENT';
  if (score >= TIER_SCORES.GOOD) return 'GOOD';
  if (score >= TIER_SCORES.BUILDING) return 'BUILDING';
  return 'STANDARD';
}

/**
 * Check spending limits before payment
 */
export async function checkSpendingLimit(
  recipient: string,
  amount: bigint,
  config?: SpendingConfig
): Promise<SpendingLimitResult> {
  const cfg = config || loadConfig().spending;
  
  if (!cfg.enabled) {
    return { allowed: true };
  }
  
  const history = loadSpendingHistory();
  const now = Date.now();
  
  // Calculate time windows
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  // Filter records by time windows
  const recentRecords = history.records.filter(r => r.timestamp > dayAgo);
  const dailyRecords = recentRecords;
  const weeklyRecords = history.records.filter(r => r.timestamp > weekAgo);
  const monthlyRecords = history.records.filter(r => r.timestamp > monthAgo);
  
  // Check per-agent limits first
  const recipientLower = recipient.toLowerCase();
  const agentLimit = cfg.perAgent[recipientLower];
  
  if (agentLimit) {
    // Check transaction limit
    if (amount > agentLimit.maxAmount) {
      auditLog('Spending limit: Blocked (per-agent tx limit)', {
        recipient,
        amount: amount.toString(),
        limit: agentLimit.maxAmount.toString(),
      });
      return {
        allowed: false,
        reason: `Amount ${ethers.formatUnits(amount, 6)} USDC exceeds per-agent limit ${ethers.formatUnits(agentLimit.maxAmount, 6)} USDC`,
      };
    }
    
    // Check time-based limits
    const agentRecords = {
      daily: dailyRecords.filter(r => r.recipient.toLowerCase() === recipientLower),
      weekly: weeklyRecords.filter(r => r.recipient.toLowerCase() === recipientLower),
      monthly: monthlyRecords.filter(r => r.recipient.toLowerCase() === recipientLower),
      total: history.records.filter(r => r.recipient.toLowerCase() === recipientLower),
    };
    
    const agentSpent = {
      daily: agentRecords.daily.reduce((sum, r) => sum + BigInt(r.amount), 0n),
      weekly: agentRecords.weekly.reduce((sum, r) => sum + BigInt(r.amount), 0n),
      monthly: agentRecords.monthly.reduce((sum, r) => sum + BigInt(r.amount), 0n),
      total: agentRecords.total.reduce((sum, r) => sum + BigInt(r.amount), 0n),
    };
    
    if (agentLimit.dailyLimit && agentSpent.daily + amount > agentLimit.dailyLimit) {
      auditLog('Spending limit: Blocked (per-agent daily)', { recipient, amount: amount.toString() });
      return {
        allowed: false,
        reason: `Daily limit to ${recipient} would be exceeded (${ethers.formatUnits(agentSpent.daily + amount, 6)}/${ethers.formatUnits(agentLimit.dailyLimit, 6)} USDC)`,
      };
    }
    
    if (agentLimit.weeklyLimit && agentSpent.weekly + amount > agentLimit.weeklyLimit) {
      auditLog('Spending limit: Blocked (per-agent weekly)', { recipient, amount: amount.toString() });
      return {
        allowed: false,
        reason: `Weekly limit to ${recipient} would be exceeded`,
      };
    }
    
    if (agentLimit.monthlyLimit && agentSpent.monthly + amount > agentLimit.monthlyLimit) {
      auditLog('Spending limit: Blocked (per-agent monthly)', { recipient, amount: amount.toString() });
      return {
        allowed: false,
        reason: `Monthly limit to ${recipient} would be exceeded`,
      };
    }
    
    if (agentLimit.totalLimit && agentSpent.total + amount > agentLimit.totalLimit) {
      auditLog('Spending limit: Blocked (per-agent total)', { recipient, amount: amount.toString() });
      return {
        allowed: false,
        reason: `Lifetime limit to ${recipient} would be exceeded`,
      };
    }
  }
  
  // Check global limits
  if (cfg.globalLimits) {
    const gl = cfg.globalLimits;
    
    // Check transaction limit
    if (amount > gl.maxTransaction) {
      auditLog('Spending limit: Blocked (global tx limit)', { amount: amount.toString() });
      return {
        allowed: false,
        reason: `Amount ${ethers.formatUnits(amount, 6)} USDC exceeds global transaction limit ${ethers.formatUnits(gl.maxTransaction, 6)} USDC`,
      };
    }
    
    // Calculate global spending
    const globalSpent = {
      daily: dailyRecords.reduce((sum, r) => sum + BigInt(r.amount), 0n),
      weekly: weeklyRecords.reduce((sum, r) => sum + BigInt(r.amount), 0n),
      monthly: monthlyRecords.reduce((sum, r) => sum + BigInt(r.amount), 0n),
    };
    
    if (globalSpent.daily + amount > gl.dailyLimit) {
      auditLog('Spending limit: Blocked (global daily)', { amount: amount.toString() });
      return {
        allowed: false,
        reason: `Global daily limit would be exceeded (${ethers.formatUnits(globalSpent.daily + amount, 6)}/${ethers.formatUnits(gl.dailyLimit, 6)} USDC)`,
        remaining: {
          transaction: gl.maxTransaction - amount,
          daily: gl.dailyLimit - globalSpent.daily,
          weekly: gl.weeklyLimit - globalSpent.weekly,
          monthly: gl.monthlyLimit - globalSpent.monthly,
        },
      };
    }
    
    if (globalSpent.weekly + amount > gl.weeklyLimit) {
      auditLog('Spending limit: Blocked (global weekly)', { amount: amount.toString() });
      return {
        allowed: false,
        reason: `Global weekly limit would be exceeded`,
      };
    }
    
    if (globalSpent.monthly + amount > gl.monthlyLimit) {
      auditLog('Spending limit: Blocked (global monthly)', { amount: amount.toString() });
      return {
        allowed: false,
        reason: `Global monthly limit would be exceeded`,
      };
    }
    
    // Calculate remaining
    const remaining = {
      transaction: gl.maxTransaction,
      daily: gl.dailyLimit - globalSpent.daily,
      weekly: gl.weeklyLimit - globalSpent.weekly,
      monthly: gl.monthlyLimit - globalSpent.monthly,
    };
    
    auditLog('Spending limit: Allowed', { recipient, amount: amount.toString(), remaining });
    return { allowed: true, remaining };
  }
  
  auditLog('Spending limit: Allowed (no limits configured)', { recipient, amount: amount.toString() });
  return { allowed: true };
}

/**
 * Record spending after successful transaction
 */
export function recordSpending(recipient: string, amount: bigint, txHash?: string): void {
  const history = loadSpendingHistory();
  
  history.records.push({
    timestamp: Date.now(),
    recipient: recipient.toLowerCase(),
    amount: amount.toString(),
    txHash,
  });
  
  // Cleanup old records (older than 31 days)
  const cutoff = Date.now() - 31 * 24 * 60 * 60 * 1000;
  if (Date.now() - history.lastCleanup > 24 * 60 * 60 * 1000) {
    history.records = history.records.filter(r => r.timestamp > cutoff);
    history.lastCleanup = Date.now();
  }
  
  saveSpendingHistory(history);
  auditLog('Spending recorded', { recipient, amount: amount.toString(), txHash });
}

/**
 * Get spending summary for an address
 */
export function getSpendingSummary(recipient?: string): {
  daily: bigint;
  weekly: bigint;
  monthly: bigint;
  total: bigint;
  count: number;
} {
  const history = loadSpendingHistory();
  const now = Date.now();
  
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  let records = history.records;
  if (recipient) {
    const recipientLower = recipient.toLowerCase();
    records = records.filter(r => r.recipient.toLowerCase() === recipientLower);
  }
  
  return {
    daily: records.filter(r => r.timestamp > dayAgo).reduce((sum, r) => sum + BigInt(r.amount), 0n),
    weekly: records.filter(r => r.timestamp > weekAgo).reduce((sum, r) => sum + BigInt(r.amount), 0n),
    monthly: records.filter(r => r.timestamp > monthAgo).reduce((sum, r) => sum + BigInt(r.amount), 0n),
    total: records.reduce((sum, r) => sum + BigInt(r.amount), 0n),
    count: records.length,
  };
}

/**
 * Get spending history by recipient
 */
export function getSpendingHistory(limit: number = 50): SpendingRecord[] {
  const history = loadSpendingHistory();
  return history.records
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Clear spending history (use with caution)
 */
export function clearSpendingHistory(): void {
  saveSpendingHistory({ records: [], lastCleanup: Date.now() });
  auditLog('Spending history cleared');
}

/**
 * Wrapped send function with trust-gating and spending limits
 */
export async function sendWithTrustGate(
  recipient: string,
  amount: bigint,
  provider: ethers.Provider,
  config?: AutonomousConfig
): Promise<{ allowed: boolean; reason?: string; checks: any }> {
  const cfg = config || loadConfig();
  
  // Check trust gate
  const trustResult = await checkTrustGate(recipient, provider, cfg.trustGate);
  if (!trustResult.allowed) {
    return {
      allowed: false,
      reason: trustResult.reason,
      checks: { trustGate: trustResult },
    };
  }
  
  // Check spending limits
  const spendingResult = await checkSpendingLimit(recipient, amount, cfg.spending);
  if (!spendingResult.allowed) {
    return {
      allowed: false,
      reason: spendingResult.reason,
      checks: { trustGate: trustResult, spendingLimit: spendingResult },
    };
  }
  
  return {
    allowed: true,
    checks: { trustGate: trustResult, spendingLimit: spendingResult },
  };
}

/**
 * Reset config to defaults
 */
export function resetConfig(): void {
  saveConfig(DEFAULT_CONFIG);
  auditLog('Config reset to defaults');
}

/**
 * Get audit log tail
 */
export function getAuditLog(lines: number = 50): string[] {
  ensureConfigDir();
  
  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
  const allLines = content.trim().split('\n').filter(l => l);
  return allLines.slice(-lines);
}
