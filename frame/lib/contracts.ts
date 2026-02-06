import { Address } from 'viem';

// V3 Contract Addresses on Base Mainnet
export const CONTRACTS = {
  IDENTITY: '0xA174ee274F870631B3c330a85EBCad74120BE662' as Address,
  REPUTATION: '0x02bb4132a86134684976E2a52E43D59D89E64b29' as Address,
  CREDIT: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1' as Address,
  ESCROW: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806' as Address,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
} as const;

// Reputation Contract ABI (minimal - just what we need)
export const REPUTATION_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getTrustScore',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getTransactionCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Identity Contract ABI (check if user is registered)
export const IDENTITY_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isRegistered',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper function to calculate tier from score
export function getTier(score: number): string {
  if (score >= 750) return '🌟 Elite Lobster';
  if (score >= 650) return '🦞 Premium Lobster';
  if (score >= 550) return '🟢 Good Lobster';
  if (score >= 450) return '🟡 Average Lobster';
  return '🔴 New Lobster';
}

// Helper to format score display
export function formatScore(score: number): string {
  return Math.min(850, Math.max(300, score)).toString();
}

// Base Mainnet RPC
export const BASE_RPC = 'https://mainnet.base.org';
