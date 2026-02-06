'use client';

import { Address } from 'viem';
import { Card } from '@/components/ui/Card';
import { usePeerComparison } from '@/hooks/usePeerComparison';
import { cn } from '@/lib/utils';

interface PeerComparisonProps {
  address: Address;
  score: number;
  className?: string;
}

export function PeerComparison({ address, score, className }: PeerComparisonProps) {
  const { percentile, rank, totalAgents, agentsAhead, agentsBehind, isLoading, error } = 
    usePeerComparison(address, score);

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center text-red-500">
          Failed to load peer comparison
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3" />
          <div className="h-24 bg-gray-800 rounded" />
        </div>
      </Card>
    );
  }

  const getPercentileColor = () => {
    if (percentile >= 90) return 'text-green-500';
    if (percentile >= 75) return 'text-blue-500';
    if (percentile >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBarFillPercentage = () => {
    return (score / 850) * 100;
  };

  const getTrophyEmoji = () => {
    if (percentile >= 90) return '🏆';
    if (percentile >= 75) return '🥈';
    if (percentile >= 50) return '🥉';
    return '📊';
  };

  return (
    <Card className={className}>
      <div className="space-y-6">
        {/* Header */}
        <h3 className="text-xl font-bold">Your Ranking</h3>

        {/* Percentile Badge */}
        <div className="text-center py-4">
          <div className="text-5xl mb-3">{getTrophyEmoji()}</div>
          <div className={cn('text-3xl font-bold', getPercentileColor())}>
            Top {100 - percentile}%
          </div>
          <div className="text-sm text-gray-400 mt-1">
            #{rank.toLocaleString()} of {totalAgents.toLocaleString()} agents
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-out',
                percentile >= 90 ? 'bg-green-500' :
                percentile >= 75 ? 'bg-blue-500' :
                percentile >= 50 ? 'bg-orange-500' :
                'bg-red-500'
              )}
              style={{ width: `${getBarFillPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>0</span>
            <span className="font-medium text-white">{score}</span>
            <span>850</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {agentsBehind.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Agents behind you
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {agentsAhead.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Agents ahead
            </div>
          </div>
        </div>

        {/* Encouragement Message */}
        {percentile < 90 && (
          <div className="text-center text-sm text-gray-500 pt-2">
            {agentsAhead > 0 && (
              <p>
                💪 Keep building! {agentsAhead === 1 ? '1 agent' : `${agentsAhead.toLocaleString()} agents`} to pass
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
