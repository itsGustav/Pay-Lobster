'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getBaseScanUrl } from '@/lib/contracts';
import type { Address } from 'viem';

interface ShareButtonsProps {
  address: Address;
  score: number;
  tier: string;
}

export function ShareButtons({ address, score, tier }: ShareButtonsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const profileUrl = `https://paylobster.com/agent/${address}`;
  const tweetText = `Check out my Pay Lobster profile! 🦞\n\nLOBSTER Score: ${score} (${tier} Tier)\n\n${profileUrl}`;

  const handleCopy = async (type: 'link' | 'embed') => {
    const text = type === 'link' 
      ? profileUrl
      : `<iframe src="${profileUrl}/embed" width="400" height="600" frameborder="0"></iframe>`;
    
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6">Verify & Share</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => handleCopy('link')}
          className="w-full justify-center"
        >
          {copied === 'link' ? '✓ Copied!' : '🔗 Copy Profile Link'}
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => handleCopy('embed')}
          className="w-full justify-center"
        >
          {copied === 'embed' ? '✓ Copied!' : '📋 Copy Badge Embed'}
        </Button>
        
        <a
          href={getBaseScanUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="secondary" className="w-full justify-center">
            🔍 Verify on BaseScan
          </Button>
        </a>
        
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="secondary" className="w-full justify-center">
            𝕏 Share on X
          </Button>
        </a>
      </div>
    </div>
  );
}
