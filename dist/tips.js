"use strict";
/**
 * Tip Jar / Creator Economy Module
 *
 * Enable Clawdbot operators and agents to receive USDC tips
 * via simple commands. Built for the creator economy.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipJarManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.USDC_DATA_DIR || './data';
/**
 * Tip Jar Manager
 */
class TipJarManager {
    constructor(dataDir = DATA_DIR) {
        this.jarsPath = path_1.default.join(dataDir, 'tip-jars.json');
        this.tipsPath = path_1.default.join(dataDir, 'tips.json');
    }
    async loadJars() {
        try {
            const data = await promises_1.default.readFile(this.jarsPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveJars(jars) {
        await promises_1.default.mkdir(path_1.default.dirname(this.jarsPath), { recursive: true });
        await promises_1.default.writeFile(this.jarsPath, JSON.stringify(jars, null, 2));
    }
    async loadTips() {
        try {
            const data = await promises_1.default.readFile(this.tipsPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveTips(tips) {
        await promises_1.default.mkdir(path_1.default.dirname(this.tipsPath), { recursive: true });
        await promises_1.default.writeFile(this.tipsPath, JSON.stringify(tips, null, 2));
    }
    // ============ Tip Jar Management ============
    /**
     * Create a new tip jar
     */
    async createJar(params) {
        const jars = await this.loadJars();
        // Check for duplicate slug
        if (params.publicSlug) {
            const existing = jars.find(j => j.publicSlug === params.publicSlug);
            if (existing) {
                throw new Error(`Slug "${params.publicSlug}" is already taken`);
            }
        }
        const jar = {
            id: crypto_1.default.randomUUID(),
            name: params.name || `${params.ownerName}'s Tip Jar`,
            description: params.description,
            ownerId: params.ownerId,
            ownerName: params.ownerName,
            addresses: params.addresses.map((a, i) => ({
                ...a,
                isDefault: i === 0,
            })),
            settings: {
                minTip: params.settings?.minTip || '1',
                suggestedAmounts: params.settings?.suggestedAmounts || ['5', '10', '25', '50'],
                thankYouMessage: params.settings?.thankYouMessage || 'Thanks for the tip! 🙏',
                allowAnonymous: params.settings?.allowAnonymous ?? true,
                notifyOnTip: params.settings?.notifyOnTip ?? true,
            },
            stats: {
                totalReceived: '0',
                tipCount: 0,
                uniqueTippers: 0,
                largestTip: '0',
            },
            publicSlug: params.publicSlug,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        jars.push(jar);
        await this.saveJars(jars);
        return jar;
    }
    /**
     * Get tip jar by ID, slug, or owner
     */
    async getJar(identifier) {
        const jars = await this.loadJars();
        return jars.find(j => j.id === identifier ||
            j.publicSlug === identifier ||
            j.ownerId === identifier) || null;
    }
    /**
     * Update tip jar settings
     */
    async updateJar(id, updates) {
        const jars = await this.loadJars();
        const jar = jars.find(j => j.id === id);
        if (jar) {
            if (updates.name)
                jar.name = updates.name;
            if (updates.description !== undefined)
                jar.description = updates.description;
            if (updates.publicSlug !== undefined) {
                // Check for duplicate
                if (updates.publicSlug && jars.some(j => j.id !== id && j.publicSlug === updates.publicSlug)) {
                    throw new Error(`Slug "${updates.publicSlug}" is already taken`);
                }
                jar.publicSlug = updates.publicSlug;
            }
            if (updates.settings) {
                jar.settings = { ...jar.settings, ...updates.settings };
            }
            jar.updatedAt = new Date().toISOString();
            await this.saveJars(jars);
        }
        return jar || null;
    }
    /**
     * Add address to tip jar
     */
    async addAddress(jarId, chain, address) {
        const jars = await this.loadJars();
        const jar = jars.find(j => j.id === jarId);
        if (jar) {
            if (jar.addresses.some(a => a.chain === chain)) {
                throw new Error(`Address for ${chain} already exists`);
            }
            jar.addresses.push({ chain, address, isDefault: false });
            jar.updatedAt = new Date().toISOString();
            await this.saveJars(jars);
        }
        return jar || null;
    }
    /**
     * Set default address
     */
    async setDefaultAddress(jarId, chain) {
        const jars = await this.loadJars();
        const jar = jars.find(j => j.id === jarId);
        if (jar) {
            jar.addresses.forEach(a => {
                a.isDefault = a.chain === chain;
            });
            jar.updatedAt = new Date().toISOString();
            await this.saveJars(jars);
        }
        return jar || null;
    }
    // ============ Tip Processing ============
    /**
     * Record a tip
     */
    async recordTip(params) {
        const jars = await this.loadJars();
        const jar = jars.find(j => j.id === params.tipJarId);
        if (!jar) {
            throw new Error('Tip jar not found');
        }
        const tips = await this.loadTips();
        const tip = {
            id: crypto_1.default.randomUUID(),
            tipJarId: params.tipJarId,
            fromAddress: params.fromAddress,
            fromName: params.fromName,
            isAnonymous: params.isAnonymous ?? false,
            amount: params.amount,
            chain: params.chain,
            txHash: params.txHash,
            message: params.message,
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        tips.push(tip);
        await this.saveTips(tips);
        // Update jar stats
        const amount = parseFloat(params.amount);
        jar.stats.totalReceived = (parseFloat(jar.stats.totalReceived) + amount).toString();
        jar.stats.tipCount++;
        // Check if new unique tipper
        const previousTips = tips.filter(t => t.tipJarId === jar.id &&
            t.fromAddress.toLowerCase() === params.fromAddress.toLowerCase() &&
            t.id !== tip.id);
        if (previousTips.length === 0) {
            jar.stats.uniqueTippers++;
        }
        // Update largest tip
        if (amount > parseFloat(jar.stats.largestTip)) {
            jar.stats.largestTip = params.amount;
        }
        jar.stats.lastTipAt = new Date().toISOString();
        jar.updatedAt = new Date().toISOString();
        await this.saveJars(jars);
        return tip;
    }
    /**
     * Get tips for a jar
     */
    async getTips(jarId, options) {
        let tips = await this.loadTips();
        tips = tips.filter(t => t.tipJarId === jarId);
        if (options?.includeAnonymous === false) {
            tips = tips.filter(t => !t.isAnonymous);
        }
        tips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (options?.limit) {
            tips = tips.slice(0, options.limit);
        }
        return tips;
    }
    /**
     * Get recent tips across all jars (for activity feed)
     */
    async getRecentTips(limit = 10) {
        const tips = await this.loadTips();
        const jars = await this.loadJars();
        const jarMap = new Map(jars.map(j => [j.id, j]));
        return tips
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
            .map(tip => ({
            ...tip,
            jarName: jarMap.get(tip.tipJarId)?.name || 'Unknown',
        }));
    }
    // ============ Leaderboards ============
    /**
     * Generate leaderboard for a tip jar
     */
    async getLeaderboard(jarId, period = 'all-time') {
        let tips = await this.loadTips();
        tips = tips.filter(t => t.tipJarId === jarId && !t.isAnonymous);
        // Filter by period
        const now = new Date();
        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            tips = tips.filter(t => new Date(t.createdAt) >= weekAgo);
        }
        else if (period === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            tips = tips.filter(t => new Date(t.createdAt) >= monthAgo);
        }
        // Aggregate by tipper
        const tipperMap = new Map();
        for (const tip of tips) {
            const key = tip.fromAddress.toLowerCase();
            const existing = tipperMap.get(key) || {
                name: tip.fromName || this.shortAddress(tip.fromAddress),
                total: 0,
                count: 0
            };
            existing.total += parseFloat(tip.amount);
            existing.count++;
            if (tip.fromName)
                existing.name = tip.fromName;
            tipperMap.set(key, existing);
        }
        // Sort and rank
        const entries = Array.from(tipperMap.entries())
            .map(([address, data]) => ({
            address,
            name: data.name,
            totalTipped: data.total.toFixed(2),
            tipCount: data.count,
        }))
            .sort((a, b) => parseFloat(b.totalTipped) - parseFloat(a.totalTipped))
            .map((entry, i) => ({ rank: i + 1, ...entry }));
        return {
            tipJarId: jarId,
            period,
            entries,
            generatedAt: new Date().toISOString(),
        };
    }
    // ============ Tip Commands (for Clawdbot) ============
    /**
     * Parse tip command and return tip info
     * Supports: "tip @gustav 10", "tip 5 to gustav", etc.
     */
    parseTipCommand(command) {
        // Patterns:
        // "tip @gustav 10"
        // "tip 10 to @gustav"
        // "tip gustav 10 usdc thanks!"
        const patterns = [
            // tip @recipient amount [message]
            /^tip\s+@?(\w+)\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s*(.*)$/i,
            // tip amount to @recipient [message]
            /^tip\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s+to\s+@?(\w+)\s*(.*)$/i,
        ];
        for (const pattern of patterns) {
            const match = command.match(pattern);
            if (match) {
                if (pattern === patterns[0]) {
                    return {
                        recipient: match[1],
                        amount: match[2],
                        message: match[3]?.trim() || undefined,
                    };
                }
                else {
                    return {
                        recipient: match[2],
                        amount: match[1],
                        message: match[3]?.trim() || undefined,
                    };
                }
            }
        }
        return null;
    }
    /**
     * Generate tip jar card/embed for display
     */
    formatTipJarCard(jar) {
        const defaultAddr = jar.addresses.find(a => a.isDefault) || jar.addresses[0];
        let card = `💰 **${jar.name}**\n`;
        if (jar.description) {
            card += `${jar.description}\n`;
        }
        card += `\n`;
        card += `Owner: ${jar.ownerName}\n`;
        card += `Total Received: **$${parseFloat(jar.stats.totalReceived).toFixed(2)} USDC**\n`;
        card += `Tips: ${jar.stats.tipCount} from ${jar.stats.uniqueTippers} tippers\n`;
        card += `\n`;
        card += `**Quick Tip:**\n`;
        card += jar.settings.suggestedAmounts.map(a => `[$${a}]`).join(' ') + '\n';
        card += `\n`;
        card += `Send to: \`${defaultAddr.address}\`\n`;
        card += `Chain: ${defaultAddr.chain}\n`;
        if (jar.publicSlug) {
            card += `\nLink: tip.clawd.bot/${jar.publicSlug}`;
        }
        return card;
    }
    /**
     * Format tip notification
     */
    formatTipNotification(tip, jar) {
        const senderName = tip.isAnonymous ? 'Anonymous' : (tip.fromName || this.shortAddress(tip.fromAddress));
        let notif = `🎉 **New Tip!**\n\n`;
        notif += `${senderName} tipped **$${tip.amount} USDC**`;
        if (tip.message) {
            notif += `\n\n"${tip.message}"`;
        }
        notif += `\n\n${jar.settings.thankYouMessage}`;
        return notif;
    }
    shortAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    // ============ Agent-to-Agent Tips ============
    /**
     * Send tip from one agent to another
     * Returns the transaction to be executed
     */
    async prepareAgentTip(params) {
        // Find recipient's tip jar
        const toJar = await this.getJar(params.toAgentId);
        if (!toJar) {
            return null;
        }
        const defaultAddr = toJar.addresses.find(a => a.isDefault) || toJar.addresses[0];
        if (!defaultAddr) {
            return null;
        }
        return {
            toJar,
            toAddress: defaultAddr.address,
            chain: defaultAddr.chain,
            amount: params.amount,
            message: params.message,
        };
    }
}
exports.TipJarManager = TipJarManager;
exports.default = TipJarManager;
//# sourceMappingURL=tips.js.map