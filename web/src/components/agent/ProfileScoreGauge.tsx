'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProfileScoreGaugeProps {
  score: number;
  tier: string;
  creditLimit: number;
  creditAvailable: number;
}

export function ProfileScoreGauge({ 
  score, 
  tier, 
  creditLimit, 
  creditAvailable 
}: ProfileScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

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

  const getGradient = () => {
    if (score >= 750) return 'from-green-500/20 via-green-500/10 to-transparent';
    if (score >= 650) return 'from-blue-500/20 via-blue-500/10 to-transparent';
    if (score >= 550) return 'from-orange-500/20 via-orange-500/10 to-transparent';
    return 'from-red-500/20 via-red-500/10 to-transparent';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      {/* Score Circle */}
      <div className="flex flex-col items-center mb-8">
        <div className={cn(
          'relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center',
          'bg-gradient-to-b', getGradient(),
          'border-4',
          score >= 750 ? 'border-green-500' : 
          score >= 650 ? 'border-blue-500' : 
          score >= 550 ? 'border-orange-600' : 'border-red-500'
        )}>
          <div className="text-center">
            <div className={cn(
              'text-6xl md:text-7xl font-bold mb-2',
              getScoreColor()
            )}>
              {animatedScore}
            </div>
            <div className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span>★</span>
              <span>{tier}</span>
              <span>★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Info */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
        <div className="text-center md:text-left">
          <div className="text-gray-500 text-sm mb-1">Credit Limit</div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {formatCurrency(creditLimit)}
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className="text-gray-500 text-sm mb-1">Available</div>
          <div className="text-orange-600 text-xl md:text-2xl font-bold">
            {formatCurrency(creditAvailable)}
          </div>
        </div>
      </div>
    </div>
  );
}
