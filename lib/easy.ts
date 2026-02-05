/**
 * Easy Mode API - Simplified interface for Pay Lobster
 */

import { LobsterAgent } from './agent';
import type { LobsterConfig } from './types';

/**
 * Create a new Lobster agent with minimal configuration
 */
export function createLobsterAgent(config: LobsterConfig = {}): LobsterAgent {
  return new LobsterAgent(config);
}

/**
 * Quick start - create and initialize an agent in one call
 */
export async function quickStart(config: LobsterConfig = {}): Promise<LobsterAgent> {
  const agent = createLobsterAgent(config);
  await agent.initialize();
  return agent;
}

/**
 * One-liner to send USDC
 */
export async function sendUSDC(
  to: string,
  amount: number,
  config: LobsterConfig = {}
): Promise<string> {
  const agent = await quickStart(config);
  const tx = await agent.send(to, amount);
  return tx.id;
}

/**
 * One-liner to check balance
 */
export async function checkBalance(
  address: string,
  config: LobsterConfig = {}
): Promise<string> {
  const agent = createLobsterAgent({ ...config, walletId: address });
  return agent.getBalance();
}
