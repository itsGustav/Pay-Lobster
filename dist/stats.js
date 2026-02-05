"use strict";
/**
 * Pay Lobster Stats Module
 * Tracks total volume, transaction counts, and analytics
 * 🦞
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
exports.stats = void 0;
exports.loadStats = loadStats;
exports.saveStats = saveStats;
exports.recordTransfer = recordTransfer;
exports.recordEscrow = recordEscrow;
exports.queryOnChainStats = queryOnChainStats;
exports.getStatsSummary = getStatsSummary;
exports.getLeaderboard = getLeaderboard;
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const contracts_1 = require("./contracts");
const BASE_RPC = 'https://mainnet.base.org';
const STATS_FILE = path.join(process.env.HOME || '/tmp', '.paylobster', 'stats.json');
const DEFAULT_STATS = {
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
function loadStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf-8');
            return { ...DEFAULT_STATS, ...JSON.parse(data) };
        }
    }
    catch (e) {
        console.error('Failed to load stats:', e);
    }
    return { ...DEFAULT_STATS };
}
/**
 * Save stats to disk
 */
function saveStats(stats) {
    try {
        const dir = path.dirname(STATS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        stats.lastUpdated = new Date().toISOString();
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    }
    catch (e) {
        console.error('Failed to save stats:', e);
    }
}
/**
 * Record a transfer in stats
 */
function recordTransfer(from, to, amount, txHash) {
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
function recordEscrow(amount) {
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
async function queryOnChainStats(walletAddress) {
    const provider = new ethers_1.ethers.JsonRpcProvider(BASE_RPC);
    const usdc = new ethers_1.ethers.Contract(contracts_1.CONTRACTS.usdc, contracts_1.ERC20_ABI, provider);
    // Get current balances
    const [usdcBalanceRaw, ethBalanceRaw] = await Promise.all([
        usdc.balanceOf(walletAddress),
        provider.getBalance(walletAddress)
    ]);
    const usdcBalance = ethers_1.ethers.formatUnits(usdcBalanceRaw, 6);
    const ethBalance = ethers_1.ethers.formatEther(ethBalanceRaw);
    // For now, return balances (full history would require event scanning)
    return {
        usdcBalance,
        ethBalance,
        incomingVolume: '0', // Would need event logs
        outgoingVolume: '0', // Would need event logs
        transactionCount: 0 // Would need event logs
    };
}
/**
 * Get formatted stats summary
 */
function getStatsSummary() {
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
function getLeaderboard(limit = 10) {
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
function formatNumber(num) {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000)
        return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)
        return (n / 1000).toFixed(2) + 'K';
    return n.toFixed(2);
}
exports.stats = {
    load: loadStats,
    save: saveStats,
    recordTransfer,
    recordEscrow,
    queryOnChain: queryOnChainStats,
    getSummary: getStatsSummary,
    getLeaderboard
};
//# sourceMappingURL=stats.js.map