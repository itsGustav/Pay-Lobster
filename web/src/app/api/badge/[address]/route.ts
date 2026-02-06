import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { CONTRACTS, REPUTATION_ABI, IDENTITY_ABI, ESCROW_ABI } from '@/lib/contracts';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { PUBLIC_CORS_HEADERS, CACHE_HEADERS } from '@/lib/cors';
import validator from 'validator';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface BadgeData {
  address: string;
  score: number;
  tier: string;
  transactions?: number;
  registered?: string;
}

function getTier(score: number): string {
  if (score >= 750) return 'ELITE';
  if (score >= 500) return 'TRUSTED';
  if (score >= 250) return 'EMERGING';
  return 'NEW';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  // Rate limiting: 100 req/min
  const rateLimitResult = rateLimit(request, 'badge', 100);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          ...PUBLIC_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
        }
      }
    );
  }

  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Validate format parameter
    if (!['json', 'svg'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format parameter. Use json or svg.' },
        { 
          status: 400,
          headers: {
            ...PUBLIC_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    // Validate address (sanitize input)
    if (!validator.isEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { 
          status: 400,
          headers: {
            ...PUBLIC_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    const walletAddress = address.toLowerCase() as Address;

    // Fetch reputation score
    const reputation = await publicClient.readContract({
      address: CONTRACTS.REPUTATION,
      abi: REPUTATION_ABI,
      functionName: 'getReputation',
      args: [walletAddress],
    });

    const score = Number(reputation[0]);
    const tier = getTier(score);

    // Optionally fetch additional data
    let transactions: number | undefined;
    let registered: string | undefined;

    try {
      // Check if agent is registered
      const agentInfo = await publicClient.readContract({
        address: CONTRACTS.IDENTITY,
        abi: IDENTITY_ABI,
        functionName: 'getAgentInfo',
        args: [walletAddress],
      });

      if (agentInfo[2]) { // registered = true
        // Get transaction count
        const txCount = await publicClient.readContract({
          address: CONTRACTS.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'getUserTransactionCount',
          args: [walletAddress],
        });
        transactions = Number(txCount);

        // Try to get registration date from events (optional)
        try {
          const logs = await publicClient.getLogs({
            address: CONTRACTS.IDENTITY,
            event: {
              type: 'event',
              name: 'AgentRegistered',
              inputs: [
                { indexed: true, name: 'agent', type: 'address' },
                { indexed: true, name: 'tokenId', type: 'uint256' },
                { indexed: false, name: 'name', type: 'string' },
              ],
            },
            args: {
              agent: walletAddress,
            },
            fromBlock: 'earliest',
            toBlock: 'latest',
          });

          if (logs.length > 0) {
            const block = await publicClient.getBlock({
              blockNumber: logs[0].blockNumber,
            });
            registered = new Date(Number(block.timestamp) * 1000).toISOString();
          }
        } catch (err) {
          // Log error but don't fail the request
          console.error('[Badge API] Error fetching registration date:', {
            address: walletAddress,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
    } catch (err) {
      // Log error but don't fail the request
      console.error('[Badge API] Error fetching extended data:', {
        address: walletAddress,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    const badgeData: BadgeData = {
      address: walletAddress,
      score,
      tier,
      transactions,
      registered,
    };

    if (format === 'json') {
      return NextResponse.json(badgeData, {
        headers: {
          ...PUBLIC_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
          'Cache-Control': CACHE_HEADERS.SHORT,
        },
      });
    }

    // SVG badge format
    if (format === 'svg') {
      const svg = generateSVGBadge(badgeData);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          ...PUBLIC_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
          'Cache-Control': CACHE_HEADERS.LONG,
        },
      });
    }

    // This should never be reached due to validation above
    return NextResponse.json(
      { error: 'Invalid format. Use json or svg.' },
      { 
        status: 400,
        headers: {
          ...PUBLIC_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
        }
      }
    );
  } catch (error) {
    // Log full error server-side
    console.error('[Badge API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error to client (don't leak stack traces)
    return NextResponse.json(
      { error: 'An error occurred while fetching badge data. Please try again later.' },
      { 
        status: 500,
        headers: PUBLIC_CORS_HEADERS,
      }
    );
  }
}

function generateSVGBadge(data: BadgeData): string {
  const tierColors: Record<string, string> = {
    ELITE: '#FFD700',
    TRUSTED: '#4CAF50',
    EMERGING: '#2196F3',
    NEW: '#9E9E9E',
  };

  const color = tierColors[data.tier] || tierColors.NEW;

  // Sanitize data for SVG (prevent XSS)
  const sanitizedScore = Math.max(0, Math.min(9999, data.score)); // Clamp to valid range
  const sanitizedTier = validator.escape(data.tier);

  return `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="80" fill="#111827" rx="8"/>
      <text x="100" y="25" font-family="Arial, sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle">
        🦞 LOBSTER Score
      </text>
      <text x="100" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
        ${sanitizedScore}
      </text>
      <text x="100" y="70" font-family="Arial, sans-serif" font-size="10" fill="${color}" text-anchor="middle">
        ${sanitizedTier}
      </text>
    </svg>
  `.trim();
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: PUBLIC_CORS_HEADERS,
  });
}
