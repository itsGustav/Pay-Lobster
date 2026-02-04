/**
 * Payment Notifications & Webhooks
 * 
 * Real-time notifications for USDC transactions and events.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface NotificationConfig {
  id: string;
  name: string;
  enabled: boolean;
  
  // Trigger conditions
  triggers: {
    type: 'incoming' | 'outgoing' | 'recurring' | 'invoice' | 'threshold';
    minAmount?: string;  // Only trigger above this amount
    addresses?: string[];  // Only for specific addresses
    chains?: string[];  // Only for specific chains
  }[];
  
  // Delivery channels
  channels: {
    type: 'webhook' | 'telegram' | 'email' | 'clawdbot';
    config: Record<string, string>;
  }[];
  
  // Rate limiting
  cooldownMs?: number;  // Minimum time between notifications
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

const DATA_DIR = process.env.USDC_DATA_DIR || './data';

/**
 * Notification Manager
 */
export class NotificationManager {
  private configPath: string;
  private historyPath: string;

  constructor(dataDir = DATA_DIR) {
    this.configPath = path.join(dataDir, 'notification-configs.json');
    this.historyPath = path.join(dataDir, 'notification-history.json');
  }

  private async loadConfigs(): Promise<NotificationConfig[]> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveConfigs(configs: NotificationConfig[]): Promise<void> {
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(configs, null, 2));
  }

  private async loadHistory(): Promise<Notification[]> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveHistory(history: Notification[]): Promise<void> {
    await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
    // Keep last 1000 notifications
    const trimmed = history.slice(-1000);
    await fs.writeFile(this.historyPath, JSON.stringify(trimmed, null, 2));
  }

  // ============ Configuration Management ============

  /**
   * Create notification configuration
   */
  async createConfig(params: {
    name: string;
    triggers: NotificationConfig['triggers'];
    channels: NotificationConfig['channels'];
    cooldownMs?: number;
  }): Promise<NotificationConfig> {
    const configs = await this.loadConfigs();

    const config: NotificationConfig = {
      id: crypto.randomUUID(),
      name: params.name,
      enabled: true,
      triggers: params.triggers,
      channels: params.channels,
      cooldownMs: params.cooldownMs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    configs.push(config);
    await this.saveConfigs(configs);
    
    return config;
  }

  /**
   * Enable/disable notification config
   */
  async toggleConfig(id: string, enabled: boolean): Promise<NotificationConfig | null> {
    const configs = await this.loadConfigs();
    const config = configs.find(c => c.id === id);
    
    if (config) {
      config.enabled = enabled;
      config.updatedAt = new Date().toISOString();
      await this.saveConfigs(configs);
    }
    
    return config || null;
  }

  /**
   * List notification configs
   */
  async listConfigs(): Promise<NotificationConfig[]> {
    return this.loadConfigs();
  }

  /**
   * Delete notification config
   */
  async deleteConfig(id: string): Promise<boolean> {
    const configs = await this.loadConfigs();
    const index = configs.findIndex(c => c.id === id);
    
    if (index >= 0) {
      configs.splice(index, 1);
      await this.saveConfigs(configs);
      return true;
    }
    
    return false;
  }

  // ============ Notification Triggering ============

  /**
   * Process a transaction and trigger matching notifications
   */
  async processTransaction(tx: {
    type: 'incoming' | 'outgoing';
    amount: string;
    fromAddress: string;
    toAddress: string;
    chain: string;
    txHash: string;
  }): Promise<Notification[]> {
    const configs = await this.loadConfigs();
    const triggeredNotifications: Notification[] = [];
    const now = new Date();

    for (const config of configs) {
      if (!config.enabled) continue;

      // Check cooldown
      if (config.cooldownMs && config.lastTriggeredAt) {
        const timeSince = now.getTime() - new Date(config.lastTriggeredAt).getTime();
        if (timeSince < config.cooldownMs) continue;
      }

      // Check triggers
      const matchingTrigger = config.triggers.find(trigger => {
        if (trigger.type !== tx.type) return false;
        
        if (trigger.minAmount && parseFloat(tx.amount) < parseFloat(trigger.minAmount)) {
          return false;
        }
        
        if (trigger.addresses && trigger.addresses.length > 0) {
          const relevantAddr = tx.type === 'incoming' ? tx.fromAddress : tx.toAddress;
          if (!trigger.addresses.some(a => a.toLowerCase() === relevantAddr.toLowerCase())) {
            return false;
          }
        }
        
        if (trigger.chains && trigger.chains.length > 0) {
          if (!trigger.chains.includes(tx.chain)) return false;
        }
        
        return true;
      });

      if (!matchingTrigger) continue;

      // Create notification
      const notification = await this.createNotification({
        configId: config.id,
        type: tx.type === 'incoming' ? 'payment_received' : 'payment_sent',
        title: tx.type === 'incoming' 
          ? `Received ${tx.amount} USDC`
          : `Sent ${tx.amount} USDC`,
        message: tx.type === 'incoming'
          ? `You received ${tx.amount} USDC from ${this.shortAddress(tx.fromAddress)} on ${tx.chain}`
          : `You sent ${tx.amount} USDC to ${this.shortAddress(tx.toAddress)} on ${tx.chain}`,
        data: tx,
        channels: config.channels,
      });

      triggeredNotifications.push(notification);

      // Update last triggered
      config.lastTriggeredAt = now.toISOString();
    }

    await this.saveConfigs(configs);
    return triggeredNotifications;
  }

  /**
   * Create and deliver a notification
   */
  async createNotification(params: {
    configId?: string;
    type: Notification['type'];
    title: string;
    message: string;
    data: Record<string, any>;
    channels: NotificationConfig['channels'];
  }): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      configId: params.configId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      deliveries: params.channels.map(ch => ({
        channel: ch.type,
        status: 'pending' as const,
      })),
      createdAt: new Date().toISOString(),
    };

    // Attempt delivery to each channel
    for (let i = 0; i < params.channels.length; i++) {
      const channel = params.channels[i];
      try {
        await this.deliver(channel, notification);
        notification.deliveries[i].status = 'sent';
        notification.deliveries[i].sentAt = new Date().toISOString();
      } catch (err: any) {
        notification.deliveries[i].status = 'failed';
        notification.deliveries[i].error = err.message;
      }
    }

    // Save to history
    const history = await this.loadHistory();
    history.push(notification);
    await this.saveHistory(history);

    return notification;
  }

  /**
   * Deliver notification to a channel
   */
  private async deliver(
    channel: NotificationConfig['channels'][0],
    notification: Notification
  ): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await this.deliverWebhook(channel.config, notification);
        break;
      case 'telegram':
        await this.deliverTelegram(channel.config, notification);
        break;
      case 'clawdbot':
        await this.deliverClawdbot(channel.config, notification);
        break;
      case 'email':
        // Email delivery would require SMTP config
        console.log('Email delivery not implemented');
        break;
      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }

  /**
   * Deliver via webhook
   */
  private async deliverWebhook(
    config: Record<string, string>,
    notification: Notification
  ): Promise<void> {
    if (!config.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.createdAt,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add optional secret for verification
    if (config.secret) {
      const signature = crypto
        .createHmac('sha256', config.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Signature'] = signature;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  /**
   * Deliver via Telegram (would integrate with Clawdbot's messaging)
   */
  private async deliverTelegram(
    config: Record<string, string>,
    notification: Notification
  ): Promise<void> {
    // This would use Clawdbot's message tool
    console.log(`[Telegram] ${notification.title}: ${notification.message}`);
    // In practice, this would call the message API
  }

  /**
   * Deliver via Clawdbot session message
   */
  private async deliverClawdbot(
    config: Record<string, string>,
    notification: Notification
  ): Promise<void> {
    // This would use sessions_send
    console.log(`[Clawdbot] ${notification.title}: ${notification.message}`);
    // In practice, this would call sessions_send
  }

  // ============ History & Management ============

  /**
   * Get notification history
   */
  async getHistory(options?: {
    type?: Notification['type'];
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    let history = await this.loadHistory();
    
    if (options?.type) {
      history = history.filter(n => n.type === options.type);
    }
    
    if (options?.unreadOnly) {
      history = history.filter(n => !n.readAt);
    }
    
    history.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    if (options?.limit) {
      history = history.slice(0, options.limit);
    }
    
    return history;
  }

  /**
   * Mark notification as read
   */
  async markRead(id: string): Promise<void> {
    const history = await this.loadHistory();
    const notification = history.find(n => n.id === id);
    
    if (notification) {
      notification.readAt = new Date().toISOString();
      await this.saveHistory(history);
    }
  }

  /**
   * Mark all as read
   */
  async markAllRead(): Promise<void> {
    const history = await this.loadHistory();
    const now = new Date().toISOString();
    
    for (const notification of history) {
      if (!notification.readAt) {
        notification.readAt = now;
      }
    }
    
    await this.saveHistory(history);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const history = await this.loadHistory();
    return history.filter(n => !n.readAt).length;
  }

  // ============ Helpers ============

  /**
   * Shorten address for display
   */
  private shortAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Create default notification configs for a new user
   */
  async createDefaultConfigs(): Promise<NotificationConfig[]> {
    const configs: NotificationConfig[] = [];

    // Incoming payments
    configs.push(await this.createConfig({
      name: 'All Incoming Payments',
      triggers: [{ type: 'incoming' }],
      channels: [{ type: 'clawdbot', config: {} }],
    }));

    // Large outgoing (security alert)
    configs.push(await this.createConfig({
      name: 'Large Outgoing (>1000 USDC)',
      triggers: [{ type: 'outgoing', minAmount: '1000' }],
      channels: [{ type: 'clawdbot', config: {} }],
      cooldownMs: 60000, // 1 min cooldown
    }));

    return configs;
  }
}

export default NotificationManager;
