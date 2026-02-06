import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS, USDC_ABI, CHAIN_ID } from '@/lib/contracts';
import type { Address } from 'viem';

interface UseUserBalanceReturn {
  balance: number;
  balanceRaw: bigint;
  formattedBalance: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserBalance(address?: Address): UseUserBalanceReturn {
  const {
    data: balanceRaw,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    },
  });

  const balance = balanceRaw ? Number(formatUnits(balanceRaw, 6)) : 0;
  const formattedBalance = balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    balance,
    balanceRaw: balanceRaw || BigInt(0),
    formattedBalance,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
