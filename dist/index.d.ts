/**
 * Pay Lobster - Payment Infrastructure for AI Agents
 * The Stripe for autonomous agents on Base
 *
 * @packageDocumentation
 */
export { LobsterAgent } from './agent';
export { MultiChainLobsterAgent } from './agent-multichain';
export { createLobsterAgent, quickStart } from './easy';
export * from './types';
export { resolveUsername, registerUsername, getUsername, listUsernames } from './usernames';
export { getSwapQuote, executeSwap, getPrice, getSupportedTokens } from './swap';
export type { SwapQuote, SwapOptions, SwapResult } from './swap';
export { stats, loadStats, recordTransfer, recordEscrow, getStatsSummary, getLeaderboard } from './stats';
export type { PayLobsterStats, WalletStats } from './stats';
export { subscriptions } from './subscriptions';
export type { Subscription } from './subscriptions';
export { invoices } from './invoices';
export type { Invoice, InvoiceItem } from './invoices';
export { splits } from './splits';
export type { SplitRecipient, SplitResult } from './splits';
export { gamification } from './gamification';
export type { Badge, PlayerStats } from './gamification';
export { onramp, createOnrampUrl, getOnrampSession, generateOnrampUrl } from './onramp';
export type { OnrampResult, OnrampConfig, OnrampSession, OnrampUrlParams, OnrampSessionParams } from './onramp';
export * from './chains';
export { X402Client, createX402Fetch } from './x402';
export type { X402PaymentChallenge, X402PaymentProof } from './x402';
export { PayLobsterIdentity, PayLobsterReputation, PayLobsterCredit, PayLobsterEscrow, createV3Contracts, V3_ADDRESSES, } from './contracts-v3';
export type { AgentMetadata, AgentInfo, TrustVector, FeedbackEntry, CreditProfile, LoanInfo, EscrowInfo, } from './contracts-v3';
export { loadConfig as loadAutonomousConfig, saveConfig as saveAutonomousConfig, checkTrustGate, checkSpendingLimit, recordSpending, sendWithTrustGate, getSpendingSummary, getSpendingHistory, clearSpendingHistory, getAuditLog, resetConfig as resetAutonomousConfig, SCORE_FOR_CREDIT, TIER_SCORES, } from './autonomous';
export type { TrustGateConfig, SpendingLimit, SpendingConfig, AutonomousConfig as FullAutonomousConfig, TrustGateResult, SpendingLimitResult, SpendingRecord, SpendingHistory, } from './autonomous';
export { LobsterAgent as default } from './agent';
//# sourceMappingURL=index.d.ts.map