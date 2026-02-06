import { Card } from '@/components/ui/Card';

export default function WidgetDocPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-4">Embed Your LOBSTER Score</h1>
        <p className="text-gray-400 text-lg mb-8">
          Display your trust score on any website with our embeddable widget.
        </p>

        {/* Quick Start */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
          <p className="text-gray-300 mb-4">
            Add these two lines to any HTML page to display your LOBSTER score:
          </p>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-green-400">
{`<!-- Load the widget script -->
<script src="https://paylobster.com/widget.js"></script>

<!-- Add the widget element -->
<div data-lobster-score="YOUR_WALLET_ADDRESS"></div>`}
            </code>
          </pre>
        </Card>

        {/* Live Demo */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Live Demo</h2>
          <p className="text-gray-300 mb-4">
            Here's how the widget looks with different configurations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Compact */}
            <div>
              <h3 className="text-white font-medium mb-2 text-center">Compact</h3>
              <div className="flex justify-center">
                <div
                  style={{
                    background: '#111827',
                    border: '2px solid #1F2937',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    maxWidth: '200px',
                  }}
                >
                  <div style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>
                    🦞 LOBSTER
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    782
                  </div>
                  <div style={{ fontSize: '14px', color: '#FFD700', marginTop: '8px' }}>
                    ★ ELITE ★
                  </div>
                </div>
              </div>
            </div>

            {/* Standard */}
            <div>
              <h3 className="text-white font-medium mb-2 text-center">Standard</h3>
              <div className="flex justify-center">
                <div
                  style={{
                    background: '#111827',
                    border: '2px solid #1F2937',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    maxWidth: '280px',
                  }}
                >
                  <div style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '12px' }}>
                    🦞 LOBSTER Score
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
                    782
                  </div>
                  <div style={{ fontSize: '16px', color: '#FFD700', margin: '12px 0' }}>
                    ★ ELITE ★
                  </div>
                  <a
                    href="#"
                    style={{ color: '#3B82F6', fontSize: '14px', textDecoration: 'none' }}
                  >
                    Verify on Pay Lobster →
                  </a>
                </div>
              </div>
            </div>

            {/* Light theme */}
            <div>
              <h3 className="text-white font-medium mb-2 text-center">Light Theme</h3>
              <div className="flex justify-center">
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    maxWidth: '280px',
                  }}
                >
                  <div style={{ color: '#6B7280', fontSize: '16px', marginBottom: '12px' }}>
                    🦞 LOBSTER Score
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827' }}>
                    782
                  </div>
                  <div style={{ fontSize: '16px', color: '#FFD700', margin: '12px 0' }}>
                    ★ ELITE ★
                  </div>
                  <a
                    href="#"
                    style={{ color: '#3B82F6', fontSize: '14px', textDecoration: 'none' }}
                  >
                    Verify on Pay Lobster →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Options */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Customization Options</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-white py-2 px-4">Attribute</th>
                  <th className="text-white py-2 px-4">Values</th>
                  <th className="text-white py-2 px-4">Default</th>
                  <th className="text-white py-2 px-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="text-green-400 py-3 px-4 font-mono">data-lobster-score</td>
                  <td className="text-gray-300 py-3 px-4">0x...</td>
                  <td className="text-gray-500 py-3 px-4">-</td>
                  <td className="text-gray-300 py-3 px-4">Your wallet address (required)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="text-green-400 py-3 px-4 font-mono">data-theme</td>
                  <td className="text-gray-300 py-3 px-4">dark, light</td>
                  <td className="text-gray-500 py-3 px-4">dark</td>
                  <td className="text-gray-300 py-3 px-4">Color scheme</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="text-green-400 py-3 px-4 font-mono">data-size</td>
                  <td className="text-gray-300 py-3 px-4">compact, standard, full</td>
                  <td className="text-gray-500 py-3 px-4">standard</td>
                  <td className="text-gray-300 py-3 px-4">Widget size</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="text-green-400 py-3 px-4 font-mono">data-show-link</td>
                  <td className="text-gray-300 py-3 px-4">true, false</td>
                  <td className="text-gray-500 py-3 px-4">true</td>
                  <td className="text-gray-300 py-3 px-4">Show verification link</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Examples */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Code Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-2">Compact Dark Widget</h3>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">
{`<div 
  data-lobster-score="0x1234...5678"
  data-size="compact"
  data-theme="dark"
></div>`}
                </code>
              </pre>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">Full Widget with Stats</h3>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">
{`<div 
  data-lobster-score="0x1234...5678"
  data-size="full"
  data-theme="dark"
></div>`}
                </code>
              </pre>
            </div>

            <div>
              <h3 className="text-white font-medium mb-2">Light Theme Without Link</h3>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">
{`<div 
  data-lobster-score="0x1234...5678"
  data-theme="light"
  data-show-link="false"
></div>`}
                </code>
              </pre>
            </div>
          </div>
        </Card>

        {/* API Badge */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">API Badge (Advanced)</h2>
          <p className="text-gray-300 mb-4">
            You can also fetch badge data programmatically:
          </p>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm mb-4">
            <code className="text-green-400">
{`GET https://paylobster.com/api/badge/0x1234...5678?format=json

Response:
{
  "address": "0x1234...5678",
  "score": 782,
  "tier": "ELITE",
  "transactions": 47,
  "registered": "2026-01-15T..."
}`}
            </code>
          </pre>

          <p className="text-gray-300 mb-2">Or get an SVG badge:</p>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-green-400">
{`<img src="https://paylobster.com/api/badge/0x1234...5678?format=svg" alt="LOBSTER Score" />`}
            </code>
          </pre>
        </Card>

        {/* Trust Check API */}
        <Card>
          <h2 className="text-2xl font-semibold text-white mb-4">Trust Check API</h2>
          <p className="text-gray-300 mb-4">
            Get trust alerts and recommendations before transacting:
          </p>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-green-400">
{`GET https://paylobster.com/api/trust-check/0x1234...5678

Response:
{
  "address": "0x1234...5678",
  "score": 782,
  "alerts": [
    {
      "type": "all_clear",
      "severity": "info",
      "message": "No concerns detected"
    }
  ],
  "recommendation": "safe"
}`}
            </code>
          </pre>

          <div className="mt-4 space-y-2">
            <p className="text-white font-medium">Recommendation Values:</p>
            <ul className="text-gray-300 space-y-1 list-disc list-inside">
              <li><code className="text-green-400">safe</code> - No concerns detected</li>
              <li><code className="text-yellow-400">proceed_with_caution</code> - Minor warnings present</li>
              <li><code className="text-red-400">high_risk</code> - Significant concerns detected</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
