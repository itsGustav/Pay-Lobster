'use client';

import { Address } from 'viem';
import { Card } from '@/components/ui/Card';
import { useScoreHistory } from '@/hooks/useScoreHistory';
import { cn } from '@/lib/utils';

interface MilestonesProps {
  address: Address;
  className?: string;
}

export function Milestones({ address, className }: MilestonesProps) {
  const { milestones, isLoading, error } = useScoreHistory(address);

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center text-red-500">
          Failed to load milestones
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-800 rounded" />
              <div className="flex-1 h-4 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return '---';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMilestoneIcon = (completed: boolean) => {
    return completed ? '✅' : '⬜';
  };

  return (
    <Card className={className}>
      <div className="space-y-4">
        {/* Header */}
        <h3 className="text-xl font-bold">Milestones</h3>

        {/* Milestone List */}
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                milestone.completed
                  ? 'bg-gray-800/50 border border-gray-700'
                  : 'bg-gray-900 border border-gray-800'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getMilestoneIcon(milestone.completed)}</span>
                <div className="flex-1">
                  <div
                    className={cn(
                      'font-medium',
                      milestone.completed ? 'text-white' : 'text-gray-500'
                    )}
                  >
                    {milestone.title}
                  </div>
                  {milestone.score > 0 && (
                    <div className="text-xs text-gray-600">
                      {milestone.score}+ score required
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'text-sm font-medium',
                  milestone.completed ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {formatDate(milestone.date)}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="pt-4 border-t border-gray-800 text-center">
          <div className="text-sm text-gray-400">
            {milestones.filter((m) => m.completed).length} of {milestones.length} milestones completed
          </div>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-1000"
              style={{
                width: `${(milestones.filter((m) => m.completed).length / milestones.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
