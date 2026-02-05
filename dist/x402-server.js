"use strict";
/**
 * x402 Payment Server Middleware
 *
 * Express middleware for HTTP 402 Payment Required.
 * Generates payment challenges and verifies payments via Coinbase facilitator.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICING = exports.PricingTier = void 0;
exports.configureX402Server = configureX402Server;
exports.createPaymentChallenge = createPaymentChallenge;
exports.paywall = paywall;
exports.dynamicPaywall = dynamicPaywall;
exports.mockVerification = mockVerification;
exports.simpleVerification = simpleVerification;
exports.usagePaywall = usagePaywall;
exports.subscriptionPaywall = subscriptionPaywall;
exports.rateLimitedPaywall = rateLimitedPaywall;
exports.createX402Router = createX402Router;
const crypto_1 = __importDefault(require("crypto"));
// Global config (can be set once for all middleware)
let globalConfig = null;
/**
 * Configure x402 server globally
 */
function configureX402Server(config) {
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
function getConfig(localConfig) {
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
function createPaymentChallenge(amount, description, config) {
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
            nonce: crypto_1.default.randomUUID(),
        },
    };
}
/**
 * Paywall middleware - require payment to access endpoint
 */
function paywall(price, description, config) {
    return async (req, res, next) => {
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
            const verified = await verifyPayment(paymentSignature, price, effectiveConfig);
            if (verified) {
                // Payment verified - proceed
                req.paymentVerified = true;
                req.paymentAmount = price;
                req.paymentSignature = paymentSignature;
                next();
            }
            else {
                res.status(402).json({
                    error: 'Payment Invalid',
                    message: 'Payment signature could not be verified',
                });
            }
        }
        catch (error) {
            console.error('Payment verification error:', error);
            res.status(500).json({
                error: 'Payment Verification Failed',
                message: error.message,
            });
        }
    };
}
/**
 * Dynamic paywall - determine price at runtime
 */
function dynamicPaywall(priceFn, descriptionFn, config) {
    return async (req, res, next) => {
        try {
            // Determine price and description
            const price = await Promise.resolve(priceFn(req));
            const description = await Promise.resolve(descriptionFn(req));
            // Use standard paywall
            const middleware = paywall(price, description, config);
            await middleware(req, res, next);
        }
        catch (error) {
            res.status(500).json({
                error: 'Paywall Configuration Error',
                message: error.message,
            });
        }
    };
}
/**
 * Verify payment with Coinbase x402 facilitator
 */
async function verifyPayment(signature, expectedAmount, config) {
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
    }
    catch (error) {
        console.error('Facilitator verification error:', error);
        return false;
    }
}
/**
 * Mock verification for testing (accepts any signature)
 */
function mockVerification() {
    return async (signature, amount) => {
        // In testing, accept any non-empty signature
        return signature.length > 0;
    };
}
/**
 * Simple signature verification (hash-based)
 * Use only for testing - NOT secure for production
 */
function simpleVerification(secret) {
    return async (signature, amount) => {
        // Verify signature matches hash of secret + amount
        const expectedSig = crypto_1.default.createHash('sha256')
            .update(secret + amount)
            .digest('hex');
        return signature === expectedSig;
    };
}
/**
 * Pricing helper - combine multiple tiers
 */
class PricingTier {
    constructor() {
        this.tiers = new Map();
    }
    add(key, price) {
        this.tiers.set(key, price);
        return this;
    }
    get(key) {
        return this.tiers.get(key);
    }
    middleware(keyFn, descriptionFn, config) {
        return dynamicPaywall((req) => {
            const key = keyFn(req);
            const price = this.tiers.get(key);
            if (!price) {
                throw new Error(`No price configured for tier: ${key}`);
            }
            return price;
        }, descriptionFn, config);
    }
}
exports.PricingTier = PricingTier;
function usagePaywall(usage, config) {
    return dynamicPaywall(async (req) => {
        const units = await Promise.resolve(usage.calculate(req));
        const base = parseFloat(usage.basePrice);
        const perUnit = parseFloat(usage.perUnit);
        const total = base + (units * perUnit);
        return total.toFixed(2);
    }, (req) => `Usage-based pricing: base + ${usage.perUnit} per ${usage.unit}`, config);
}
function subscriptionPaywall(subscription, config) {
    return async (req, res, next) => {
        // Check for active subscription
        const sub = await subscription.getSubscription(req);
        if (sub && sub.active && new Date(sub.expiresAt) > new Date()) {
            // Active subscription - allow access
            req.subscription = sub;
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
// Simple in-memory rate limiter
const rateLimitStore = new Map();
function rateLimitedPaywall(rateLimitConfig, config) {
    return async (req, res, next) => {
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
            const challenge = createPaymentChallenge(rateLimitConfig.paid.price, rateLimitConfig.paid.description, config);
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
        const verified = await verifyPayment(paymentSignature, rateLimitConfig.paid.price, effectiveConfig);
        if (verified) {
            req.paymentVerified = true;
            req.paidRequest = true;
            next();
        }
        else {
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
function createX402Router() {
    // This would return an Express router with health/pricing endpoints
    // Implemented in the specific application
    return null;
}
// Export pricing helpers
exports.PRICING = {
    micro: '0.01',
    small: '0.05',
    medium: '0.10',
    large: '0.25',
    premium: '0.50',
    enterprise: '1.00',
};
exports.default = {
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
    PRICING: exports.PRICING,
};
//# sourceMappingURL=x402-server.js.map