'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getBaseScanUrl } from '@/lib/contracts';
import type { Address } from 'viem';

interface AgentHeaderProps {
  address: Address;
  name?: string;
  registered?: string;
  totalTransactions?: number;
}

export function AgentHeader({ 
  address, 
  name, 
  registered,
  totalTransactions = 0 
}: AgentHeaderProps) {
  const [copied, setCopied] = useState(false);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8 space-y-4">
      {/* Agent Name */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {name || 'Unnamed Agent'}
        </h1>
      </div>

      {/* Address with Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-gray-400 text-sm md:text-base bg-gray-950 px-3 py-1.5 rounded border border-gray-800">
          {shortAddress}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-xs"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </Button>
        <a
          href={getBaseScanUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm" className="text-xs">
            BaseScan ↗
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        {registered && (
          <div>
            <div className="text-gray-500 text-sm">Registered</div>
            <div className="text-white font-medium">{registered}</div>
          </div>
        )}
        <div>
          <div className="text-gray-500 text-sm">Total Transactions</div>
          <div className="text-white font-medium">{totalTransactions}</div>
        </div>
      </div>
    </div>
  );
}
