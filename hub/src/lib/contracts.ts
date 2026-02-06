import { Address } from 'viem';

// Contract addresses on Base
export const CONTRACTS = {
  IDENTITY: '0xA174ee274F870631B3c330a85EBCad74120BE662' as Address,
  REPUTATION: '0x02bb4132a86134684976E2a52E43D59D89E64b29' as Address,
  CREDIT: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1' as Address,
  ESCROW: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806' as Address,
} as const;

// Minimal ABIs for reading data
export const IDENTITY_ABI = [
  {
    inputs: [],
    name: 'getAgentCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const ESCROW_ABI = [
  {
    inputs: [],
    name: 'escrowCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256', name: 'escrowId' }],
    name: 'escrows',
    outputs: [
      { type: 'address', name: 'payer' },
      { type: 'address', name: 'payee' },
      { type: 'uint256', name: 'amount' },
      { type: 'uint256', name: 'releaseTime' },
      { type: 'bool', name: 'released' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const REPUTATION_ABI = [
  {
    inputs: [{ type: 'address', name: 'agent' }],
    name: 'getReputation',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
