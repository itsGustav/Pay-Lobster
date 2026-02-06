import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { formatUnits, type Address, type Log } from 'viem';
import { CONTRACTS, ESCROW_ABI, CHAIN_ID } from '@/lib/contracts';

export interface Transaction {
  id: string;
  type: 'Received' | 'Sent' | 'Escrow Released' | 'Escrow Refunded';
  amount: number;
  from?: string;
  to?: string;
  status?: 'Completed' | 'Pending' | 'Refunded';
  timestamp: number;
  blockNumber: bigint;
  txHash: string;
}

interface UseUserTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserTransactions(
  address?: Address,
  limit = 10
): UseUserTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { data: currentBlock } = useBlockNumber({ chainId: CHAIN_ID });

  const refetch = () => setRefetchKey((prev) => prev + 1);

  useEffect(() => {
    if (!publicClient || !address || !currentBlock) {
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Calculate block range (last ~50k blocks, roughly 7 days on Base)
        const fromBlock = currentBlock - BigInt(50000);

        // Fetch EscrowCreated events where user is sender or recipient
        const [createdAsSender, createdAsRecipient] = await Promise.all([
          publicClient.getLogs({
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
            args: {
              sender: address,
            },
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getLogs({
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
            args: {
              recipient: address,
            },
            fromBlock,
            toBlock: 'latest',
          }),
        ]);

        // Fetch EscrowReleased events
        const releasedLogs = await publicClient.getLogs({
          address: CONTRACTS.ESCROW,
          event: {
            type: 'event',
            name: 'EscrowReleased',
            inputs: [{ indexed: true, name: 'escrowId', type: 'uint256' }],
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Create a set of released escrow IDs
        const releasedEscrowIds = new Set(
          releasedLogs.map((log) => log.args.escrowId?.toString())
        );

        // Process all logs into transactions
        const allLogs = [...createdAsSender, ...createdAsRecipient];
        const txs: Transaction[] = await Promise.all(
          allLogs.map(async (log) => {
            const isSender = log.args.sender?.toLowerCase() === address.toLowerCase();
            const escrowId = log.args.escrowId?.toString() || '';
            const isReleased = releasedEscrowIds.has(escrowId);

            // Get block timestamp
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });

            const amount = log.args.amount
              ? Number(formatUnits(log.args.amount, 6))
              : 0;

            return {
              id: escrowId,
              type: isSender
                ? 'Sent'
                : isReleased
                ? 'Escrow Released'
                : 'Received',
              amount: isSender ? -amount : amount,
              from: isSender ? undefined : log.args.sender,
              to: isSender ? log.args.recipient : undefined,
              status: isReleased ? 'Completed' : 'Pending',
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber,
              txHash: log.transactionHash || '',
            };
          })
        );

        // Sort by block number (most recent first) and limit
        const sortedTxs = txs
          .sort((a, b) => Number(b.blockNumber - a.blockNumber))
          .slice(0, limit);

        setTransactions(sortedTxs);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [publicClient, address, currentBlock, limit, refetchKey]);

  return {
    transactions,
    isLoading,
    error,
    refetch,
  };
}
