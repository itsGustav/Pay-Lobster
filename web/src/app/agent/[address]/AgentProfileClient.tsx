'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import type { Address } from 'viem';
import { Button } from '@/components/ui/Button';
import { AgentHeader } from '@/components/agent/AgentHeader';
import { ProfileScoreGauge } from '@/components/agent/ProfileScoreGauge';
import { TrustBreakdown } from '@/components/agent/TrustBreakdown';
import { TransactionHistory } from '@/components/agent/TransactionHistory';
import { BadgeGrid } from '@/components/agent/BadgeGrid';
import { ShareButtons } from '@/components/agent/ShareButtons';
import { MutualTrust } from '@/components/agent/MutualTrust';
import { ScoreHistory } from '@/components/ScoreHistory';
import { PeerComparison } from '@/components/PeerComparison';
import { CONTRACTS, IDENTITY_ABI, REPUTATION_ABI, ESCROW_ABI } from '@/lib/contracts';
import { 
  getTier, 
  parseTrustVector, 
  calculateBadges,
  formatDate,
  formatTimeAgo,
  type TrustVector 
} from '@/lib/agent-utils';

interface AgentProfileClientProps {
  address: Address;
}

export function AgentProfileClient({ address }: AgentProfileClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch agent identity
  const { 
    data: identity, 
    isLoading: identityLoading,
    isError: identityError 
  } = useReadContract({
    address: CONTRACTS.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'getAgentInfo',
    args: [address],
  });

  // Fetch reputation
  const { 
    data: reputation,
    isLoading: reputationLoading,
    isError: reputationError 
  } = useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: REPUTATION_ABI,
    functionName: 'getReputation',
    args: [address],
  });

  // Fetch transaction count
  const { 
    data: txCount,
    isLoading: txCountLoading 
  } = useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: 'getUserTransactionCount',
    args: [address],
  });

  // Loading state
  if (!mounted || identityLoading || reputationLoading || txCountLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error states
  if (identityError || reputationError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ErrorState 
            title="Error Loading Profile"
            message="Unable to load agent data from the blockchain. Please try again later."
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Agent not registered
  if (!identity || !identity[2]) { // identity[2] is the 'registered' boolean
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ErrorState 
            title="Agent Not Found"
            message="This address is not registered as a Pay Lobster agent."
            actionLabel="Register as Agent"
            onAction={() => router.push('/register')}
          />
        </div>
      </div>
    );
  }

  // Parse data
  const agentName = identity[0] || 'Unnamed Agent';
  const tokenId = identity[1];
  const score = reputation ? Number(reputation[0]) : 0;
  const trustVectorValue = reputation ? reputation[1] : BigInt(0);
  const trustVector: TrustVector = parseTrustVector(trustVectorValue);
  const totalTransactions = txCount ? Number(txCount) : 0;
  const tier = getTier(score);
  
  // Calculate credit (1:1 with score for now)
  const creditLimit = score;
  const creditAvailable = Math.floor(score * 0.6); // Mock: 60% available

  // Calculate badges
  const lifetimeVolume = totalTransactions * 500; // Mock: avg $500 per tx
  const badges = calculateBadges(score, totalTransactions, lifetimeVolume, trustVector);

  // Mock transaction history
  const transactions = [
    {
      id: '1',
      type: 'completed' as const,
      description: 'Completed escrow',
      amount: '+$500',
      timeAgo: '2h',
    },
    {
      id: '2',
      type: 'rated' as const,
      description: 'Received 5★ rating',
      timeAgo: '1d',
    },
    {
      id: '3',
      type: 'completed' as const,
      description: 'Completed escrow',
      amount: '+$200',
      timeAgo: '3d',
    },
  ].slice(0, Math.min(5, totalTransactions));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          <AgentHeader
            address={address}
            name={agentName}
            registered={formatDate(Math.floor(Date.now() / 1000) - 30 * 86400)} // Mock: 30 days ago
            totalTransactions={totalTransactions}
          />
        </div>

        {/* Score Section */}
        <div className="mb-6">
          <ProfileScoreGauge
            score={score}
            tier={tier}
            creditLimit={creditLimit}
            creditAvailable={creditAvailable}
          />
        </div>

        {/* Score Analytics (Public) */}
        <div className="mb-6 grid md:grid-cols-2 gap-6">
          <ScoreHistory address={address} />
          <PeerComparison address={address} score={score} />
        </div>

        {/* Mutual Trust Relationship */}
        <div className="mb-6">
          <MutualTrust theirAddress={address} />
        </div>

        {/* Trust Breakdown */}
        <div className="mb-6">
          <TrustBreakdown trustVector={trustVector} />
        </div>

        {/* Transaction History */}
        <div className="mb-6">
          <TransactionHistory
            transactions={transactions}
            onViewAll={totalTransactions > 5 ? () => {
              // TODO: Navigate to full history page
              console.log('View all transactions');
            } : undefined}
          />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-6">
            <BadgeGrid badges={badges} />
          </div>
        )}

        {/* Share Buttons */}
        <div className="mb-6">
          <ShareButtons
            address={address}
            score={score}
            tier={tier}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-900 rounded-lg" />
      <div className="h-64 bg-gray-900 rounded-lg" />
      <div className="h-48 bg-gray-900 rounded-lg" />
      <div className="h-48 bg-gray-900 rounded-lg" />
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
}

function ErrorState({ title, message, actionLabel, onAction, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">🦞</div>
      <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
      <p className="text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
