'use client';

import { cn } from '@/lib/utils';

interface TrustVector {
  delivery: number;
  payment: number;
  communication: number;
  history: number;
}

interface TrustBreakdownProps {
  trustVector: TrustVector;
}

export function TrustBreakdown({ trustVector }: TrustBreakdownProps) {
  const metrics = [
    { name: 'Delivery', value: trustVector.delivery, color: 'bg-orange-600' },
    { name: 'Payment', value: trustVector.payment, color: 'bg-orange-600' },
    { name: 'Communication', value: trustVector.communication, color: 'bg-orange-600' },
    { name: 'History', value: trustVector.history, color: 'bg-orange-600' },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6">Trust Breakdown</h2>
      
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm md:text-base">{metric.name}</span>
              <span className="text-white font-medium">{metric.value}%</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-1000 ease-out rounded-full',
                  metric.color
                )}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
