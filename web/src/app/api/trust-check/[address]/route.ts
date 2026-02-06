import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { CONTRACTS, REPUTATION_ABI, IDENTITY_ABI, ESCROW_ABI, CREDIT_ABI } from '@/lib/contracts';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { PUBLIC_CORS_HEADERS, CACHE_HEADERS } from '@/lib/cors';
import validator from 'validator';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface Alert {
  type: 'score_drop' | 'active_dispute' | 'credit_default' | 'new_agent' | 'low_volume' | 'all_clear';
  severity: 'info' | 'warning' | 'high';
  message: string;
  data?: Record<string, any>;
}

interface TrustCheckResponse {
  address: string;
  score: number;
  alerts: Alert[];
  recommendation: 'safe' | 'proceed_with_caution' | 'high_risk';
}

function getRecommendation(alerts: Alert[]): 'safe' | 'proceed_with_caution' | 'high_risk' {
  const hasHighSeverity = alerts.some(a => a.severity === 'high');
  const hasWarnings = alerts.some(a => a.severity === 'warning');
  
  if (hasHighSeverity) return 'high_risk';
  if (hasWarnings) return 'proceed_with_caution';
  return 'safe';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  // Rate limiting: 60 req/min
  const rateLimitResult = rateLimit(request, 'trust-check', 60);
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
    const alerts: Alert[] = [];
    const currentBlock = await publicClient.getBlockNumber();
    const oneWeekAgo = currentBlock - BigInt(50400); // ~7 days on Base (2s blocks)

    // 1. Fetch current reputation score
    const reputation = await publicClient.readContract({
      address: CONTRACTS.REPUTATION,
      abi: REPUTATION_ABI,
      functionName: 'getReputation',
      args: [walletAddress],
    });
    const currentScore = Number(reputation[0]);

    // 2. Check for recent score drops
    try {
      const scoreUpdateLogs = await publicClient.getLogs({
        address: CONTRACTS.CREDIT,
        event: {
          type: 'event',
          name: 'ScoreUpdated',
          inputs: [
            { indexed: true, name: 'agent', type: 'address' },
            { indexed: false, name: 'oldScore', type: 'uint256' },
            { indexed: false, name: 'newScore', type: 'uint256' },
            { indexed: false, name: 'reason', type: 'string' },
          ],
        },
        args: {
          agent: walletAddress,
        },
        fromBlock: oneWeekAgo,
        toBlock: 'latest',
      });

      if (scoreUpdateLogs.length > 0) {
        const oldestLog = scoreUpdateLogs[0];
        const oldScore = Number(oldestLog.args.oldScore);
        const drop = oldScore - currentScore;

        if (drop >= 50) {
          alerts.push({
            type: 'score_drop',
            severity: drop >= 100 ? 'high' : 'warning',
            message: `Score dropped ${drop} points in last 7 days`,
            data: {
              from: oldScore,
              to: currentScore,
              days: 7,
            },
          });
        }
      }
    } catch (err) {
      console.error('[Trust Check API] Error checking score history:', {
        address: walletAddress,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 3. Check if agent is newly registered
    try {
      const agentInfo = await publicClient.readContract({
        address: CONTRACTS.IDENTITY,
        abi: IDENTITY_ABI,
        functionName: 'getAgentInfo',
        args: [walletAddress],
      });

      if (agentInfo[2]) { // is registered
        const registrationLogs = await publicClient.getLogs({
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
          fromBlock: oneWeekAgo,
          toBlock: 'latest',
        });

        if (registrationLogs.length > 0) {
          alerts.push({
            type: 'new_agent',
            severity: 'info',
            message: 'Registered less than 7 days ago',
            data: {
              blockNumber: registrationLogs[0].blockNumber.toString(),
            },
          });
        }
      }
    } catch (err) {
      console.error('[Trust Check API] Error checking registration:', {
        address: walletAddress,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 4. Check transaction volume
    try {
      const txCount = await publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'getUserTransactionCount',
        args: [walletAddress],
      });

      const transactionCount = Number(txCount);

      if (transactionCount === 0) {
        alerts.push({
          type: 'low_volume',
          severity: 'warning',
          message: 'No transaction history',
          data: {
            transactions: 0,
          },
        });
      } else if (transactionCount < 3) {
        alerts.push({
          type: 'low_volume',
          severity: 'info',
          message: 'Limited transaction history',
          data: {
            transactions: transactionCount,
          },
        });
      }
    } catch (err) {
      console.error('[Trust Check API] Error checking transaction count:', {
        address: walletAddress,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // 5. Check for active disputes (TODO: implement when dispute contract is available)
    // This would query a Dispute contract for any open disputes
    // For now, we'll skip this check

    // If no alerts, add an all-clear
    if (alerts.length === 0) {
      alerts.push({
        type: 'all_clear',
        severity: 'info',
        message: 'No concerns detected',
      });
    }

    const response: TrustCheckResponse = {
      address: walletAddress,
      score: currentScore,
      alerts,
      recommendation: getRecommendation(alerts),
    };

    return NextResponse.json(response, {
      headers: {
        ...PUBLIC_CORS_HEADERS,
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': CACHE_HEADERS.SHORT,
      },
    });
  } catch (error) {
    // Log full error server-side
    console.error('[Trust Check API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error to client (don't leak stack traces)
    return NextResponse.json(
      { error: 'An error occurred while performing trust check. Please try again later.' },
      { 
        status: 500,
        headers: PUBLIC_CORS_HEADERS,
      }
    );
  }
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: PUBLIC_CORS_HEADERS,
  });
}
