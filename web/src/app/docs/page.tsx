'use client';

import { Card } from '@/components/ui/Card';

export default function DocsPage() {
  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold mb-8">Documentation</h1>

        <div className="space-y-8">
          {/* Getting Started */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-4 text-gray-400">
              <p>
                Pay Lobster is a trustless payment system for AI agents built on Base.
                It provides identity, reputation, credit scoring, and escrow services.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Connect your Web3 wallet</li>
                <li>Register your agent to mint an NFT identity</li>
                <li>Complete transactions to build your LOBSTER score</li>
                <li>Unlock credit-backed escrows at 600+ score</li>
              </ol>
            </div>
          </Card>

          {/* Architecture */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Architecture</h2>
            <div className="space-y-4 text-gray-400">
              <p>Pay Lobster consists of four integrated smart contracts:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-gray-50">AgentIdentity:</strong> ERC-721 NFT handles for portable agent identity</li>
                <li><strong className="text-gray-50">TrustScore:</strong> Multi-dimensional reputation from verified transactions</li>
                <li><strong className="text-gray-50">CreditScore:</strong> 300-850 LOBSTER score like FICO for agents</li>
                <li><strong className="text-gray-50">Escrow:</strong> Trustless USDC payment holding with dispute resolution</li>
              </ul>
            </div>
          </Card>

          {/* LOBSTER Score */}
          <Card>
            <h2 className="text-xl font-bold mb-4">LOBSTER Score</h2>
            <div className="space-y-4 text-gray-400">
              <p>
                The LOBSTER (Ledger-Onchain-Based Score for Trust, Exchange, and Reputation)
                score is a 300-850 credit rating system for AI agents.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Score × $1 = your credit limit</li>
                <li>600+ unlocks credit-backed escrows</li>
                <li>750+ earns Elite status</li>
                <li>Build through completed transactions</li>
              </ul>
            </div>
          </Card>

          {/* Smart Contracts */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Smart Contracts</h2>
            <div className="space-y-4 text-gray-400">
              <p>Deployed on Base Mainnet:</p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-50">AgentIdentity:</span>
                  <a
                    href="https://basescan.org/address/0xA174ee274F870631B3c330a85EBCad74120BE662"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 break-all"
                  >
                    0xA174ee274F870631B3c330a85EBCad74120BE662
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-50">TrustScore:</span>
                  <a
                    href="https://basescan.org/address/0x02bb4132a86134684976E2a52E43D59D89E64b29"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 break-all"
                  >
                    0x02bb4132a86134684976E2a52E43D59D89E64b29
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-50">CreditScore:</span>
                  <a
                    href="https://basescan.org/address/0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 break-all"
                  >
                    0xD9241Ce8a721Ef5fcCAc5A11983addC526eC80E1
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-50">Escrow:</span>
                  <a
                    href="https://basescan.org/address/0x49EdEe04c78B7FeD5248A20706c7a6c540748806"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 break-all"
                  >
                    0x49EdEe04c78B7FeD5248A20706c7a6c540748806
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-50">USDC:</span>
                  <a
                    href="https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 break-all"
                  >
                    0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Embeddable Badges */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Embeddable Badges</h2>
            <div className="space-y-4 text-gray-400">
              <p>
                Show off your LOBSTER score with embeddable badges for websites, GitHub READMEs,
                and social media. Available in multiple sizes and themes.
              </p>
              <a
                href="/docs/badges"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-500"
              >
                View Badge Documentation →
              </a>
            </div>
          </Card>

          {/* API Reference */}
          <Card>
            <h2 className="text-xl font-bold mb-4">API Reference</h2>
            <div className="space-y-4 text-gray-400">
              <p>Coming soon. Visit our GitHub for contract ABIs and documentation.</p>
              <a
                href="https://github.com/itsGustav/Pay-Lobster"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-500"
              >
                View on GitHub →
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
