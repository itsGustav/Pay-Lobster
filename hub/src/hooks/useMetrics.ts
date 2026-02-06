'use client';

import { useReadContract } from 'wagmi';
import { CONTRACTS, IDENTITY_ABI, ESCROW_ABI } from '@/lib/contracts';
import { base } from 'wagmi/chains';

export function useMetrics() {
  // Read agent count
  const { data: agentCount, isLoading: loadingAgents } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'getAgentCount',
    chainId: base.id,
    query: {
      refetchInterval: 10000, // Refresh every 10 seconds
    },
  });

  // Read escrow count (used as transaction count)
  const { data: txCount, isLoading: loadingTx } = useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: 'escrowCount',
    chainId: base.id,
    query: {
      refetchInterval: 10000,
    },
  });

  // For demo purposes, calculate TVL as escrow count * random amount
  // In production, you'd sum actual escrow amounts
  const tvl = txCount ? Number(txCount) * 1234 : 0;
  const tvlChange = 12.5; // Mock 24h change

  const agentsToday = agentCount ? Math.floor(Number(agentCount) * 0.1) : 0; // Mock: 10% are new today

  return {
    tvl,
    tvlChange,
    agentCount: agentCount ? Number(agentCount) : 0,
    agentsToday,
    txCount: txCount ? Number(txCount) : 0,
    isLoading: loadingAgents || loadingTx,
  };
}
