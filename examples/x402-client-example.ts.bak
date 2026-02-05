/**
 * x402 Client Example
 * 
 * Demonstrates how to use the payment-enabled HTTP client
 * to automatically pay for 402-protected resources.
 */

import { CircleClient } from '../lib/circle-client';
import { createX402Fetch } from '../lib/x402-client';

async function main() {
  // Initialize Circle client
  const wallet = new CircleClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });

  // Create x402-enabled fetch
  const x402Fetch = createX402Fetch({
    wallet,
    maxAutoPayUSDC: '1.00',  // Auto-pay up to $1
    
    // Event hooks
    onChallenge: (challenge) => {
      console.log(`💳 Payment Required:`);
      console.log(`   Amount: ${challenge['x-payment-required'].amount} USDC`);
      console.log(`   Description: ${challenge['x-payment-required'].description}`);
    },
    
    onPayment: (amount, url, txHash) => {
      console.log(`💸 Paid ${amount} USDC for ${url}`);
      console.log(`   TX: ${txHash}`);
    },
    
    onVerified: (receipt) => {
      console.log(`✅ Payment verified and cached`);
    },
    
    onError: (error, url) => {
      console.error(`❌ Error accessing ${url}:`, error.message);
    },
  });

  console.log('🚀 x402 Client Example\n');

  // Example 1: Simple payment-gated API call
  console.log('Example 1: Fetching premium data...');
  try {
    const response = await x402Fetch('https://api.example.com/premium-data');
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Failed:', error);
  }

  // Example 2: Agent-to-agent communication
  console.log('\nExample 2: Agent-to-agent analysis request...');
  try {
    const response = await x402Fetch('https://agent-b.com/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property: '123 Main St',
        analysisType: 'market-rate',
      }),
    });
    const analysis = await response.json();
    console.log('Analysis:', analysis);
  } catch (error) {
    console.error('Failed:', error);
  }

  // Example 3: Monetized skill access
  console.log('\nExample 3: Purchasing skill access...');
  try {
    const response = await x402Fetch('https://api.skills.com/yield-optimizer/purchase');
    const license = await response.json();
    console.log('License:', license);
  } catch (error) {
    console.error('Failed:', error);
  }

  // Example 4: Get payment history
  console.log('\nPayment History:');
  const { X402Client } = await import('../lib/x402-client');
  const client = new X402Client({ wallet });
  const receipts = await client.getReceiptHistory();
  
  for (const receipt of receipts) {
    console.log(`  ${receipt.challenge.amount} USDC → ${receipt.url}`);
    console.log(`    ${receipt.challenge.description}`);
    console.log(`    Paid: ${receipt.paidAt}`);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
