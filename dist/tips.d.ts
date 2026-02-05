/**
 * Tip Jar / Creator Economy Module
 *
 * Enable Clawdbot operators and agents to receive USDC tips
 * via simple commands. Built for the creator economy.
 */
export interface TipJar {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    ownerName: string;
    addresses: {
        chain: string;
        address: string;
        isDefault: boolean;
    }[];
    settings: {
        minTip: string;
        suggestedAmounts: string[];
        thankYouMessage?: string;
        allowAnonymous: boolean;
        notifyOnTip: boolean;
    };
    stats: {
        totalReceived: string;
        tipCount: number;
        uniqueTippers: number;
        largestTip: string;
        lastTipAt?: string;
    };
    publicSlug?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Tip {
    id: string;
    tipJarId: string;
    fromAddress: string;
    fromName?: string;
    isAnonymous: boolean;
    amount: string;
    chain: string;
    txHash: string;
    message?: string;
    status: 'pending' | 'confirmed' | 'failed';
    confirmedAt?: string;
    createdAt: string;
}
export interface Leaderboard {
    tipJarId: string;
    period: 'all-time' | 'monthly' | 'weekly';
    entries: {
        rank: number;
        name: string;
        address: string;
        totalTipped: string;
        tipCount: number;
    }[];
    generatedAt: string;
}
/**
 * Tip Jar Manager
 */
export declare class TipJarManager {
    private jarsPath;
    private tipsPath;
    constructor(dataDir?: string);
    private loadJars;
    private saveJars;
    private loadTips;
    private saveTips;
    /**
     * Create a new tip jar
     */
    createJar(params: {
        ownerId: string;
        ownerName: string;
        name?: string;
        description?: string;
        addresses: {
            chain: string;
            address: string;
        }[];
        publicSlug?: string;
        settings?: Partial<TipJar['settings']>;
    }): Promise<TipJar>;
    /**
     * Get tip jar by ID, slug, or owner
     */
    getJar(identifier: string): Promise<TipJar | null>;
    /**
     * Update tip jar settings
     */
    updateJar(id: string, updates: Partial<Pick<TipJar, 'name' | 'description' | 'settings' | 'publicSlug'>>): Promise<TipJar | null>;
    /**
     * Add address to tip jar
     */
    addAddress(jarId: string, chain: string, address: string): Promise<TipJar | null>;
    /**
     * Set default address
     */
    setDefaultAddress(jarId: string, chain: string): Promise<TipJar | null>;
    /**
     * Record a tip
     */
    recordTip(params: {
        tipJarId: string;
        fromAddress: string;
        fromName?: string;
        isAnonymous?: boolean;
        amount: string;
        chain: string;
        txHash: string;
        message?: string;
    }): Promise<Tip>;
    /**
     * Get tips for a jar
     */
    getTips(jarId: string, options?: {
        limit?: number;
        includeAnonymous?: boolean;
    }): Promise<Tip[]>;
    /**
     * Get recent tips across all jars (for activity feed)
     */
    getRecentTips(limit?: number): Promise<(Tip & {
        jarName: string;
    })[]>;
    /**
     * Generate leaderboard for a tip jar
     */
    getLeaderboard(jarId: string, period?: Leaderboard['period']): Promise<Leaderboard>;
    /**
     * Parse tip command and return tip info
     * Supports: "tip @gustav 10", "tip 5 to gustav", etc.
     */
    parseTipCommand(command: string): {
        recipient: string;
        amount: string;
        message?: string;
    } | null;
    /**
     * Generate tip jar card/embed for display
     */
    formatTipJarCard(jar: TipJar): string;
    /**
     * Format tip notification
     */
    formatTipNotification(tip: Tip, jar: TipJar): string;
    private shortAddress;
    /**
     * Send tip from one agent to another
     * Returns the transaction to be executed
     */
    prepareAgentTip(params: {
        fromAgentId: string;
        fromWalletId: string;
        toAgentId: string;
        amount: string;
        message?: string;
    }): Promise<{
        toJar: TipJar;
        toAddress: string;
        chain: string;
        amount: string;
        message?: string;
    } | null>;
}
export default TipJarManager;
//# sourceMappingURL=tips.d.ts.map