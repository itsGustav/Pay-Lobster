/**
 * x402 Payment Server Middleware
 *
 * Express middleware for HTTP 402 Payment Required.
 * Generates payment challenges and verifies payments via Coinbase facilitator.
 */
import { Request, Response, NextFunction } from 'express';
export interface X402ServerConfig {
    facilitatorUrl?: string;
    network: string;
    receiverAddress: string;
    acceptedAssets?: string[];
    challengeExpiry?: number;
    verifyPayment?: (signature: string, amount: string) => Promise<boolean>;
}
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
/**
 * Configure x402 server globally
 */
export declare function configureX402Server(config: X402ServerConfig): void;
/**
 * Create payment challenge
 */
export declare function createPaymentChallenge(amount: string, description: string, config?: Partial<X402ServerConfig>): PaymentChallenge;
/**
 * Paywall middleware - require payment to access endpoint
 */
export declare function paywall(price: string, description: string, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Dynamic paywall - determine price at runtime
 */
export declare function dynamicPaywall(priceFn: (req: Request) => string | Promise<string>, descriptionFn: (req: Request) => string | Promise<string>, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Mock verification for testing (accepts any signature)
 */
export declare function mockVerification(): (signature: string, amount: string) => Promise<boolean>;
/**
 * Simple signature verification (hash-based)
 * Use only for testing - NOT secure for production
 */
export declare function simpleVerification(secret: string): (signature: string, amount: string) => Promise<boolean>;
/**
 * Pricing helper - combine multiple tiers
 */
export declare class PricingTier {
    private tiers;
    add(key: string, price: string): this;
    get(key: string): string | undefined;
    middleware(keyFn: (req: Request) => string, descriptionFn: (req: Request) => string, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
/**
 * Usage-based pricing
 */
export interface UsageConfig {
    basePrice: string;
    perUnit: string;
    unit: string;
    calculate: (req: Request) => number | Promise<number>;
}
export declare function usagePaywall(usage: UsageConfig, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
export declare function subscriptionPaywall(subscription: SubscriptionConfig, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate-limited paywall (free tier + paid tier)
 */
export interface RateLimitConfig {
    free: {
        limit: number;
        windowMs: number;
    };
    paid: {
        price: string;
        description: string;
    };
    getUserId: (req: Request) => string;
}
export declare function rateLimitedPaywall(rateLimitConfig: RateLimitConfig, config?: Partial<X402ServerConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Express router with common x402 endpoints
 */
export declare function createX402Router(): null;
export declare const PRICING: {
    micro: string;
    small: string;
    medium: string;
    large: string;
    premium: string;
    enterprise: string;
};
declare const _default: {
    configureX402Server: typeof configureX402Server;
    createPaymentChallenge: typeof createPaymentChallenge;
    paywall: typeof paywall;
    dynamicPaywall: typeof dynamicPaywall;
    usagePaywall: typeof usagePaywall;
    subscriptionPaywall: typeof subscriptionPaywall;
    rateLimitedPaywall: typeof rateLimitedPaywall;
    mockVerification: typeof mockVerification;
    simpleVerification: typeof simpleVerification;
    PricingTier: typeof PricingTier;
    PRICING: {
        micro: string;
        small: string;
        medium: string;
        large: string;
        premium: string;
        enterprise: string;
    };
};
export default _default;
//# sourceMappingURL=x402-server.d.ts.map