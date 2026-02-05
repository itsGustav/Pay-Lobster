/**
 * Pay Lobster Donation API
 * 
 * DEPRECATED: Web donations now use direct wallet transactions via MetaMask/WalletConnect.
 * Users sign real blockchain transactions directly — no API needed.
 * 
 * This endpoint remains as a fallback for programmatic donations.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const RECIPIENT_WALLET = '0xf775f0224A680E2915a066e53A389d0335318b7B';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // This endpoint is deprecated - donations go through MetaMask directly
  return res.status(200).json({
    message: 'Web donations use direct wallet signing',
    recipient: RECIPIENT_WALLET,
    network: 'Base',
    instructions: 'Connect wallet on paylobster.com and sign the transaction directly',
    contracts: {
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      chainId: 8453
    }
  });
}
