import { base } from 'wagmi/chains';
import type { Address } from 'viem';

// Base Mainnet Contract Addresses (V3)
export const CONTRACTS = {
  IDENTITY: '0xA174ee274F870631B3c330a85EBCad74120BE662' as Address,
  REPUTATION: '0x02bb4132a86134684976E2a52E43D59D89E64b29' as Address,
  CREDIT: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1' as Address,
  ESCROW: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806' as Address,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
};

export const CHAIN_ID = base.id;

// BaseScan URLs
export const getBaseScanUrl = (address: Address) => 
  `https://basescan.org/address/${address}`;

// Identity Contract ABI
export const IDENTITY_ABI = [
  {
    anonymous: true,
    inputs: [
      { indexed: true, name: 'agent', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
    ],
    name: 'AgentRegistered',
    type: 'event',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getAgentInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'registered', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Reputation Contract ABI
export const REPUTATION_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReputation',
    outputs: [
      { name: 'score', type: 'uint256' },
      { name: 'trustVector', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Credit Score Contract ABI
export const CREDIT_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getCreditScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getCreditStatus',
    outputs: [
      { name: 'limit', type: 'uint256' },
      { name: 'available', type: 'uint256' },
      { name: 'inUse', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: true,
    inputs: [
      { indexed: true, name: 'agent', type: 'address' },
      { indexed: false, name: 'oldScore', type: 'uint256' },
      { indexed: false, name: 'newScore', type: 'uint256' },
      { indexed: false, name: 'reason', type: 'string' },
    ],
    name: 'ScoreUpdated',
    type: 'event',
  },
] as const;

// Escrow Contract ABI
export const ESCROW_ABI = [
  {
    anonymous: true,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'uint256' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'EscrowCreated',
    type: 'event',
  },
  {
    anonymous: true,
    inputs: [
      { indexed: true, name: 'escrowId', type: 'uint256' },
    ],
    name: 'EscrowReleased',
    type: 'event',
  },
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'description', type: 'string' },
    ],
    name: 'createEscrow',
    outputs: [{ name: 'escrowId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'releaseEscrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'getEscrow',
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTransactionCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// USDC Contract ABI (minimal)
export const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
