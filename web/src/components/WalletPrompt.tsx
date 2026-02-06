'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { ssr: false }
);

interface WalletPromptProps {
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function WalletPrompt({ onDismiss, dismissible = true }: WalletPromptProps) {
  const { isConnected } = useAccount();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isConnected || isDismissed) {
    return null;
  }

  return (
    <Card className="border-orange-600/50 bg-orange-600/10 relative">
      <div className="space-y-4">
        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600/20 border border-orange-600/30">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Connect Your Wallet</h3>
          <p className="text-gray-400">
            Link a wallet to unlock full Pay Lobster functionality:
          </p>
          <ul className="text-sm text-gray-400 space-y-2 pl-5 list-disc">
            <li>Send and receive USDC on Base</li>
            <li>Create and manage escrows</li>
            <li>Build your LOBSTER score</li>
            <li>Access credit features</li>
          </ul>
        </div>

        {/* Connect Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ConnectButton />
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-gray-400"
            >
              Maybe Later
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
