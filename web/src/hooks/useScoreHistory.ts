import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { CONTRACTS, CREDIT_ABI, CHAIN_ID } from '@/lib/contracts';

export interface ScoreHistoryPoint {
  date: Date;
  score: number;
  reason?: string;
}

export interface Milestone {
  title: string;
  score: number;
  date?: Date;
  completed: boolean;
}

interface UseScoreHistoryReturn {
  history: ScoreHistoryPoint[];
  milestones: Milestone[];
  isLoading: boolean;
  error: Error | null;
}

const MILESTONE_DEFINITIONS = [
  { title: 'Registered', score: 0, key: 'registered' },
  { title: 'First Transaction', score: 100, key: 'first_tx' },
  { title: 'Reached 500 (Bronze)', score: 500, key: 'bronze' },
  { title: 'Unlocked Credit (600)', score: 600, key: 'credit' },
  { title: 'Reached Elite (750)', score: 750, key: 'elite' },
  { title: 'First $1000 Escrow', score: 700, key: 'big_escrow' },
  { title: '100 Transactions', score: 800, key: 'hundred_tx' },
];

export function useScoreHistory(
  address: Address | undefined,
  days: number = 30
): UseScoreHistoryReturn {
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  useEffect(() => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    const fetchScoreHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get from localStorage cache first
        const cacheKey = `score_history_${address}_${days}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) { // 5 minutes cache
            const data = JSON.parse(cached);
            setHistory(data.history.map((h: any) => ({ ...h, date: new Date(h.date) })));
            setMilestones(data.milestones.map((m: any) => ({ ...m, date: m.date ? new Date(m.date) : undefined })));
            setIsLoading(false);
            return;
          }
        }

        // Calculate fromBlock based on days
        const currentBlock = await publicClient.getBlockNumber();
        // Approximate: ~2 seconds per block on Base
        const blocksPerDay = (24 * 60 * 60) / 2;
        const fromBlock = currentBlock - BigInt(Math.floor(blocksPerDay * days));

        // Fetch ScoreUpdated events
        const logs = await publicClient.getLogs({
          address: CONTRACTS.CREDIT,
          event: {
            type: 'event',
            name: 'ScoreUpdated',
            inputs: [
              { indexed: true, name: 'agent', type: 'address' },
              { indexed: false, name: 'oldScore', type: 'uint256' },
              { indexed: false, name: 'newScore', type: 'uint256' },
              { indexed: false, name: 'reason', type: 'string' },
            ],
          },
          args: { agent: address },
          fromBlock: fromBlock > 0 ? fromBlock : BigInt(0),
          toBlock: 'latest',
        });

        // Convert logs to history points
        const points: ScoreHistoryPoint[] = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
              date: new Date(Number(block.timestamp) * 1000),
              score: Number(log.args.newScore),
              reason: log.args.reason,
            };
          })
        );

        // Sort by date
        points.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Build milestones from history
        const completedMilestones: Milestone[] = MILESTONE_DEFINITIONS.map((def) => {
          const milestone = points.find((p) => p.score >= def.score);
          return {
            title: def.title,
            score: def.score,
            date: milestone?.date,
            completed: !!milestone,
          };
        });

        setHistory(points);
        setMilestones(completedMilestones);

        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify({ history: points, milestones: completedMilestones }));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } catch (err) {
        console.error('Error fetching score history:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch score history'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchScoreHistory();
  }, [address, days, publicClient]);

  return { history, milestones, isLoading, error };
}
