'use client';

import { Button } from '@/components/ui/Button';

interface Transaction {
  id: string;
  type: 'completed' | 'rated' | 'late' | 'pending';
  description: string;
  amount?: string;
  timeAgo: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export function TransactionHistory({ transactions, onViewAll }: TransactionHistoryProps) {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'completed':
        return '✅';
      case 'rated':
        return '⭐';
      case 'late':
        return '⚠️';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions yet
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{getIcon(tx.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm md:text-base break-words">
                    {tx.description}
                    {tx.amount && (
                      <span className="text-orange-600 font-medium"> {tx.amount}</span>
                    )}
                  </p>
                </div>
                <span className="text-gray-500 text-xs md:text-sm flex-shrink-0">
                  {tx.timeAgo}
                </span>
              </div>
            ))}
          </div>
          
          {onViewAll && (
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={onViewAll}>
                View All →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
