"use strict";
/**
 * Easy Mode API - Simplified interface for Pay Lobster
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLobsterAgent = createLobsterAgent;
exports.quickStart = quickStart;
exports.sendUSDC = sendUSDC;
exports.checkBalance = checkBalance;
const agent_1 = require("./agent");
/**
 * Create a new Lobster agent with minimal configuration
 */
function createLobsterAgent(config = {}) {
    return new agent_1.LobsterAgent(config);
}
/**
 * Quick start - create and initialize an agent in one call
 */
async function quickStart(config = {}) {
    const agent = createLobsterAgent(config);
    await agent.initialize();
    return agent;
}
/**
 * One-liner to send USDC
 */
async function sendUSDC(to, amount, config = {}) {
    const agent = await quickStart(config);
    const tx = await agent.send(to, amount);
    return tx.id;
}
/**
 * One-liner to check balance
 */
async function checkBalance(address, config = {}) {
    const agent = createLobsterAgent({ ...config, walletId: address });
    return agent.getBalance();
}
//# sourceMappingURL=easy.js.map