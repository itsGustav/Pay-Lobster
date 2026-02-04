/**
 * x402 Payment Server Middleware
 * 
 * Express middleware for HTTP 402 Payment Required.
 * Generates payment challenges and verifies payments via Coinbase facilitator.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// x402 Configuration
export interface X402ServerConfig {
  facilitatorUrl?: string;     // Coinbase x402 facilitator
  network: string;             // e.g., 'ETH-SEPOLIA'
  receiverAddress: string;     // Your wallet address
  acceptedAssets?: string[];   // Default: ['USDC']
  challengeExpiry?: number;    // Seconds (default: 300 = 5 min)
  
  // Custom verification function (optional)
  verifyPayment?: (signature: string, amount: string) => Promise<boolean>;
}

// Payment Challenge Response
export interface PaymentChallenge {
  'x-payment-required': {
    version: '1';
    network: string;
    receiver: string;
    asset: string;
    amount: string;
    description: string;
    expires: number;
    nonce: string;
  };
}

// Global config (can be set once for all middleware)
let globalConfig: X402ServerConfig | null = null;

/**
 * Configure x402 server globally
 */
export function configureX402Server(config: X402ServerConfig): void {
  globalConfig = {
    facilitatorUrl: config.facilitatorUrl || 'https://x402.coinbase.com',
    acceptedAssets: config.acceptedAssets || ['USDC'],
    challengeExpiry: config.challengeExpiry || 300,
    ...config,
  };
}

/**
 * Get effective config (merge global + local)
 */
function getConfig(localConfig?: Partial<X402ServerConfig>): X402ServerConfig {
  if (!globalConfig && !localConfig) {
    throw new Error('x402 server not configured. Call configureX402Server() first.');
  }
  
  return {
    facilitatorUrl: localConfig?.facilitatorUrl || globalConfig?.facilitatorUrl || 'https://x402.coinbase.com',
    network: localConfig?.network || globalConfig?.network || 'ETH-SEPOLIA',
    receiverAddress: localConfig?.receiverAddress || globalConfig?.receiverAddress || '',
    acceptedAssets: localConfig?.acceptedAssets || globalConfig?.acceptedAssets || ['USDC'],
    challengeExpiry: localConfig?.challengeExpiry || globalConfig?.challengeExpiry || 300,
    verifyPayment: localConfig?.verifyPayment || globalConfig?.verifyPayment,
  };
}

/**
 * Create payment challenge
 */
export function createPaymentChallenge(
  amount: string,
  description: string,
  config?: Partial<X402ServerConfig>
): PaymentChallenge {
  const effectiveConfig = getConfig(config);
  
  return {
    'x-payment-required': {
      version: '1',
      network: effectiveConfig.network,
      receiver: effectiveConfig.receiverAddress,
      asset: 'USDC',
      amount,
      description,
      expires: Math.floor(Date.now() / 1000) + (effectiveConfig.challengeExpiry || 300),
      nonce: crypto.randomUUID(),
    },
  };
}

/**
 * Paywall middleware - require payment to access endpoint
 */
export function paywall(
  price: string,
  description: string,
  config?: Partial<X402ServerConfig>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentSignature = req.headers['x-payment-signature'];
    
    if (!paymentSignature) {
      // No payment provided - return 402 with challenge
      const challenge = createPaymentChallenge(price, description, config);
      
      res.status(402).json({
        error: 'Payment Required',
        message: `This endpoint requires ${price} USDC`,
        ...challenge,
      });
      return;
    }
    
    // Verify payment
    try {
      const effectiveConfig = getConfig(config);
      const verified = await verifyPayment(
        paymentSignature as string,
        price,
        effectiveConfig
      );
      
      if (verified) {
        // Payment verified - proceed
        (req as any).paymentVerified = true;
        (req as any).paymentAmount = price;
        (req as any).paymentSignature = paymentSignature;
        next();
      } else {
        res.status(402).json({
          error: 'Payment Invalid',
          message: 'Payment signature could not be verified',
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        error: 'Payment Verification Failed',
        message: (error as Error).message,
      });
    }
  };
}

/**
 * Dynamic paywall - determine price at runtime
 */
export function dynamicPaywall(
  priceFn: (req: Request) => string | Promise<string>,
  descriptionFn: (req: Request) => string | Promise<string>,
  config?: Partial<X402ServerConfig>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Determine price and description
      const price = await Promise.resolve(priceFn(req));
      const description = await Promise.resolve(descriptionFn(req));
      
      // Use standard paywall
      const middleware = paywall(price, description, config);
      await middleware(req, res, next);
    } catch (error) {
      res.status(500).json({
        error: 'Paywall Configuration Error',
        message: (error as Error).message,
      });
    }
  };
}

/**
 * Verify payment with Coinbase x402 facilitator
 */
async function verifyPayment(
  signature: string,
  expectedAmount: string,
  config: X402ServerConfig
): Promise<boolean> {
  // Use custom verification if provided
  if (config.verifyPayment) {
    return config.verifyPayment(signature, expectedAmount);
  }
  
  // Default: verify with Coinbase facilitator
  try {
    const response = await fetch(`${config.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,
        expectedAmount,
        network: config.network,
        receiver: config.receiverAddress,
      }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('Facilitator verification error:', error);
    return false;
  }
}

/**
 * Mock verification for testing (accepts any signature)
 */
export function mockVerification(): (signature: string, amount: string) => Promise<boolean> {
  return async (signature: string, amount: string) => {
    // In testing, accept any non-empty signature
    return signature.length > 0;
  };
}

/**
 * Simple signature verification (hash-based)
 * Use only for testing - NOT secure for production
 */
export function simpleVerification(secret: string): (signature: string, amount: string) => Promise<boolean> {
  return async (signature: string, amount: string) => {
    // Verify signature matches hash of secret + amount
    const expectedSig = crypto.createHash('sha256')
      .update(secret + amount)
      .digest('hex');
    
    return signature === expectedSig;
  };
}

/**
 * Pricing helper - combine multiple tiers
 */
export class PricingTier {
  private tiers: Map<string, string> = new Map();

  add(key: string, price: string): this {
    this.tiers.set(key, price);
    return this;
  }

  get(key: string): string | undefined {
    return this.tiers.get(key);
  }

  middleware(
    keyFn: (req: Request) => string,
    descriptionFn: (req: Request) => string,
    config?: Partial<X402ServerConfig>
  ) {
    return dynamicPaywall(
      (req) => {
        const key = keyFn(req);
        const price = this.tiers.get(key);
        if (!price) {
          throw new Error(`No price configured for tier: ${key}`);
        }
        return price;
      },
      descriptionFn,
      config
    );
  }
}

/**
 * Usage-based pricing
 */
export interface UsageConfig {
  basePrice: string;      // Base price per request
  perUnit: string;        // Price per unit
  unit: string;           // Unit name (e.g., 'cpu-second', 'MB', 'query')
  calculate: (req: Request) => number | Promise<number>;  // Calculate units
}

export function usagePaywall(
  usage: UsageConfig,
  config?: Partial<X402ServerConfig>
) {
  return dynamicPaywall(
    async (req) => {
      const units = await Promise.resolve(usage.calculate(req));
      const base = parseFloat(usage.basePrice);
      const perUnit = parseFloat(usage.perUnit);
      const total = base + (units * perUnit);
      return total.toFixed(2);
    },
    (req) => `Usage-based pricing: base + ${usage.perUnit} per ${usage.unit}`,
    config
  );
}

/**
 * Subscription paywall (check for valid subscription)
 */
export interface SubscriptionConfig {
  getSubscription: (req: Request) => Promise<{
    active: boolean;
    expiresAt: string;
  } | null>;
  price: string;
  period: 'monthly' | 'yearly';
  renewalUrl?: string;
}

export function subscriptionPaywall(
  subscription: SubscriptionConfig,
  config?: Partial<X402ServerConfig>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check for active subscription
    const sub = await subscription.getSubscription(req);
    
    if (sub && sub.active && new Date(sub.expiresAt) > new Date()) {
      // Active subscription - allow access
      (req as any).subscription = sub;
      next();
      return;
    }
    
    // No active subscription - require payment
    const description = `${subscription.period} subscription - ${subscription.price} USDC`;
    const challenge = createPaymentChallenge(subscription.price, description, config);
    
    res.status(402).json({
      error: 'Subscription Required',
      message: `This endpoint requires an active ${subscription.period} subscription`,
      subscription: {
        price: subscription.price,
        period: subscription.period,
        renewalUrl: subscription.renewalUrl,
      },
      ...challenge,
    });
  };
}

/**
 * Rate-limited paywall (free tier + paid tier)
 */
export interface RateLimitConfig {
  free: {
    limit: number;        // Free requests per window
    windowMs: number;     // Window in milliseconds
  };
  paid: {
    price: string;        // Price per additional request
    description: string;
  };
  getUserId: (req: Request) => string;
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimitedPaywall(
  rateLimitConfig: RateLimitConfig,
  config?: Partial<X402ServerConfig>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = rateLimitConfig.getUserId(req);
    const now = Date.now();
    
    // Get or create usage record
    let usage = rateLimitStore.get(userId);
    
    if (!usage || usage.resetAt < now) {
      // New window
      usage = {
        count: 0,
        resetAt: now + rateLimitConfig.free.windowMs,
      };
      rateLimitStore.set(userId, usage);
    }
    
    // Check if within free tier
    if (usage.count < rateLimitConfig.free.limit) {
      usage.count++;
      next();
      return;
    }
    
    // Exceeded free tier - require payment
    const paymentSignature = req.headers['x-payment-signature'];
    
    if (!paymentSignature) {
      const challenge = createPaymentChallenge(
        rateLimitConfig.paid.price,
        rateLimitConfig.paid.description,
        config
      );
      
      res.status(402).json({
        error: 'Rate Limit Exceeded',
        message: `Free tier limit reached (${rateLimitConfig.free.limit} requests per window)`,
        rateTier: 'paid',
        ...challenge,
      });
      return;
    }
    
    // Verify payment for additional request
    const effectiveConfig = getConfig(config);
    const verified = await verifyPayment(
      paymentSignature as string,
      rateLimitConfig.paid.price,
      effectiveConfig
    );
    
    if (verified) {
      (req as any).paymentVerified = true;
      (req as any).paidRequest = true;
      next();
    } else {
      res.status(402).json({
        error: 'Payment Invalid',
        message: 'Payment signature could not be verified',
      });
    }
  };
}

/**
 * Express router with common x402 endpoints
 */
export function createX402Router() {
  // This would return an Express router with health/pricing endpoints
  // Implemented in the specific application
  return null;
}

// Export pricing helpers
export const PRICING = {
  micro: '0.01',
  small: '0.05',
  medium: '0.10',
  large: '0.25',
  premium: '0.50',
  enterprise: '1.00',
};

export default {
  configureX402Server,
  createPaymentChallenge,
  paywall,
  dynamicPaywall,
  usagePaywall,
  subscriptionPaywall,
  rateLimitedPaywall,
  mockVerification,
  simpleVerification,
  PricingTier,
  PRICING,
};
