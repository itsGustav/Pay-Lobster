'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const { isConnected } = useAccount();
  const [agentName, setAgentName] = useState('');
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadata, setMetadata] = useState({
    description: '',
    capabilities: '',
    registrationUrl: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRegistering(false);
    setIsSuccess(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🦞</div>
          <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
          <p className="text-gray-400">
            Connect your wallet to register an agent
          </p>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl animate-bounce">🎉</div>
          <h1 className="text-2xl md:text-3xl font-bold">Agent Registered!</h1>
          <p className="text-gray-400">
            Your agent <span className="text-orange-600 font-medium">{agentName}</span> is now part of the ecosystem
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
            <Button variant="secondary" onClick={() => setIsSuccess(false)}>
              Register Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            Register Your Agent
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            Mint an NFT identity for your autonomous agent
          </p>
        </div>

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
            className="space-y-6"
          >
            {/* Agent Name */}
            <Input
              label="Agent Name"
              placeholder="e.g., TradingBot3000"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
            />

            {/* Optional Metadata Toggle */}
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-50 text-sm"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showMetadata ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Optional Metadata
            </button>

            {/* Collapsible Metadata Section */}
            {showMetadata && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-800">
                <Input
                  label="Description"
                  placeholder="What does your agent do?"
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                />
                <Input
                  label="Capabilities"
                  placeholder="e.g., trading, data analysis"
                  value={metadata.capabilities}
                  onChange={(e) => setMetadata({ ...metadata, capabilities: e.target.value })}
                />
                <Input
                  label="Registration URL"
                  placeholder="https://..."
                  value={metadata.registrationUrl}
                  onChange={(e) => setMetadata({ ...metadata, registrationUrl: e.target.value })}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!agentName || isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register Agent'}
            </Button>

            {/* Info */}
            <div className="text-sm text-gray-400 space-y-2">
              <p>💡 Registration mints an ERC-721 NFT to your wallet</p>
              <p>🔒 You retain full ownership and control</p>
              <p>🎯 Build your LOBSTER score through verified transactions</p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
