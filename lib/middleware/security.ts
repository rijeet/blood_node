// Security middleware for Blood Node
import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, createRateLimitMiddleware } from '@/lib/services/rate-limiting';
import { LoginAttemptLimiter } from '@/lib/services/login-attempts';
import { CaptchaService } from '@/lib/services/captcha';
import { IPBlacklistService } from '@/lib/services/ip-blacklist';
import { SessionSecurityService } from '@/lib/services/session-security';
import { AdminAlertService } from '@/lib/services/admin-alerts';
import { SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '@/lib/models/security';
import { ObjectId } from 'mongodb';

export interface SecurityContext {
  ip_address: string;
  user_agent: string;
  user_id?: string;
  email?: string;
  device_fingerprint?: string;
}

export class SecurityMiddleware {
  private rateLimiter: RateLimiter;
  private loginLimiter: LoginAttemptLimiter;
  private captchaService: CaptchaService;
  private ipBlacklistService: IPBlacklistService;
  private sessionSecurityService: SessionSecurityService;
  private adminAlertService: AdminAlertService;

  constructor() {
    this.rateLimiter = RateLimiter.getInstance();
    this.loginLimiter = LoginAttemptLimiter.getInstance();
    this.captchaService = CaptchaService.getInstance();
    this.ipBlacklistService = IPBlacklistService.getInstance();
    this.sessionSecurityService = SessionSecurityService.getInstance();
    this.adminAlertService = AdminAlertService.getInstance();
  }

  /**
   * Extract security context from request
   */
  extractContext(request: NextRequest, user_id?: string, email?: string): SecurityContext {
    const ip_address = this.rateLimiter.getClientIP(request);
    const user_agent = request.headers.get('user-agent') || 'unknown';
    
    return {
      ip_address,
      user_agent,
      user_id,
      email,
      device_fingerprint: request.headers.get('x-device-fingerprint') || undefined
    };
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit(
    request: NextRequest,
    limitType: 'API_GENERAL' | 'LOGIN_ATTEMPTS' | 'ADMIN_ATTEMPTS' | 'PASSWORD_RESET' | 'REGISTRATION',
    user_id?: string
  ): Promise<NextResponse | null> {
    const context = this.extractContext(request, user_id);
    const key = this.rateLimiter.generateKey(request, user_id);
    const endpoint = new URL(request.url).pathname;

    const result = await this.rateLimiter.checkRateLimit(key, endpoint, limitType);

    if (!result.allowed) {
      // Log rate limit exceeded event
      await this.logSecurityEvent({
        event_type: SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        context,
        details: {
          limit_type: limitType,
          endpoint,
          retry_after: result.retryAfter
        },
        severity: SECURITY_SEVERITY.MEDIUM
      });

      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retry_after: result.retryAfter
        },
        { status: 429 }
      );

      return this.setRateLimitHeaders(response, result);
    }

    return null; // Allow request to continue
  }

  /**
   * Check login attempt limits
   */
  async checkLoginLimits(
    request: NextRequest,
    email?: string,
    user_id?: string
  ): Promise<NextResponse | null> {
    const context = this.extractContext(request, user_id, email);
    
    const result = await this.loginLimiter.checkLoginAllowed(
      email,
      context.ip_address,
      user_id ? new (await import('mongodb')).ObjectId(user_id) : undefined
    );

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Login not allowed',
          message: result.reason,
          lockout_until: result.lockoutUntil,
          captcha_required: result.captchaRequired
        },
        { status: 423 } // 423 Locked
      );
    }

    return null; // Allow request to continue
  }

  /**
   * Verify CAPTCHA
   */
  async verifyCaptcha(
    request: NextRequest,
    action: 'login' | 'registration' | 'password_reset' | 'admin_login'
  ): Promise<NextResponse | null> {
    const body = await request.json();
    const captchaToken = body.captcha_token;

    if (!captchaToken) {
      return NextResponse.json(
        {
          error: 'CAPTCHA required',
          message: 'Please complete the CAPTCHA verification',
          captcha_required: true
        },
        { status: 400 }
      );
    }

    const result = await this.captchaService.verifyCaptcha(captchaToken, action);

    if (!result.success) {
      const context = this.extractContext(request);
      
      await this.logSecurityEvent({
        event_type: SECURITY_EVENT_TYPES.CAPTCHA_FAILED,
        context,
        details: {
          action,
          error: result.error,
          score: result.score
        },
        severity: SECURITY_SEVERITY.MEDIUM
      });

      return NextResponse.json(
        {
          error: 'CAPTCHA verification failed',
          message: result.error || 'Invalid CAPTCHA response',
          captcha_required: true
        },
        { status: 400 }
      );
    }

    return null; // Allow request to continue
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    request: NextRequest,
    data: {
      user_id?: string;
      email?: string;
      success: boolean;
      failure_reason?: string;
    }
  ): Promise<void> {
    const context = this.extractContext(request, data.user_id, data.email);

    await this.loginLimiter.recordLoginAttempt({
      user_id: data.user_id ? new (await import('mongodb')).ObjectId(data.user_id) : undefined,
      email: data.email,
      ip_address: context.ip_address,
      user_agent: context.user_agent,
      success: data.success,
      failure_reason: data.failure_reason,
      device_fingerprint: context.device_fingerprint
    });

    // Send admin alerts for failed attempts
    if (!data.success) {
      const failedAttempts = await this.loginLimiter.getFailedAttemptsCount(
        data.email,
        context.ip_address,
        data.user_id ? new ObjectId(data.user_id) : undefined,
        1 // Last hour
      );

      // Alert for multiple failed attempts (5+ attempts)
      if (failedAttempts >= 5) {
        await this.adminAlertService.alertMultipleFailedAttempts({
          ip_address: context.ip_address,
          user_email: data.email || 'Unknown',
          user_id: data.user_id,
          attempt_count: failedAttempts,
          location: 'Unknown' // Could be enhanced with IP geolocation
        });
      }

      // Alert for account lockout
      if (failedAttempts >= 5) {
        const lockoutResult = await this.loginLimiter.checkLoginAllowed(
          data.email,
          context.ip_address,
          data.user_id ? new ObjectId(data.user_id) : undefined
        );
        
        if (!lockoutResult.allowed && lockoutResult.lockoutUntil) {
          await this.adminAlertService.alertAccountLocked({
            user_email: data.email || 'Unknown',
            user_id: data.user_id || 'Unknown',
            lockout_duration: lockoutResult.lockoutUntil.getTime() - Date.now(),
            attempt_count: failedAttempts,
            ip_address: context.ip_address,
            location: 'Unknown'
          });
        }
      }
    }
  }

  /**
   * Record login attempt with security alerts
   */
  async recordLoginAttemptWithAlerts(
    request: NextRequest,
    data: {
      user_id?: string;
      email?: string;
      success: boolean;
      failure_reason?: string;
    }
  ): Promise<void> {
    const context = this.extractContext(request, data.user_id, data.email);

    // Use the enhanced login attempt recording with alerts
    await this.loginLimiter.recordLoginAttemptWithAlerts({
      user_id: data.user_id ? new ObjectId(data.user_id) : undefined,
      email: data.email,
      ip_address: context.ip_address,
      user_agent: context.user_agent,
      success: data.success,
      failure_reason: data.failure_reason,
      device_fingerprint: context.device_fingerprint
    });

    // Send admin alerts for failed attempts (existing logic)
    if (!data.success) {
      const failedAttempts = await this.loginLimiter.getFailedAttemptsCount(
        data.email,
        context.ip_address,
        data.user_id ? new ObjectId(data.user_id) : undefined,
        1 // Last hour
      );

      // Alert for multiple failed attempts (5+ attempts)
      if (failedAttempts >= 5) {
        await this.adminAlertService.alertMultipleFailedAttempts({
          ip_address: context.ip_address,
          user_email: data.email || 'Unknown',
          user_id: data.user_id,
          attempt_count: failedAttempts,
          location: 'Unknown' // Could be enhanced with IP geolocation
        });
      }

      // Alert for account lockout
      if (failedAttempts >= 5) {
        const lockoutResult = await this.loginLimiter.checkLoginAllowed(
          data.email,
          context.ip_address,
          data.user_id ? new ObjectId(data.user_id) : undefined
        );
        
        if (!lockoutResult.allowed && lockoutResult.lockoutUntil) {
          await this.adminAlertService.alertAccountLocked({
            ip_address: context.ip_address,
            user_email: data.email || 'Unknown',
            user_id: data.user_id || 'Unknown',
            lockout_duration: lockoutResult.lockoutUntil.getTime() - Date.now(),
            attempt_count: failedAttempts
          });
        }
      }
    }
  }

  /**
   * Check if CAPTCHA is required
   */
  isCaptchaRequired(action: 'login' | 'registration' | 'password_reset' | 'admin_login'): boolean {
    return this.captchaService.isCaptchaRequired(action);
  }

  /**
   * Get CAPTCHA configuration
   */
  getCaptchaConfig() {
    return {
      site_key: this.captchaService.getSiteKey(),
      enabled: this.isCaptchaRequired('login')
    };
  }

  /**
   * Check IP blacklist
   */
  async checkIPBlacklist(request: NextRequest): Promise<NextResponse | null> {
    const context = this.extractContext(request);
    const blacklistResult = await this.ipBlacklistService.isIPBlacklisted(context.ip_address);

    if (blacklistResult.isBlocked) {
      await this.logSecurityEvent({
        event_type: SECURITY_EVENT_TYPES.IP_BLOCKED,
        context,
        details: {
          reason: blacklistResult.reason,
          severity: blacklistResult.severity,
          expires_at: blacklistResult.expiresAt
        },
        severity: blacklistResult.severity === 'critical' ? SECURITY_SEVERITY.CRITICAL : SECURITY_SEVERITY.HIGH
      });

      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Your IP address has been blocked',
          reason: blacklistResult.reason,
          severity: blacklistResult.severity
        },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  }

  /**
   * Check session security
   */
  async checkSessionSecurity(
    request: NextRequest,
    userId: string,
    deviceInfo?: any
  ): Promise<NextResponse | null> {
    const context = this.extractContext(request, userId);
    
    if (!deviceInfo) {
      // Extract device info from request headers
      deviceInfo = {
        user_agent: context.user_agent,
        screen_resolution: request.headers.get('x-screen-resolution'),
        timezone: request.headers.get('x-timezone'),
        language: request.headers.get('accept-language'),
        platform: request.headers.get('x-platform')
      };
    }

    const sessionResult = await this.sessionSecurityService.checkSessionSecurity(
      userId,
      deviceInfo,
      context.ip_address,
      context.user_agent
    );

    if (!sessionResult.allowed) {
      await this.logSecurityEvent({
        event_type: SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
        context,
        details: {
          reason: sessionResult.reason,
          risk_score: sessionResult.riskScore,
          device_trusted: sessionResult.deviceTrusted
        },
        severity: SECURITY_SEVERITY.HIGH
      });

      return NextResponse.json(
        {
          error: 'Session security violation',
          message: sessionResult.reason,
          requires_verification: sessionResult.requiresVerification,
          risk_score: sessionResult.riskScore
        },
        { status: 403 }
      );
    }

    // Register device if new
    if (sessionResult.requiresVerification) {
      await this.sessionSecurityService.registerDevice(
        userId,
        deviceInfo,
        context.ip_address,
        false // Not trusted initially
      );
    }

    return null; // Allow request to continue
  }

  /**
   * Auto-blacklist IP if needed
   */
  async checkAutoBlacklist(request: NextRequest, email?: string): Promise<void> {
    const context = this.extractContext(request, undefined, email);
    
    // Get failed attempts for this IP
    const failedAttempts = await this.loginLimiter.getFailedAttemptsCount(
      email,
      context.ip_address,
      undefined,
      1 // Last hour
    );

    // Auto-blacklist if threshold exceeded
    if (failedAttempts >= 10) {
      await this.ipBlacklistService.autoBlacklistIP(context.ip_address, failedAttempts);
    }
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(
    request: NextRequest,
    userId: string,
    deviceInfo?: any
  ): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const context = this.extractContext(request, userId);
    
    if (!deviceInfo) {
      deviceInfo = {
        user_agent: context.user_agent,
        screen_resolution: request.headers.get('x-screen-resolution'),
        timezone: request.headers.get('x-timezone'),
        language: request.headers.get('accept-language'),
        platform: request.headers.get('x-platform')
      };
    }

    return await this.sessionSecurityService.detectSuspiciousActivity(
      userId,
      deviceInfo,
      context.ip_address
    );
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(response: NextResponse, result: any): NextResponse {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return response;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(data: {
    event_type: string;
    context: SecurityContext;
    details: Record<string, any>;
    severity: string;
  }): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb');
      const client = await import('@/lib/mongodb').then(m => m.default);
      if (!client) return;

      const collection = client.db(process.env.MONGODB_DATABASE || 'blood_node').collection('security_events');
      
      await collection.insertOne({
        event_type: data.event_type,
        user_id: data.context.user_id ? new ObjectId(data.context.user_id) : undefined,
        ip_address: data.context.ip_address,
        user_agent: data.context.user_agent,
        details: data.details,
        severity: data.severity,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();

/**
 * Security middleware factory for API routes
 */
export function withSecurity(
  options: {
    rateLimit?: 'API_GENERAL' | 'LOGIN_ATTEMPTS' | 'ADMIN_ATTEMPTS' | 'PASSWORD_RESET' | 'REGISTRATION';
    loginLimits?: boolean;
    captcha?: 'login' | 'registration' | 'password_reset' | 'admin_login';
  }
) {
  return async (request: NextRequest, handler: (request: NextRequest) => Promise<NextResponse>) => {
    // Apply rate limiting
    if (options.rateLimit) {
      const rateLimitResponse = await securityMiddleware.applyRateLimit(request, options.rateLimit);
      if (rateLimitResponse) return rateLimitResponse;
    }

    // Apply login limits
    if (options.loginLimits) {
      const loginLimitResponse = await securityMiddleware.checkLoginLimits(request);
      if (loginLimitResponse) return loginLimitResponse;
    }

    // Apply CAPTCHA verification
    if (options.captcha) {
      const captchaResponse = await securityMiddleware.verifyCaptcha(request, options.captcha);
      if (captchaResponse) return captchaResponse;
    }

    // Call the actual handler
    return handler(request);
  };
}
