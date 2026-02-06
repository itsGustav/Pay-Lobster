"use strict";
/**
 * Pay Lobster Autonomous Agent Features
 * Trust-gating and spending limits for autonomous AI agent operation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_SCORES = exports.SCORE_FOR_CREDIT = void 0;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.loadSpendingHistory = loadSpendingHistory;
exports.auditLog = auditLog;
exports.checkTrustGate = checkTrustGate;
exports.checkSpendingLimit = checkSpendingLimit;
exports.recordSpending = recordSpending;
exports.getSpendingSummary = getSpendingSummary;
exports.getSpendingHistory = getSpendingHistory;
exports.clearSpendingHistory = clearSpendingHistory;
exports.sendWithTrustGate = sendWithTrustGate;
exports.resetConfig = resetConfig;
exports.getAuditLog = getAuditLog;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ethers_1 = require("ethers");
const contracts_v3_1 = require("./contracts-v3");
// Config directory
const CONFIG_DIR = path.join(process.env.HOME || '~', '.paylobster');
const AUTONOMOUS_CONFIG_FILE = path.join(CONFIG_DIR, 'autonomous.json');
const SPENDING_HISTORY_FILE = path.join(CONFIG_DIR, 'spending-history.json');
const AUDIT_LOG_FILE = path.join(CONFIG_DIR, 'audit.log');
// Constants
exports.SCORE_FOR_CREDIT = 600;
exports.TIER_SCORES = {
    STANDARD: 0,
    BUILDING: 400,
    GOOD: 600,
    EXCELLENT: 750,
    ELITE: 900,
};
// Default configurations
const DEFAULT_TRUST_GATE_CONFIG = {
    enabled: false,
    minScore: exports.SCORE_FOR_CREDIT,
    minTier: 'GOOD',
    allowUnscored: false,
    exceptions: [],
};
const DEFAULT_SPENDING_CONFIG = {
    enabled: false,
    globalLimits: {
        maxTransaction: ethers_1.ethers.parseUnits('1000', 6), // 1000 USDC
        dailyLimit: ethers_1.ethers.parseUnits('5000', 6),
        weeklyLimit: ethers_1.ethers.parseUnits('20000', 6),
        monthlyLimit: ethers_1.ethers.parseUnits('50000', 6),
    },
    perAgent: {},
};
const DEFAULT_CONFIG = {
    trustGate: DEFAULT_TRUST_GATE_CONFIG,
    spending: DEFAULT_SPENDING_CONFIG,
    version: '3.1.0',
};
/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
/**
 * Load autonomous configuration
 */
function loadConfig() {
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
                if (limit.dailyLimit)
                    limit.dailyLimit = BigInt(limit.dailyLimit);
                if (limit.weeklyLimit)
                    limit.weeklyLimit = BigInt(limit.weeklyLimit);
                if (limit.monthlyLimit)
                    limit.monthlyLimit = BigInt(limit.monthlyLimit);
                if (limit.totalLimit)
                    limit.totalLimit = BigInt(limit.totalLimit);
            });
        }
        return config;
    }
    catch (error) {
        console.error('Error loading config, using defaults:', error);
        return DEFAULT_CONFIG;
    }
}
/**
 * Save autonomous configuration
 */
function saveConfig(config) {
    ensureConfigDir();
    // Convert bigint to string for JSON serialization
    const serializable = JSON.parse(JSON.stringify(config, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    fs.writeFileSync(AUTONOMOUS_CONFIG_FILE, JSON.stringify(serializable, null, 2));
}
/**
 * Load spending history
 */
function loadSpendingHistory() {
    ensureConfigDir();
    if (!fs.existsSync(SPENDING_HISTORY_FILE)) {
        return { records: [], lastCleanup: Date.now() };
    }
    try {
        const data = fs.readFileSync(SPENDING_HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Error loading spending history:', error);
        return { records: [], lastCleanup: Date.now() };
    }
}
/**
 * Save spending history
 */
function saveSpendingHistory(history) {
    ensureConfigDir();
    fs.writeFileSync(SPENDING_HISTORY_FILE, JSON.stringify(history, null, 2));
}
/**
 * Append to audit log
 */
function auditLog(message, data) {
    ensureConfigDir();
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(AUDIT_LOG_FILE, logEntry);
}
/**
 * Check trust gate before payment
 */
async function checkTrustGate(recipient, provider, config) {
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
        const reputation = new contracts_v3_1.PayLobsterReputation(provider);
        const score = await reputation.getTrustScore(recipient);
        // Check if unscored
        if (score === 0) {
            if (cfg.allowUnscored) {
                auditLog('Trust gate: Allowed (unscored, allowUnscored=true)', { recipient });
                return { allowed: true, score, reason: 'Unscored agent allowed by policy' };
            }
            else {
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
        const tierScore = exports.TIER_SCORES[cfg.minTier];
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
    }
    catch (error) {
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
function getTierName(score) {
    if (score >= exports.TIER_SCORES.ELITE)
        return 'ELITE';
    if (score >= exports.TIER_SCORES.EXCELLENT)
        return 'EXCELLENT';
    if (score >= exports.TIER_SCORES.GOOD)
        return 'GOOD';
    if (score >= exports.TIER_SCORES.BUILDING)
        return 'BUILDING';
    return 'STANDARD';
}
/**
 * Check spending limits before payment
 */
async function checkSpendingLimit(recipient, amount, config) {
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
                reason: `Amount ${ethers_1.ethers.formatUnits(amount, 6)} USDC exceeds per-agent limit ${ethers_1.ethers.formatUnits(agentLimit.maxAmount, 6)} USDC`,
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
                reason: `Daily limit to ${recipient} would be exceeded (${ethers_1.ethers.formatUnits(agentSpent.daily + amount, 6)}/${ethers_1.ethers.formatUnits(agentLimit.dailyLimit, 6)} USDC)`,
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
                reason: `Amount ${ethers_1.ethers.formatUnits(amount, 6)} USDC exceeds global transaction limit ${ethers_1.ethers.formatUnits(gl.maxTransaction, 6)} USDC`,
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
                reason: `Global daily limit would be exceeded (${ethers_1.ethers.formatUnits(globalSpent.daily + amount, 6)}/${ethers_1.ethers.formatUnits(gl.dailyLimit, 6)} USDC)`,
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
function recordSpending(recipient, amount, txHash) {
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
function getSpendingSummary(recipient) {
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
function getSpendingHistory(limit = 50) {
    const history = loadSpendingHistory();
    return history.records
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}
/**
 * Clear spending history (use with caution)
 */
function clearSpendingHistory() {
    saveSpendingHistory({ records: [], lastCleanup: Date.now() });
    auditLog('Spending history cleared');
}
/**
 * Wrapped send function with trust-gating and spending limits
 */
async function sendWithTrustGate(recipient, amount, provider, config) {
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
function resetConfig() {
    saveConfig(DEFAULT_CONFIG);
    auditLog('Config reset to defaults');
}
/**
 * Get audit log tail
 */
function getAuditLog(lines = 50) {
    ensureConfigDir();
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
        return [];
    }
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    const allLines = content.trim().split('\n').filter(l => l);
    return allLines.slice(-lines);
}
//# sourceMappingURL=autonomous.js.map