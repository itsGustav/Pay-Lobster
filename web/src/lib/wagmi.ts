import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Pay Lobster',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'pay-lobster-demo',
  chains: [base, baseSepolia],
  ssr: true,
});

// Contract addresses (V3) - Deployed 2026-02-05
export const CONTRACTS = {
  // Base Sepolia (Testnet) - Not deployed yet
  sepolia: {
    identity: '' as `0x${string}`,
    reputation: '' as `0x${string}`,
    credit: '' as `0x${string}`,
    escrow: '' as `0x${string}`,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
  },
  // Base Mainnet - LIVE
  mainnet: {
    identity: '0xA174ee274F870631B3c330a85EBCad74120BE662' as `0x${string}`,
    reputation: '0x02bb4132a86134684976E2a52E43D59D89E64b29' as `0x${string}`,
    credit: '0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1' as `0x${string}`,
    escrow: '0x49EdEe04c78B7FeD5248A20706c7a6c540748806' as `0x${string}`,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  },
  // V1 contracts (mainnet - legacy)
  v1: {
    escrow: '0xa091fC821c85Dfd2b2B3EF9e22c5f4c8B8A24525' as `0x${string}`,
    registry: '0x10BCa62Ce136A70F914c56D97e491a85d1e050E7' as `0x${string}`,
  },
};
