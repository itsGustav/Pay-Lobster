import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  max: number;
  ttl: number; // milliseconds
}

const rateLimiters = new Map<string, LRUCache<string, number>>();

function getRateLimiter(route: string, config: RateLimitConfig): LRUCache<string, number> {
  if (!rateLimiters.has(route)) {
    rateLimiters.set(route, new LRUCache({
      max: config.max,
      ttl: config.ttl,
    }));
  }
  return rateLimiters.get(route)!;
}

export function rateLimit(
  request: NextRequest,
  route: string,
  limit: number = 60
): { success: boolean; remaining: number; limit: number } {
  // Get IP from request headers
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';

  const limiter = getRateLimiter(route, {
    max: 500,
    ttl: 60 * 1000, // 1 minute
  });

  const key = `${route}:${ip}`;
  const count = (limiter.get(key) as number) || 0;
  
  if (count >= limit) {
    return { 
      success: false, 
      remaining: 0,
      limit 
    };
  }
  
  limiter.set(key, count + 1);
  
  return { 
    success: true, 
    remaining: limit - count - 1,
    limit
  };
}

export function getRateLimitHeaders(result: { remaining: number; limit: number }): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
  };
}
