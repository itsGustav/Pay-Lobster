import { auth } from '@/lib/auth';
import { linkWalletToUser } from '@/lib/user';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { RESTRICTED_CORS_HEADERS, CACHE_HEADERS } from '@/lib/cors';
import validator from 'validator';

export async function POST(request: NextRequest) {
  // Rate limiting: 10 req/min (auth operations should be more restrictive)
  const rateLimitResult = rateLimit(request, 'link-wallet', 10);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          ...RESTRICTED_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
        }
      }
    );
  }

  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { 
          status: 401,
          headers: {
            ...RESTRICTED_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: {
            ...RESTRICTED_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    const { walletAddress } = body;

    // Validate required field
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { 
          status: 400,
          headers: {
            ...RESTRICTED_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    // Validate address format and length (sanitize input)
    if (typeof walletAddress !== 'string' || walletAddress.length > 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { 
          status: 400,
          headers: {
            ...RESTRICTED_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    if (!validator.isEthereumAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { 
          status: 400,
          headers: {
            ...RESTRICTED_CORS_HEADERS,
            ...getRateLimitHeaders(rateLimitResult),
          }
        }
      );
    }

    // Normalize address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();

    // Link wallet to user
    await linkWalletToUser(session.user.id, normalizedAddress);

    // Log security event
    console.log('[Link Wallet API] Wallet linked:', {
      userId: session.user.id,
      walletAddress: normalizedAddress,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          ...RESTRICTED_CORS_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
          'Cache-Control': CACHE_HEADERS.NO_CACHE,
        },
      }
    );
  } catch (error) {
    // Log full error server-side
    console.error('[Link Wallet API] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check for known error types
    if (error instanceof Error && error.message.includes('already linked')) {
      return NextResponse.json(
        { error: 'This wallet is already linked to an account' },
        { 
          status: 400,
          headers: RESTRICTED_CORS_HEADERS,
        }
      );
    }

    // Return generic error to client (don't leak stack traces)
    return NextResponse.json(
      { error: 'An error occurred while linking wallet. Please try again later.' },
      { 
        status: 500,
        headers: RESTRICTED_CORS_HEADERS,
      }
    );
  }
}

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: RESTRICTED_CORS_HEADERS,
  });
}
