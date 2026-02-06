"use strict";
/**
 * Pay Lobster - Payment Infrastructure for AI Agents
 * The Stripe for autonomous agents on Base
 *
 * @packageDocumentation
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.TIER_SCORES = exports.SCORE_FOR_CREDIT = exports.resetAutonomousConfig = exports.getAuditLog = exports.clearSpendingHistory = exports.getSpendingHistory = exports.getSpendingSummary = exports.sendWithTrustGate = exports.recordSpending = exports.checkSpendingLimit = exports.checkTrustGate = exports.saveAutonomousConfig = exports.loadAutonomousConfig = exports.V3_ADDRESSES = exports.createV3Contracts = exports.PayLobsterEscrow = exports.PayLobsterCredit = exports.PayLobsterReputation = exports.PayLobsterIdentity = exports.createX402Fetch = exports.X402Client = exports.generateOnrampUrl = exports.getOnrampSession = exports.createOnrampUrl = exports.onramp = exports.gamification = exports.splits = exports.invoices = exports.subscriptions = exports.getLeaderboard = exports.getStatsSummary = exports.recordEscrow = exports.recordTransfer = exports.loadStats = exports.stats = exports.getSupportedTokens = exports.getPrice = exports.executeSwap = exports.getSwapQuote = exports.listUsernames = exports.getUsername = exports.registerUsername = exports.resolveUsername = exports.quickStart = exports.createLobsterAgent = exports.MultiChainLobsterAgent = exports.LobsterAgent = void 0;
// V1 Exports (Backward Compatibility)
var agent_1 = require("./agent");
Object.defineProperty(exports, "LobsterAgent", { enumerable: true, get: function () { return agent_1.LobsterAgent; } });
var agent_multichain_1 = require("./agent-multichain");
Object.defineProperty(exports, "MultiChainLobsterAgent", { enumerable: true, get: function () { return agent_multichain_1.MultiChainLobsterAgent; } });
var easy_1 = require("./easy");
Object.defineProperty(exports, "createLobsterAgent", { enumerable: true, get: function () { return easy_1.createLobsterAgent; } });
Object.defineProperty(exports, "quickStart", { enumerable: true, get: function () { return easy_1.quickStart; } });
__exportStar(require("./types"), exports);
var usernames_1 = require("./usernames");
Object.defineProperty(exports, "resolveUsername", { enumerable: true, get: function () { return usernames_1.resolveUsername; } });
Object.defineProperty(exports, "registerUsername", { enumerable: true, get: function () { return usernames_1.registerUsername; } });
Object.defineProperty(exports, "getUsername", { enumerable: true, get: function () { return usernames_1.getUsername; } });
Object.defineProperty(exports, "listUsernames", { enumerable: true, get: function () { return usernames_1.listUsernames; } });
var swap_1 = require("./swap");
Object.defineProperty(exports, "getSwapQuote", { enumerable: true, get: function () { return swap_1.getSwapQuote; } });
Object.defineProperty(exports, "executeSwap", { enumerable: true, get: function () { return swap_1.executeSwap; } });
Object.defineProperty(exports, "getPrice", { enumerable: true, get: function () { return swap_1.getPrice; } });
Object.defineProperty(exports, "getSupportedTokens", { enumerable: true, get: function () { return swap_1.getSupportedTokens; } });
var stats_1 = require("./stats");
Object.defineProperty(exports, "stats", { enumerable: true, get: function () { return stats_1.stats; } });
Object.defineProperty(exports, "loadStats", { enumerable: true, get: function () { return stats_1.loadStats; } });
Object.defineProperty(exports, "recordTransfer", { enumerable: true, get: function () { return stats_1.recordTransfer; } });
Object.defineProperty(exports, "recordEscrow", { enumerable: true, get: function () { return stats_1.recordEscrow; } });
Object.defineProperty(exports, "getStatsSummary", { enumerable: true, get: function () { return stats_1.getStatsSummary; } });
Object.defineProperty(exports, "getLeaderboard", { enumerable: true, get: function () { return stats_1.getLeaderboard; } });
var subscriptions_1 = require("./subscriptions");
Object.defineProperty(exports, "subscriptions", { enumerable: true, get: function () { return subscriptions_1.subscriptions; } });
var invoices_1 = require("./invoices");
Object.defineProperty(exports, "invoices", { enumerable: true, get: function () { return invoices_1.invoices; } });
var splits_1 = require("./splits");
Object.defineProperty(exports, "splits", { enumerable: true, get: function () { return splits_1.splits; } });
var gamification_1 = require("./gamification");
Object.defineProperty(exports, "gamification", { enumerable: true, get: function () { return gamification_1.gamification; } });
var onramp_1 = require("./onramp");
Object.defineProperty(exports, "onramp", { enumerable: true, get: function () { return onramp_1.onramp; } });
Object.defineProperty(exports, "createOnrampUrl", { enumerable: true, get: function () { return onramp_1.createOnrampUrl; } });
Object.defineProperty(exports, "getOnrampSession", { enumerable: true, get: function () { return onramp_1.getOnrampSession; } });
Object.defineProperty(exports, "generateOnrampUrl", { enumerable: true, get: function () { return onramp_1.generateOnrampUrl; } });
// Multi-chain exports
__exportStar(require("./chains"), exports);
var x402_1 = require("./x402");
Object.defineProperty(exports, "X402Client", { enumerable: true, get: function () { return x402_1.X402Client; } });
Object.defineProperty(exports, "createX402Fetch", { enumerable: true, get: function () { return x402_1.createX402Fetch; } });
// V3 Contract Exports
var contracts_v3_1 = require("./contracts-v3");
Object.defineProperty(exports, "PayLobsterIdentity", { enumerable: true, get: function () { return contracts_v3_1.PayLobsterIdentity; } });
Object.defineProperty(exports, "PayLobsterReputation", { enumerable: true, get: function () { return contracts_v3_1.PayLobsterReputation; } });
Object.defineProperty(exports, "PayLobsterCredit", { enumerable: true, get: function () { return contracts_v3_1.PayLobsterCredit; } });
Object.defineProperty(exports, "PayLobsterEscrow", { enumerable: true, get: function () { return contracts_v3_1.PayLobsterEscrow; } });
Object.defineProperty(exports, "createV3Contracts", { enumerable: true, get: function () { return contracts_v3_1.createV3Contracts; } });
Object.defineProperty(exports, "V3_ADDRESSES", { enumerable: true, get: function () { return contracts_v3_1.V3_ADDRESSES; } });
// V3.1.0 Autonomous Agent Features
var autonomous_1 = require("./autonomous");
Object.defineProperty(exports, "loadAutonomousConfig", { enumerable: true, get: function () { return autonomous_1.loadConfig; } });
Object.defineProperty(exports, "saveAutonomousConfig", { enumerable: true, get: function () { return autonomous_1.saveConfig; } });
Object.defineProperty(exports, "checkTrustGate", { enumerable: true, get: function () { return autonomous_1.checkTrustGate; } });
Object.defineProperty(exports, "checkSpendingLimit", { enumerable: true, get: function () { return autonomous_1.checkSpendingLimit; } });
Object.defineProperty(exports, "recordSpending", { enumerable: true, get: function () { return autonomous_1.recordSpending; } });
Object.defineProperty(exports, "sendWithTrustGate", { enumerable: true, get: function () { return autonomous_1.sendWithTrustGate; } });
Object.defineProperty(exports, "getSpendingSummary", { enumerable: true, get: function () { return autonomous_1.getSpendingSummary; } });
Object.defineProperty(exports, "getSpendingHistory", { enumerable: true, get: function () { return autonomous_1.getSpendingHistory; } });
Object.defineProperty(exports, "clearSpendingHistory", { enumerable: true, get: function () { return autonomous_1.clearSpendingHistory; } });
Object.defineProperty(exports, "getAuditLog", { enumerable: true, get: function () { return autonomous_1.getAuditLog; } });
Object.defineProperty(exports, "resetAutonomousConfig", { enumerable: true, get: function () { return autonomous_1.resetConfig; } });
Object.defineProperty(exports, "SCORE_FOR_CREDIT", { enumerable: true, get: function () { return autonomous_1.SCORE_FOR_CREDIT; } });
Object.defineProperty(exports, "TIER_SCORES", { enumerable: true, get: function () { return autonomous_1.TIER_SCORES; } });
// Default export for convenience
var agent_2 = require("./agent");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return agent_2.LobsterAgent; } });
//# sourceMappingURL=index.js.map