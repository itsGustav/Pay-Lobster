import { useReadContract } from 'wagmi';
import { CONTRACTS, IDENTITY_ABI, CHAIN_ID } from '@/lib/contracts';
import type { Address } from 'viem';

interface AgentInfo {
  name: string;
  tokenId: bigint;
  registered: boolean;
}

interface UseUserIdentityReturn {
  agentInfo: AgentInfo | null;
  name: string;
  tokenId: bigint;
  isRegistered: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserIdentity(address?: Address): UseUserIdentityReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'getAgentInfo',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const agentInfo = data
    ? {
        name: data[0] || '',
        tokenId: data[1] || BigInt(0),
        registered: data[2] || false,
      }
    : null;

  return {
    agentInfo,
    name: agentInfo?.name || '',
    tokenId: agentInfo?.tokenId || BigInt(0),
    isRegistered: agentInfo?.registered || false,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
