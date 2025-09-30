// Authentication middleware

import { NextRequest } from 'next/server';
import { verifyAccessToken, JWTPayload } from '@/lib/auth/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Extract and verify JWT token from request
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Extracted token from Authorization header:', token.substring(0, 20) + '...');
    return token;
  }

  // Fallback to cookie (though access tokens should typically be in headers)
  const tokenCookie = request.cookies.get('access_token')?.value;
  if (tokenCookie) {
    console.log('Extracted token from cookie:', tokenCookie.substring(0, 20) + '...');
    return tokenCookie;
  }

  console.log('No token found in request');
  return null;
}

/**
 * Authenticate request and return user payload
 */
export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

/**
 * Middleware wrapper for protected routes
 */
export function requireAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = authenticateRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, user);
  };
}

/**
 * Optional auth middleware - continues even if not authenticated
 */
export function optionalAuth(
  handler: (request: NextRequest, user?: JWTPayload) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const user = authenticateRequest(request);
    return handler(request, user || undefined);
  };
}

/**
 * Plan enforcement middleware
 */
export function requirePlan(
  allowedPlans: string[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<Response>
) {
  return requireAuth(async (request: NextRequest, user: JWTPayload) => {
    if (!allowedPlans.includes(user.plan)) {
      return new Response(
        JSON.stringify({ 
          error: 'Plan upgrade required',
          requires_upgrade: true,
          current_plan: user.plan,
          allowed_plans: allowedPlans
        }),
        { 
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, user);
  });
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  handler: (request: NextRequest, user?: JWTPayload) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const key = ip;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { 
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
            }
          }
        );
      }
    }

    const user = authenticateRequest(request);
    return handler(request, user || undefined);
  };
}
