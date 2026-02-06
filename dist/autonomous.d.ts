/**
 * Pay Lobster Autonomous Agent Features
 * Trust-gating and spending limits for autonomous AI agent operation
 */
import { ethers } from 'ethers';
export declare const SCORE_FOR_CREDIT = 600;
export declare const TIER_SCORES: {
    STANDARD: number;
    BUILDING: number;
    GOOD: number;
    EXCELLENT: number;
    ELITE: number;
};
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
/**
 * Load autonomous configuration
 */
export declare function loadConfig(): AutonomousConfig;
/**
 * Save autonomous configuration
 */
export declare function saveConfig(config: AutonomousConfig): void;
/**
 * Load spending history
 */
export declare function loadSpendingHistory(): SpendingHistory;
/**
 * Append to audit log
 */
export declare function auditLog(message: string, data?: any): void;
/**
 * Check trust gate before payment
 */
export declare function checkTrustGate(recipient: string, provider: ethers.Provider, config?: TrustGateConfig): Promise<TrustGateResult>;
/**
 * Check spending limits before payment
 */
export declare function checkSpendingLimit(recipient: string, amount: bigint, config?: SpendingConfig): Promise<SpendingLimitResult>;
/**
 * Record spending after successful transaction
 */
export declare function recordSpending(recipient: string, amount: bigint, txHash?: string): void;
/**
 * Get spending summary for an address
 */
export declare function getSpendingSummary(recipient?: string): {
    daily: bigint;
    weekly: bigint;
    monthly: bigint;
    total: bigint;
    count: number;
};
/**
 * Get spending history by recipient
 */
export declare function getSpendingHistory(limit?: number): SpendingRecord[];
/**
 * Clear spending history (use with caution)
 */
export declare function clearSpendingHistory(): void;
/**
 * Wrapped send function with trust-gating and spending limits
 */
export declare function sendWithTrustGate(recipient: string, amount: bigint, provider: ethers.Provider, config?: AutonomousConfig): Promise<{
    allowed: boolean;
    reason?: string;
    checks: any;
}>;
/**
 * Reset config to defaults
 */
export declare function resetConfig(): void;
/**
 * Get audit log tail
 */
export declare function getAuditLog(lines?: number): string[];
//# sourceMappingURL=autonomous.d.ts.map