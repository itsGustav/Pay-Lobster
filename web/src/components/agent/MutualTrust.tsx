'use client';

import { useMutualTrust } from '@/hooks/useMutualTrust';
import { useAccount } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { Card } from '@/components/ui/Card';

interface MutualTrustProps {
  theirAddress: Address;
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-gray-500">No rating yet</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <span className="flex items-center gap-1">
      {'⭐'.repeat(fullStars)}
      {hasHalfStar && '⭐'}
      {'☆'.repeat(emptyStars)}
      <span className="ml-2 text-sm text-gray-400">({rating.toFixed(1)})</span>
    </span>
  );
}

export function MutualTrust({ theirAddress }: MutualTrustProps) {
  const { address: myAddress } = useAccount();
  const trustData = useMutualTrust(myAddress, theirAddress);

  // Don't show if not connected or viewing own profile
  if (!myAddress || myAddress.toLowerCase() === theirAddress.toLowerCase()) {
    return null;
  }

  if (trustData.isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading relationship data...</div>
        </div>
      </Card>
    );
  }

  if (trustData.error) {
    return (
      <Card>
        <div className="text-center py-4 text-red-400">
          Failed to load relationship data
        </div>
      </Card>
    );
  }

  // No relationship yet
  if (trustData.transactionCount === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Your Relationship</h3>
        <div className="text-center py-6 text-gray-400">
          <div className="text-4xl mb-2">🤝</div>
          <div>No transactions together yet</div>
          <div className="mt-2 text-sm">Start an escrow to build trust</div>
        </div>
      </Card>
    );
  }

  const volumeUSDC = Number(formatUnits(trustData.totalVolume, 6));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-800">
        Your Relationship
      </h3>

      <div className="space-y-4">
        {/* Transaction Count */}
        <div className="flex items-center gap-2 text-white">
          <span className="text-2xl">🤝</span>
          <span className="font-medium">{trustData.transactionCount} transactions together</span>
        </div>

        {/* Ratings */}
        {(trustData.myRatingOfThem !== null || trustData.theirRatingOfMe !== null) && (
          <div className="space-y-2 py-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">They rated you:</span>
              <StarRating rating={trustData.theirRatingOfMe} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">You rated them:</span>
              <StarRating rating={trustData.myRatingOfThem} />
            </div>
          </div>
        )}

        {/* Transaction Timeline */}
        {trustData.firstTransaction && trustData.lastTransaction && (
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <div className="text-gray-400 text-sm">First transaction</div>
              <div className="text-white font-medium">
                {trustData.firstTransaction.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Last transaction</div>
              <div className="text-white font-medium">
                {trustData.lastTransaction.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        )}

        {/* Total Volume */}
        <div className="pt-3 border-t border-gray-800">
          <div className="text-gray-400 text-sm">Total volume</div>
          <div className="text-white text-xl font-bold">
            ${volumeUSDC.toLocaleString()} USDC
          </div>
        </div>

        {/* Recent Transactions Preview */}
        {trustData.escrows.length > 0 && (
          <div className="pt-3 border-t border-gray-800">
            <div className="text-gray-400 text-sm mb-2">Recent transactions</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {trustData.escrows.slice(-5).reverse().map((escrow) => {
                const isSender = escrow.sender.toLowerCase() === myAddress.toLowerCase();
                const amountUSDC = Number(formatUnits(escrow.amount, 6));
                
                return (
                  <div
                    key={escrow.escrowId}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-gray-400">
                      {isSender ? '→ Sent' : '← Received'}
                    </span>
                    <span className="text-white font-medium">
                      ${amountUSDC.toLocaleString()} USDC
                    </span>
                    <span className="text-gray-500 text-xs">
                      {escrow.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
