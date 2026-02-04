/**
 * x402 Server Example
 * 
 * Demonstrates how to create payment-gated Express endpoints
 * using the x402 paywall middleware.
 */

import express from 'express';
import {
  configureX402Server,
  paywall,
  dynamicPaywall,
  usagePaywall,
  PricingTier,
  PRICING,
  mockVerification,
} from '../lib/x402-server';

const app = express();
app.use(express.json());

// Configure x402 globally
configureX402Server({
  network: 'ETH-SEPOLIA',
  receiverAddress: process.env.RECEIVER_ADDRESS || '0x1234567890123456789012345678901234567890',
  facilitatorUrl: 'https://x402.coinbase.com',
  challengeExpiry: 300, // 5 minutes
  
  // Use mock verification for testing
  verifyPayment: mockVerification(),
});

// ============================================
// SIMPLE PAYWALL EXAMPLES
// ============================================

/**
 * Example 1: Fixed-price endpoint
 */
app.get('/api/premium-data',
  paywall('0.10', 'Premium data access'),
  (req, res) => {
    res.json({
      data: 'This is premium content',
      tier: 'premium',
      paid: true,
    });
  }
);

/**
 * Example 2: Agent analysis service
 */
app.post('/api/analyze',
  paywall('0.25', 'Property analysis'),
  (req, res) => {
    const { property } = req.body;
    
    res.json({
      property,
      analysis: {
        marketRate: '$2,500/month',
        riskScore: 'low',
        recommendations: [
          'Standard deposit amount for area',
          'Suggest 12-month minimum lease',
        ],
      },
      paid: true,
    });
  }
);

// ============================================
// DYNAMIC PRICING EXAMPLES
// ============================================

/**
 * Example 3: Dynamic pricing based on request
 */
app.get('/api/compute/:intensity',
  dynamicPaywall(
    (req) => {
      // Calculate price based on compute intensity
      const intensity = req.params.intensity;
      const baseCost = 0.10;
      const multiplier = intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1;
      return (baseCost * multiplier).toFixed(2);
    },
    (req) => `Compute job: ${req.params.intensity} intensity`,
  ),
  (req, res) => {
    res.json({
      intensity: req.params.intensity,
      result: `Computed with ${req.params.intensity} intensity`,
    });
  }
);

/**
 * Example 4: Usage-based pricing
 */
app.post('/api/storage',
  usagePaywall({
    basePrice: '0.05',
    perUnit: '0.01',
    unit: 'MB',
    calculate: (req) => {
      // Calculate storage size from request
      const data = JSON.stringify(req.body);
      return Math.ceil(data.length / 1024 / 1024); // MB
    },
  }),
  (req, res) => {
    res.json({
      stored: true,
      size: JSON.stringify(req.body).length,
    });
  }
);

// ============================================
// PRICING TIERS
// ============================================

/**
 * Example 5: Multiple pricing tiers
 */
const skillPricing = new PricingTier()
  .add('yield-optimizer', '1.00')
  .add('bridge-assistant', '0.50')
  .add('dispute-resolver', '2.00');

app.post('/skills/:skillId/purchase',
  skillPricing.middleware(
    (req) => req.params.skillId,
    (req) => `Purchase skill: ${req.params.skillId}`,
  ),
  (req, res) => {
    res.json({
      skillId: req.params.skillId,
      accessToken: `sk_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
);

// ============================================
// INVOICE PAYMENT EXAMPLE
// ============================================

/**
 * Example 6: Invoice payment endpoint
 */
app.post('/invoices/:id/pay',
  async (req, res, next) => {
    // Load invoice to get amount
    const invoiceId = req.params.id;
    
    // Mock invoice lookup
    const invoice = {
      id: invoiceId,
      total: '150.00',
      description: `Invoice payment #${invoiceId}`,
    };
    
    // Create dynamic paywall for invoice amount
    const middleware = paywall(invoice.total, invoice.description);
    await middleware(req, res, next);
  },
  (req, res) => {
    res.json({
      paid: true,
      invoiceId: req.params.id,
      receipt: `receipt_${Date.now()}`,
    });
  }
);

// ============================================
// ESCROW PREMIUM FEATURES
// ============================================

/**
 * Example 7: Premium escrow features
 */
app.post('/escrow/:id/optimize',
  paywall('0.25', 'Yield optimization for escrow'),
  (req, res) => {
    res.json({
      escrowId: req.params.id,
      yieldOptimization: 'enabled',
      estimatedAPY: '4.5%',
    });
  }
);

app.post('/escrow/:id/insure',
  paywall('0.50', 'Escrow insurance coverage'),
  (req, res) => {
    res.json({
      escrowId: req.params.id,
      insurance: 'enabled',
      coverage: '100%',
      premium: '0.5% of escrow amount',
    });
  }
);

// ============================================
// CONTACT VERIFICATION
// ============================================

/**
 * Example 8: Premium contact verification
 */
app.get('/contacts/:id/verify/:type',
  async (req, res, next) => {
    const { type } = req.params;
    
    const prices: Record<string, string> = {
      basic: '0.05',
      full: '0.10',
      fraud: '0.15',
      report: '0.25',
    };
    
    const price = prices[type] || '0.10';
    const middleware = paywall(price, `Contact verification: ${type}`);
    await middleware(req, res, next);
  },
  (req, res) => {
    const { id, type } = req.params;
    
    res.json({
      contactId: id,
      verificationType: type,
      onChainVerified: true,
      riskScore: {
        score: 25,
        level: 'low',
        factors: ['Active on multiple chains', 'Good transaction history'],
      },
      verified: true,
    });
  }
);

// ============================================
// FREE ENDPOINTS (for comparison)
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', x402: 'enabled' });
});

app.get('/pricing', (req, res) => {
  res.json({
    tiers: PRICING,
    custom: 'Contact for custom pricing',
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3402;

app.listen(PORT, () => {
  console.log(`🚀 x402 Server Example running on port ${PORT}`);
  console.log(`\nTry these endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/api/premium-data`);
  console.log(`  POST http://localhost:${PORT}/api/analyze`);
  console.log(`  GET  http://localhost:${PORT}/api/compute/high`);
  console.log(`  POST http://localhost:${PORT}/skills/yield-optimizer/purchase`);
  console.log(`\nFree endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/pricing`);
  console.log(`\n💡 All paid endpoints return 402 Payment Required without payment signature`);
});
