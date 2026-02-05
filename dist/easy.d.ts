/**
 * Easy Mode API - Simplified interface for Pay Lobster
 */
import { LobsterAgent } from './agent';
import type { LobsterConfig } from './types';
/**
 * Create a new Lobster agent with minimal configuration
 */
export declare function createLobsterAgent(config?: LobsterConfig): LobsterAgent;
/**
 * Quick start - create and initialize an agent in one call
 */
export declare function quickStart(config?: LobsterConfig): Promise<LobsterAgent>;
/**
 * One-liner to send USDC
 */
export declare function sendUSDC(to: string, amount: number, config?: LobsterConfig): Promise<string>;
/**
 * One-liner to check balance
 */
export declare function checkBalance(address: string, config?: LobsterConfig): Promise<string>;
//# sourceMappingURL=easy.d.ts.map