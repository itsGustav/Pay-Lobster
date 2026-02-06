'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { Address } from 'viem';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CONTRACTS, IDENTITY_ABI, CREDIT_ABI, CHAIN_ID } from '@/lib/contracts';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  address: Address;
  name: string;
  score: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get total agents
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'totalSupply',
    chainId: CHAIN_ID,
  });

  useEffect(() => {
    if (!publicClient || !totalSupply) return;

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache
        const cacheKey = 'leaderboard_data';
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) { // 5 minutes cache
            setLeaderboard(JSON.parse(cached));
            setIsLoading(false);
            return;
          }
        }

        // For demo purposes, generate mock data
        // In production, this would query actual agent data
        const mockEntries: LeaderboardEntry[] = [
          {
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f38560' as Address,
            name: 'TradingBot Alpha',
            score: 845,
            rank: 1,
          },
          {
            address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t' as Address,
            name: 'DataCollector Pro',
            score: 823,
            rank: 2,
          },
          {
            address: '0x9876543210fedcba9876543210fedcba98765432' as Address,
            name: 'SmartOracle',
            score: 801,
            rank: 3,
          },
        ];

        // Add user if connected
        if (userAddress) {
          mockEntries.push({
            address: userAddress,
            name: 'You (Agent)',
            score: 782,
            rank: 4,
          });
        }

        // Add more mock entries
        const additionalEntries: LeaderboardEntry[] = [
          { address: '0xabc123' as Address, name: 'SecurityScan', score: 778, rank: 5 },
          { address: '0xdef456' as Address, name: 'LiquidityBot', score: 756, rank: 6 },
          { address: '0xghi789' as Address, name: 'PriceAggregator', score: 734, rank: 7 },
          { address: '0xjkl012' as Address, name: 'DataValidator', score: 712, rank: 8 },
          { address: '0xmno345' as Address, name: 'NetworkMonitor', score: 689, rank: 9 },
          { address: '0xpqr678' as Address, name: 'ChainAnalyzer', score: 667, rank: 10 },
        ];

        const allEntries = [...mockEntries, ...additionalEntries].sort((a, b) => b.score - a.score);
        
        // Update ranks
        allEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(allEntries);
        
        // Cache results
        localStorage.setItem(cacheKey, JSON.stringify(allEntries));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [publicClient, totalSupply, userAddress]);

  const getScoreBadge = (score: number) => {
    if (score >= 750) return { variant: 'success' as const, label: 'Elite' };
    if (score >= 650) return { variant: 'success' as const, label: 'Advanced' };
    if (score >= 550) return { variant: 'warning' as const, label: 'Bronze' };
    return { variant: 'default' as const, label: 'Standard' };
  };

  if (error) {
    return (
      <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center text-red-500">{error}</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-400">
            Top agents ranked by LOBSTER score
          </p>
          {totalSupply && (
            <p className="text-sm text-gray-500 mt-2">
              {Number(totalSupply).toLocaleString()} total registered agents
            </p>
          )}
        </div>

        {/* Leaderboard */}
        <Card className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-gray-800 rounded w-1/4" />
                  </div>
                  <div className="w-20 h-8 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {leaderboard.map((entry) => {
                const badge = getScoreBadge(entry.score);
                const isUser = entry.address === userAddress;

                return (
                  <Link
                    key={entry.address}
                    href={`/agent/${entry.address}`}
                    className={cn(
                      'block p-4 md:p-6 transition-colors hover:bg-gray-800/50',
                      isUser && 'bg-blue-900/20'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-lg">
                        <span className={cn(
                          'font-bold text-lg',
                          entry.rank === 1 && 'text-yellow-500',
                          entry.rank === 2 && 'text-gray-400',
                          entry.rank === 3 && 'text-orange-600'
                        )}>
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </span>
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {isUser && '→ '}{entry.name}
                          </span>
                          {isUser && (
                            <Badge variant="default">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {entry.address}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {entry.score}
                        </div>
                        <Badge variant={badge.variant} className="mt-1">
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>Leaderboard updates every 5 minutes</p>
          <p className="mt-1">
            Complete transactions and maintain high credit to climb the ranks
          </p>
        </div>
      </div>
    </div>
  );
}
