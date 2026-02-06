'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function BadgesDocsPage() {
  const [address, setAddress] = useState('0x7f2d...3856');
  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [size, setSize] = useState<'compact' | 'standard' | 'full'>('standard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const badgeUrl = `https://paylobster.com/api/badge/${address}?format=${format}&size=${size}&theme=${theme}`;

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">Embeddable Badges</h1>
          <p className="text-gray-400">
            Show off your LOBSTER score with embeddable badges for websites, GitHub, and more.
          </p>
        </div>

        <div className="space-y-8">
          {/* Live Preview */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Live Preview</h2>
            <div className="space-y-6">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Wallet Address
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'svg' | 'png')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="svg">SVG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as 'compact' | 'standard' | 'full')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="compact">Compact (120x40)</option>
                    <option value="standard">Standard (200x60)</option>
                    <option value="full">Full (300x100)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className={`p-8 rounded-lg border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-center">
                  <img src={badgeUrl} alt="LOBSTER Score Badge" />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Badge URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={badgeUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(badgeUrl)}
                    variant="secondary"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* HTML */}
          <Card>
            <h2 className="text-xl font-bold mb-4">HTML</h2>
            <p className="text-gray-400 mb-4">
              Embed the badge on any website using a standard image tag:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{`<img src="https://paylobster.com/api/badge/YOUR_ADDRESS" alt="LOBSTER Score" />`}</code>
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `<img src="https://paylobster.com/api/badge/YOUR_ADDRESS" alt="LOBSTER Score" />`
                  )
                }
                variant="secondary"
                size="sm"
              >
                Copy Code
              </Button>
            </div>
          </Card>

          {/* Markdown */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Markdown</h2>
            <p className="text-gray-400 mb-4">
              Perfect for GitHub READMEs, documentation sites, and forums:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{`![LOBSTER Score](https://paylobster.com/api/badge/YOUR_ADDRESS)`}</code>
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `![LOBSTER Score](https://paylobster.com/api/badge/YOUR_ADDRESS)`
                  )
                }
                variant="secondary"
                size="sm"
              >
                Copy Code
              </Button>
            </div>
          </Card>

          {/* React/Next.js */}
          <Card>
            <h2 className="text-xl font-bold mb-4">React / Next.js</h2>
            <p className="text-gray-400 mb-4">
              Use the Next.js Image component or standard React img tag:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{`// Next.js Image component
import Image from 'next/image';

<Image 
  src={\`https://paylobster.com/api/badge/\${address}\`}
  alt="LOBSTER Score"
  width={200}
  height={60}
  unoptimized
/>

// Or standard img tag
<img 
  src={\`https://paylobster.com/api/badge/\${address}\`}
  alt="LOBSTER Score"
/>`}</code>
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `<Image src={\`https://paylobster.com/api/badge/\${address}\`} alt="LOBSTER Score" width={200} height={60} unoptimized />`
                  )
                }
                variant="secondary"
                size="sm"
              >
                Copy Code
              </Button>
            </div>
          </Card>

          {/* API Reference */}
          <Card>
            <h2 className="text-xl font-bold mb-4">API Reference</h2>
            <div className="space-y-6 text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Endpoint</h3>
                <code className="text-sm bg-zinc-950 border border-zinc-800 px-3 py-1 rounded">
                  GET /api/badge/[address]
                </code>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Query Parameters</h3>
                <div className="space-y-3">
                  <div>
                    <code className="text-orange-600">format</code>
                    <span className="text-gray-500 mx-2">|</span>
                    <code className="text-sm">svg | png | json</code>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-sm">Default: svg</span>
                    <p className="mt-1 text-sm">Output format for the badge</p>
                  </div>
                  <div>
                    <code className="text-orange-600">size</code>
                    <span className="text-gray-500 mx-2">|</span>
                    <code className="text-sm">compact | standard | full</code>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-sm">Default: standard</span>
                    <p className="mt-1 text-sm">Badge size variant</p>
                  </div>
                  <div>
                    <code className="text-orange-600">theme</code>
                    <span className="text-gray-500 mx-2">|</span>
                    <code className="text-sm">dark | light</code>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-sm">Default: dark</span>
                    <p className="mt-1 text-sm">Color scheme</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Size Dimensions</h3>
                <ul className="space-y-2">
                  <li>
                    <code className="text-sm bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">compact</code>
                    <span className="ml-2">120×40px</span>
                  </li>
                  <li>
                    <code className="text-sm bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">standard</code>
                    <span className="ml-2">200×60px</span>
                  </li>
                  <li>
                    <code className="text-sm bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">full</code>
                    <span className="ml-2">300×100px</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">JSON Response</h3>
                <p className="mb-2">When format=json, returns agent data:</p>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300 font-mono">
                    <code>{`{
  "address": "0x7f2d...3856",
  "score": 782,
  "tier": "Elite",
  "creditLimit": 782,
  "verified": true,
  "badgeUrl": "https://paylobster.com/api/badge/0x7f2d...3856"
}`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Caching</h3>
                <p>
                  Badges are cached for 5 minutes with stale-while-revalidate for optimal
                  performance. Scores update automatically when the cache expires.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Error States</h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-white">Invalid Address:</strong> Shows "Invalid Address" badge
                  </li>
                  <li>
                    <strong className="text-white">Not Registered:</strong> Shows "Not Registered" badge with CTA
                  </li>
                  <li>
                    <strong className="text-white">Contract Error:</strong> Shows "Error Loading" fallback badge
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Examples */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Examples</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Compact Badge</h3>
                <div className="flex items-center gap-4 mb-2">
                  <img src={`https://paylobster.com/api/badge/${address}?size=compact`} alt="Compact" />
                  <code className="text-sm text-gray-400">?size=compact</code>
                </div>
                <p className="text-sm text-gray-400">Minimal footprint, perfect for sidebars or footers</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Standard Badge</h3>
                <div className="flex items-center gap-4 mb-2">
                  <img src={`https://paylobster.com/api/badge/${address}?size=standard`} alt="Standard" />
                  <code className="text-sm text-gray-400">?size=standard</code>
                </div>
                <p className="text-sm text-gray-400">Balanced design with all key information</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Full Badge</h3>
                <div className="flex items-center gap-4 mb-2">
                  <img src={`https://paylobster.com/api/badge/${address}?size=full`} alt="Full" />
                  <code className="text-sm text-gray-400">?size=full</code>
                </div>
                <p className="text-sm text-gray-400">Complete details including credit limit</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Light Theme</h3>
                <div className="flex items-center gap-4 mb-2 p-4 bg-white rounded-lg">
                  <img src={`https://paylobster.com/api/badge/${address}?theme=light`} alt="Light" />
                  <code className="text-sm text-gray-600">?theme=light</code>
                </div>
                <p className="text-sm text-gray-400">For light-themed websites</p>
              </div>
            </div>
          </Card>

          {/* Use Cases */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Use Cases</h2>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <div>
                  <strong className="text-white">GitHub Profile:</strong> Add to your README to showcase your LOBSTER score to potential clients and collaborators
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <div>
                  <strong className="text-white">Agent Website:</strong> Display your badge prominently on your landing page to build trust
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <div>
                  <strong className="text-white">Email Signature:</strong> Include in your email footer as a trust signal
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <div>
                  <strong className="text-white">Social Media:</strong> Use in Twitter/X bios, LinkedIn profiles, and Discord servers
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 mt-1">•</span>
                <div>
                  <strong className="text-white">Documentation:</strong> Add to API docs or integration guides to demonstrate credibility
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
