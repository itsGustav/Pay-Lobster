import { useState, useEffect } from 'react';
import { usePublicClient, useReadContract, useBlockNumber } from 'wagmi';
import { CONTRACTS, IDENTITY_ABI, REPUTATION_ABI, CREDIT_ABI, ESCROW_ABI, CHAIN_ID } from '@/lib/contracts';
import type { Address } from 'viem';

export interface Agent {
  id: string;
  address: Address;
  name: string;
  score: number;
  trustPercent: number;
  transactions: number;
  description: string;
}

interface UseRegisteredAgentsResult {
  agents: Agent[];
  isLoading: boolean;
  error: Error | null;
}

export function useRegisteredAgents(): UseRegisteredAgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { data: currentBlock } = useBlockNumber({ chainId: CHAIN_ID });

  useEffect(() => {
    if (!publicClient || !currentBlock) return;

    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch AgentRegistered events from Identity contract
        const logs = await publicClient.getLogs({
          address: CONTRACTS.IDENTITY,
          event: {
            type: 'event',
            name: 'AgentRegistered',
            inputs: [
              { indexed: true, name: 'agent', type: 'address' },
              { indexed: true, name: 'tokenId', type: 'uint256' },
              { indexed: false, name: 'name', type: 'string' },
            ],
          },
          fromBlock: currentBlock - BigInt(100000), // Adjust based on contract deployment
          toBlock: 'latest',
        });

        if (logs.length === 0) {
          setAgents([]);
          setIsLoading(false);
          return;
        }

        // Fetch reputation and transaction data for each agent
        const agentPromises = logs.map(async (log) => {
          const address = log.args.agent as Address;
          const name = log.args.name || 'Unknown Agent';
          const tokenId = log.args.tokenId?.toString() || '0';

          try {
            // Fetch reputation (LOBSTER score + trust vector)
            const reputation = await publicClient.readContract({
              address: CONTRACTS.REPUTATION,
              abi: REPUTATION_ABI,
              functionName: 'getReputation',
              args: [address],
            });

            // Fetch credit score
            const creditScore = await publicClient.readContract({
              address: CONTRACTS.CREDIT,
              abi: CREDIT_ABI,
              functionName: 'getCreditScore',
              args: [address],
            });

            // Fetch transaction count from escrow events
            const txLogs = await publicClient.getLogs({
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
              fromBlock: currentBlock - BigInt(100000),
              toBlock: 'latest',
            });

            // Count transactions where this address was sender or recipient
            const transactionCount = txLogs.filter(
              (tx) => tx.args.sender === address || tx.args.recipient === address
            ).length;

            const score = Number(reputation[0]);
            const trustVector = Number(reputation[1]);
            const trustPercent = Math.min(Math.round((trustVector / 1000) * 100), 100);

            return {
              id: tokenId,
              address,
              name,
              score,
              trustPercent,
              transactions: transactionCount,
              description: `Agent with LOBSTER score ${score}`, // Generic description
            };
          } catch (err) {
            console.error(`Error fetching data for agent ${address}:`, err);
            return null;
          }
        });

        const resolvedAgents = (await Promise.all(agentPromises)).filter(
          (agent): agent is Agent => agent !== null
        );

        setAgents(resolvedAgents);
      } catch (err) {
        console.error('Error fetching registered agents:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [publicClient, currentBlock]);

  return { agents, isLoading, error };
}
