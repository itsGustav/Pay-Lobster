/**
 * Pay Lobster - Payment Infrastructure for AI Agents
 * The Stripe for autonomous agents on Base
 *
 * @packageDocumentation
 */
export { LobsterAgent } from './agent';
export { createLobsterAgent, quickStart } from './easy';
export * from './types';
export { resolveUsername, registerUsername, getUsername, listUsernames } from './usernames';
export { getSwapQuote, executeSwap, getPrice, getSupportedTokens } from './swap';
export type { SwapQuote, SwapOptions, SwapResult } from './swap';
export { stats, loadStats, recordTransfer, recordEscrow, getStatsSummary, getLeaderboard } from './stats';
export type { PayLobsterStats, WalletStats } from './stats';
export { LobsterAgent as default } from './agent';
//# sourceMappingURL=index.d.ts.map