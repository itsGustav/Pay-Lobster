/**
 * Payment Notifications & Webhooks
 *
 * Real-time notifications for USDC transactions and events.
 */
export interface NotificationConfig {
    id: string;
    name: string;
    enabled: boolean;
    triggers: {
        type: 'incoming' | 'outgoing' | 'recurring' | 'invoice' | 'threshold';
        minAmount?: string;
        addresses?: string[];
        chains?: string[];
    }[];
    channels: {
        type: 'webhook' | 'telegram' | 'email' | 'clawdbot';
        config: Record<string, string>;
    }[];
    cooldownMs?: number;
    lastTriggeredAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Notification {
    id: string;
    configId?: string;
    type: 'payment_received' | 'payment_sent' | 'recurring_due' | 'invoice_paid' | 'threshold_alert' | 'bridge_complete';
    title: string;
    message: string;
    data: Record<string, any>;
    deliveries: {
        channel: string;
        status: 'pending' | 'sent' | 'failed';
        sentAt?: string;
        error?: string;
    }[];
    createdAt: string;
    readAt?: string;
}
/**
 * Notification Manager
 */
export declare class NotificationManager {
    private configPath;
    private historyPath;
    constructor(dataDir?: string);
    private loadConfigs;
    private saveConfigs;
    private loadHistory;
    private saveHistory;
    /**
     * Create notification configuration
     */
    createConfig(params: {
        name: string;
        triggers: NotificationConfig['triggers'];
        channels: NotificationConfig['channels'];
        cooldownMs?: number;
    }): Promise<NotificationConfig>;
    /**
     * Enable/disable notification config
     */
    toggleConfig(id: string, enabled: boolean): Promise<NotificationConfig | null>;
    /**
     * List notification configs
     */
    listConfigs(): Promise<NotificationConfig[]>;
    /**
     * Delete notification config
     */
    deleteConfig(id: string): Promise<boolean>;
    /**
     * Process a transaction and trigger matching notifications
     */
    processTransaction(tx: {
        type: 'incoming' | 'outgoing';
        amount: string;
        fromAddress: string;
        toAddress: string;
        chain: string;
        txHash: string;
    }): Promise<Notification[]>;
    /**
     * Create and deliver a notification
     */
    createNotification(params: {
        configId?: string;
        type: Notification['type'];
        title: string;
        message: string;
        data: Record<string, any>;
        channels: NotificationConfig['channels'];
    }): Promise<Notification>;
    /**
     * Deliver notification to a channel
     */
    private deliver;
    /**
     * Deliver via webhook
     */
    private deliverWebhook;
    /**
     * Deliver via Telegram (would integrate with Clawdbot's messaging)
     */
    private deliverTelegram;
    /**
     * Deliver via Clawdbot session message
     */
    private deliverClawdbot;
    /**
     * Get notification history
     */
    getHistory(options?: {
        type?: Notification['type'];
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<Notification[]>;
    /**
     * Mark notification as read
     */
    markRead(id: string): Promise<void>;
    /**
     * Mark all as read
     */
    markAllRead(): Promise<void>;
    /**
     * Get unread count
     */
    getUnreadCount(): Promise<number>;
    /**
     * Shorten address for display
     */
    private shortAddress;
    /**
     * Create default notification configs for a new user
     */
    createDefaultConfigs(): Promise<NotificationConfig[]>;
}
export default NotificationManager;
//# sourceMappingURL=notifications.d.ts.map