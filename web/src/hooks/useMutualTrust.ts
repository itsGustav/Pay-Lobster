import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { CONTRACTS, ESCROW_ABI, REPUTATION_ABI, CHAIN_ID } from '@/lib/contracts';
import type { Address } from 'viem';

export interface MutualTrustData {
  transactionCount: number;
  totalVolume: bigint;
  myRatingOfThem: number | null;
  theirRatingOfMe: number | null;
  firstTransaction: Date | null;
  lastTransaction: Date | null;
  escrows: EscrowTransaction[];
  isLoading: boolean;
  error: Error | null;
}

export interface EscrowTransaction {
  escrowId: string;
  sender: Address;
  recipient: Address;
  amount: bigint;
  timestamp: Date;
  blockNumber: bigint;
}

/**
 * Hook to fetch mutual trust relationship data between two addresses
 */
export function useMutualTrust(
  myAddress: Address | undefined,
  theirAddress: Address | undefined
): MutualTrustData {
  const [data, setData] = useState<Omit<MutualTrustData, 'isLoading' | 'error'>>({
    transactionCount: 0,
    totalVolume: BigInt(0),
    myRatingOfThem: null,
    theirRatingOfMe: null,
    firstTransaction: null,
    lastTransaction: null,
    escrows: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { data: currentBlock } = useBlockNumber({ chainId: CHAIN_ID });

  useEffect(() => {
    if (!publicClient || !currentBlock || !myAddress || !theirAddress) {
      setIsLoading(false);
      return;
    }

    // Don't fetch if comparing same address
    if (myAddress.toLowerCase() === theirAddress.toLowerCase()) {
      setIsLoading(false);
      return;
    }

    const fetchMutualTrust = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all escrow transactions involving both addresses
        const escrowLogs = await publicClient.getLogs({
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
          fromBlock: currentBlock - BigInt(500000), // ~2 months of history on Base
          toBlock: 'latest',
        });

        // Filter for transactions between the two addresses
        const mutualEscrows = escrowLogs.filter((log) => {
          const sender = log.args.sender?.toLowerCase();
          const recipient = log.args.recipient?.toLowerCase();
          const my = myAddress.toLowerCase();
          const their = theirAddress.toLowerCase();

          return (
            (sender === my && recipient === their) ||
            (sender === their && recipient === my)
          );
        });

        // Build transaction list with timestamps
        const escrowTransactions: EscrowTransaction[] = await Promise.all(
          mutualEscrows.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });

            return {
              escrowId: log.args.escrowId?.toString() || '0',
              sender: log.args.sender as Address,
              recipient: log.args.recipient as Address,
              amount: log.args.amount || BigInt(0),
              timestamp: new Date(Number(block.timestamp) * 1000),
              blockNumber: log.blockNumber,
            };
          })
        );

        // Sort by timestamp
        escrowTransactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Calculate stats
        const transactionCount = escrowTransactions.length;
        const totalVolume = escrowTransactions.reduce(
          (sum, tx) => sum + tx.amount,
          BigInt(0)
        );
        const firstTransaction = escrowTransactions[0]?.timestamp || null;
        const lastTransaction = escrowTransactions[escrowTransactions.length - 1]?.timestamp || null;

        // TODO: Fetch ratings when Rating contract is available
        // For now, set to null as placeholder
        const myRatingOfThem: number | null = null;
        const theirRatingOfMe: number | null = null;

        // If there's a Rating contract with a getRating function:
        // try {
        //   const myRating = await publicClient.readContract({
        //     address: CONTRACTS.RATING,
        //     abi: RATING_ABI,
        //     functionName: 'getRating',
        //     args: [myAddress, theirAddress],
        //   });
        //   myRatingOfThem = Number(myRating);
        // } catch (err) {
        //   console.log('No rating found from me to them');
        // }

        setData({
          transactionCount,
          totalVolume,
          myRatingOfThem,
          theirRatingOfMe,
          firstTransaction,
          lastTransaction,
          escrows: escrowTransactions,
        });
      } catch (err) {
        console.error('Error fetching mutual trust data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch mutual trust data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMutualTrust();
  }, [publicClient, currentBlock, myAddress, theirAddress]);

  return {
    ...data,
    isLoading,
    error,
  };
}
