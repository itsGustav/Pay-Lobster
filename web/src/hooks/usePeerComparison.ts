import { useState, useEffect } from 'react';
import { usePublicClient, useReadContract } from 'wagmi';
import { Address } from 'viem';
import { CONTRACTS, IDENTITY_ABI, CREDIT_ABI, CHAIN_ID } from '@/lib/contracts';

interface UsePeerComparisonReturn {
  percentile: number;
  rank: number;
  totalAgents: number;
  agentsAhead: number;
  agentsBehind: number;
  isLoading: boolean;
  error: Error | null;
}

export function usePeerComparison(
  address: Address | undefined,
  userScore: number
): UsePeerComparisonReturn {
  const [percentile, setPercentile] = useState(0);
  const [rank, setRank] = useState(0);
  const [agentsAhead, setAgentsAhead] = useState(0);
  const [agentsBehind, setAgentsBehind] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  // Get total registered agents
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'totalSupply',
    chainId: CHAIN_ID,
  });

  const totalAgents = Number(totalSupply || 0);

  useEffect(() => {
    if (!address || !publicClient || totalAgents === 0 || !userScore) {
      setIsLoading(false);
      return;
    }

    const fetchPeerComparison = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try cache first
        const cacheKey = `peer_comparison_${address}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 10 * 60 * 1000) { // 10 minutes cache
            const data = JSON.parse(cached);
            setPercentile(data.percentile);
            setRank(data.rank);
            setAgentsAhead(data.agentsAhead);
            setAgentsBehind(data.agentsBehind);
            setIsLoading(false);
            return;
          }
        }

        // Sample approach: We can't efficiently query all agents' scores
        // So we'll use statistical estimation based on score distribution
        // In production, this would be better served by a backend indexer
        
        // For now, use a simplified estimation:
        // Assume normal distribution with mean=500, stddev=150
        const mean = 500;
        const stddev = 150;
        const z = (userScore - mean) / stddev;
        
        // Calculate percentile using approximation of CDF
        let estimatedPercentile = 50;
        if (z >= 0) {
          estimatedPercentile = 50 + (50 * Math.min(z / 3, 1));
        } else {
          estimatedPercentile = 50 - (50 * Math.min(Math.abs(z) / 3, 1));
        }

        const estimatedRank = Math.max(1, Math.floor(totalAgents * (1 - estimatedPercentile / 100)));
        const estimatedAgentsAhead = estimatedRank - 1;
        const estimatedAgentsBehind = totalAgents - estimatedRank;

        setPercentile(Math.round(estimatedPercentile));
        setRank(estimatedRank);
        setAgentsAhead(estimatedAgentsAhead);
        setAgentsBehind(estimatedAgentsBehind);

        // Cache the results
        const data = {
          percentile: Math.round(estimatedPercentile),
          rank: estimatedRank,
          agentsAhead: estimatedAgentsAhead,
          agentsBehind: estimatedAgentsBehind,
        };
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } catch (err) {
        console.error('Error calculating peer comparison:', err);
        setError(err instanceof Error ? err : new Error('Failed to calculate peer comparison'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeerComparison();
  }, [address, userScore, totalAgents, publicClient]);

  return {
    percentile,
    rank,
    totalAgents,
    agentsAhead,
    agentsBehind,
    isLoading,
    error,
  };
}
