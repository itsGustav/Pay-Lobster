import { useReadContract, useBlockNumber } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACTS, IDENTITY_ABI, ESCROW_ABI, CHAIN_ID } from '@/lib/contracts';
import { formatUnits } from 'viem';

interface ContractStats {
  totalVolume: number;
  registeredAgents: number;
  transactionCount: number;
  isLoading: boolean;
  error: Error | null;
}

export function useContractStats(): ContractStats {
  const [totalVolume, setTotalVolume] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  
  // Get total registered agents from Identity contract
  const { data: totalSupply, isLoading: isLoadingSupply } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'totalSupply',
    chainId: CHAIN_ID,
  });

  // Get current block number to know how far to scan
  const { data: currentBlock } = useBlockNumber({ chainId: CHAIN_ID });

  // Fetch escrow events to calculate volume and transaction count
  useEffect(() => {
    if (!publicClient || !currentBlock) return;

    const fetchEscrowData = async () => {
      try {
        // Fetch EscrowCreated events
        // Note: Adjust fromBlock based on contract deployment block to reduce load
        const logs = await publicClient.getLogs({
          address: CONTRACTS.ESCROW,
          event: {
            type: 'event',
            name: 'EscrowCreated',
            inputs: [
              { indexed: true, name: 'escrowId', type: 'uint256' },
              { indexed: true, name: 'sender', type: 'address' },
              { indexed: true, name: 'recipient', type: 'address' },
              { indexed: false, name: 'amount', type: 'uint256' },
            ],
          },
          fromBlock: currentBlock - BigInt(10000), // Last ~10k blocks (adjust as needed)
          toBlock: 'latest',
        });

        // Calculate total volume (sum of all escrow amounts)
        const volume = logs.reduce((sum, log) => {
          const amount = log.args.amount || BigInt(0);
          return sum + amount;
        }, BigInt(0));

        // Convert from USDC decimals (6) to human readable
        setTotalVolume(Number(formatUnits(volume, 6)));
        setTransactionCount(logs.length);
      } catch (error) {
        console.error('Error fetching escrow data:', error);
      }
    };

    fetchEscrowData();
  }, [publicClient, currentBlock]);

  return {
    totalVolume,
    registeredAgents: Number(totalSupply || 0),
    transactionCount,
    isLoading: isLoadingSupply,
    error: null,
  };
}
