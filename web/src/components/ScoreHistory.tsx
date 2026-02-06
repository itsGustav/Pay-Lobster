'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts';
import { Card } from '@/components/ui/Card';
import { useScoreHistory } from '@/hooks/useScoreHistory';
import { cn } from '@/lib/utils';

interface ScoreHistoryProps {
  address: Address;
  className?: string;
}

type TimeRange = 7 | 30 | 90 | 365;

export function ScoreHistory({ address, className }: ScoreHistoryProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const { history, milestones, isLoading, error } = useScoreHistory(address, timeRange);

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center text-red-500">
          Failed to load score history
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3" />
          <div className="h-64 bg-gray-800 rounded" />
        </div>
      </Card>
    );
  }

  // Format data for recharts
  const chartData = history.map((point) => ({
    date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: point.date.getTime(),
    score: point.score,
    reason: point.reason,
  }));

  // Add milestone markers
  const milestoneMarkers = milestones
    .filter((m) => m.completed && m.date)
    .map((m) => {
      const point = chartData.find((p) => {
        const diff = Math.abs(p.timestamp - m.date!.getTime());
        return diff < 24 * 60 * 60 * 1000; // Within 1 day
      });
      return point ? { ...point, milestone: m.title } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-gray-400">{data.date}</p>
        <p className="text-lg font-bold text-white">{data.score}</p>
        {data.reason && (
          <p className="text-xs text-gray-500 mt-1">{data.reason}</p>
        )}
        {data.milestone && (
          <p className="text-xs text-green-500 mt-1">🏆 {data.milestone}</p>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Score History</h3>
          
          {/* Time Range Selector */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as TimeRange)}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  timeRange === days
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {days === 365 ? 'All' : `${days}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No score history yet</p>
              <p className="text-sm mt-1">Complete transactions to build your score</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  domain={[0, 850]}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {/* Milestone markers */}
                {milestoneMarkers.map((marker, i) => 
                  marker ? (
                    <ReferenceDot
                      key={i}
                      x={marker.date}
                      y={marker.score}
                      r={8}
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Score Range Legend */}
        <div className="flex justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
          <span>450</span>
          <span className="text-red-500">Poor</span>
          <span className="text-orange-500">Fair</span>
          <span className="text-blue-500">Good</span>
          <span className="text-green-500">Elite</span>
          <span>850</span>
        </div>
      </div>
    </Card>
  );
}
