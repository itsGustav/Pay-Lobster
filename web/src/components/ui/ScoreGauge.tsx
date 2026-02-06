'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreGauge({ score, maxScore = 850, size = 'md' }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = () => {
    if (score >= 750) return 'text-green-500';
    if (score >= 650) return 'text-blue-500';
    if (score >= 550) return 'text-orange-600';
    return 'text-red-500';
  };

  const getBarColor = () => {
    if (score >= 750) return 'bg-green-500';
    if (score >= 650) return 'bg-blue-500';
    if (score >= 550) return 'bg-orange-600';
    return 'bg-red-500';
  };

  const sizes = {
    sm: { text: 'text-2xl', height: 'h-2' },
    md: { text: 'text-4xl', height: 'h-3' },
    lg: { text: 'text-6xl', height: 'h-4' },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className={cn('font-bold tracking-tight', getScoreColor(), sizes[size].text)}>
          {animatedScore}
        </span>
        <span className="text-gray-400 text-sm">/ {maxScore}</span>
      </div>
      
      <div className={cn('w-full bg-gray-800 rounded-full overflow-hidden', sizes[size].height)}>
        <div
          className={cn('h-full transition-all duration-1000 ease-out', getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Poor</span>
        <span>Fair</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}
