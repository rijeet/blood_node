// Rate limiting service for Blood Node
import { NextRequest } from 'next/server';
import { RateLimit, RATE_LIMITS } from '@/lib/models/security';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimit>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimit>;

  constructor() {
    this.store = rateLimitStore;
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is within rate limits
   */
  async checkRateLimit(
    key: string,
    endpoint: string,
    limitType: keyof typeof RATE_LIMITS
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[limitType];
    const fullKey = `${config.key_prefix}:${key}:${endpoint}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.window * 1000);

    // Get existing rate limit record
    const existing = this.store.get(fullKey);

    if (!existing || existing.window_start < windowStart) {
      // Create new rate limit record
      const newRecord: RateLimit = {
        key,
        endpoint,
        attempts: 1,
        window_start: now,
        expires_at: new Date(now.getTime() + config.window * 1000),
        created_at: now
      };
      this.store.set(fullKey, newRecord);

      return {
        allowed: true,
        remaining: config.requests - 1,
        resetTime: newRecord.expires_at.getTime()
      };
    }

    // Check if limit exceeded
    if (existing.attempts >= config.requests) {
      const retryAfter = Math.ceil((existing.expires_at.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.expires_at.getTime(),
        retryAfter
      };
    }

    // Increment attempts
    existing.attempts += 1;
    this.store.set(fullKey, existing);

    return {
      allowed: true,
      remaining: config.requests - existing.attempts,
      resetTime: existing.expires_at.getTime()
    };
  }

  /**
   * Get client IP address from request
   */
  getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return 'unknown';
  }

  /**
   * Generate rate limit key
   */
  generateKey(request: NextRequest, userId?: string): string {
    const ip = this.getClientIP(request);
    return userId ? `${userId}:${ip}` : ip;
  }

  /**
   * Clean up expired rate limit records
   */
  cleanup(): void {
    const now = new Date();
    for (const [key, record] of this.store.entries()) {
      if (record.expires_at < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get rate limit status for a key
   */
  getStatus(key: string, endpoint: string, limitType: keyof typeof RATE_LIMITS): RateLimitResult | null {
    const config = RATE_LIMITS[limitType];
    const fullKey = `${config.key_prefix}:${key}:${endpoint}`;
    const record = this.store.get(fullKey);

    if (!record) {
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + config.window * 1000
      };
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.window * 1000);

    if (record.window_start < windowStart) {
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + config.window * 1000
      };
    }

    return {
      allowed: record.attempts < config.requests,
      remaining: Math.max(0, config.requests - record.attempts),
      resetTime: record.expires_at.getTime(),
      retryAfter: record.attempts >= config.requests ? 
        Math.ceil((record.expires_at.getTime() - now.getTime()) / 1000) : undefined
    };
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(limitType: keyof typeof RATE_LIMITS) {
  return async (request: NextRequest, userId?: string) => {
    const rateLimiter = RateLimiter.getInstance();
    const key = rateLimiter.generateKey(request, userId);
    const endpoint = new URL(request.url).pathname;
    
    return await rateLimiter.checkRateLimit(key, endpoint, limitType);
  };
}

/**
 * Express rate limiting headers
 */
export function setRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return response;
}

/**
 * Cleanup expired records (run periodically)
 */
export function startRateLimitCleanup(): void {
  setInterval(() => {
    RateLimiter.getInstance().cleanup();
  }, 60000); // Clean up every minute
}
