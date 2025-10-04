// Security configuration for Blood Node
export const securityConfig = {
  // CAPTCHA Configuration
  captcha: {
    enabled: process.env.CAPTCHA_ENABLED === 'true',
    provider: process.env.CAPTCHA_PROVIDER || 'recaptcha_v3',
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    secretKey: process.env.CAPTCHA_SECRET_KEY,
    minScore: parseFloat(process.env.CAPTCHA_MIN_SCORE || '0.5'),
    requiredForLogin: process.env.CAPTCHA_REQUIRED_LOGIN === 'true',
    requiredForRegistration: process.env.CAPTCHA_REQUIRED_REGISTRATION === 'true',
    requiredForAdmin: process.env.CAPTCHA_REQUIRED_ADMIN === 'true'
  },

  // Rate Limiting Configuration
  rateLimiting: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    redisUrl: process.env.RATE_LIMIT_REDIS_URL,
    apiGeneral: {
      requests: parseInt(process.env.RATE_LIMIT_API_REQUESTS || '100'),
      window: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60')
    },
    loginAttempts: {
      requests: parseInt(process.env.RATE_LIMIT_LOGIN_REQUESTS || '5'),
      window: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '60')
    },
    adminAttempts: {
      requests: parseInt(process.env.RATE_LIMIT_ADMIN_REQUESTS || '10'),
      window: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW || '60')
    }
  },

  // Login Attempt Limiting
  loginLimits: {
    userMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5'),
    adminMaxAttempts: parseInt(process.env.ADMIN_MAX_ATTEMPTS || '3'),
    lockoutLevels: [
      {
        level: 1,
        duration: parseInt(process.env.LOCKOUT_DURATION_1 || '5') * 60 * 1000, // 5 minutes
        attempts: 3
      },
      {
        level: 2,
        duration: parseInt(process.env.LOCKOUT_DURATION_2 || '15') * 60 * 1000, // 15 minutes
        attempts: 5
      },
      {
        level: 3,
        duration: parseInt(process.env.LOCKOUT_DURATION_3 || '60') * 60 * 1000, // 1 hour
        attempts: 8
      },
      {
        level: 4,
        duration: parseInt(process.env.LOCKOUT_DURATION_4 || '1440') * 60 * 1000, // 24 hours
        attempts: 10
      }
    ]
  },

  // IP Blacklisting
  ipBlacklist: {
    enabled: process.env.IP_BLACKLIST_ENABLED === 'true',
    geographicFiltering: process.env.GEOGRAPHIC_FILTERING === 'true',
    trustedIPs: process.env.TRUSTED_IPS?.split(',') || ['127.0.0.1', '::1'],
    autoBlacklistThreshold: parseInt(process.env.IP_AUTO_BLACKLIST_THRESHOLD || '10'),
    blacklistDuration: parseInt(process.env.IP_BLACKLIST_DURATION || '24') * 60 * 60 * 1000 // 24 hours
  },

  // Security Monitoring
  monitoring: {
    alertsEnabled: process.env.SECURITY_ALERTS_ENABLED === 'true',
    logLevel: process.env.SECURITY_LOG_LEVEL || 'medium',
    auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'),
    realTimeMonitoring: process.env.REAL_TIME_MONITORING === 'true'
  },

  // Session Security
  session: {
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '24') * 60 * 60 * 1000, // 24 hours
    deviceFingerprinting: process.env.DEVICE_FINGERPRINTING === 'true',
    requireDeviceVerification: process.env.REQUIRE_DEVICE_VERIFICATION === 'true'
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: process.env.CSP_ENABLED === 'true',
    hsts: process.env.HSTS_ENABLED === 'true',
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    xContentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS !== 'false'
  }
};

// Validate configuration
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (securityConfig.captcha.enabled) {
    if (!securityConfig.captcha.siteKey) {
      errors.push('NEXT_PUBLIC_CAPTCHA_SITE_KEY is required when CAPTCHA is enabled');
    }
    if (!securityConfig.captcha.secretKey) {
      errors.push('CAPTCHA_SECRET_KEY is required when CAPTCHA is enabled');
    }
  }

  if (securityConfig.rateLimiting.enabled && securityConfig.rateLimiting.redisUrl) {
    // Validate Redis URL format
    try {
      new URL(securityConfig.rateLimiting.redisUrl);
    } catch {
      errors.push('RATE_LIMIT_REDIS_URL must be a valid URL');
    }
  }

  // Validate numeric values
  if (securityConfig.loginLimits.userMaxAttempts < 1) {
    errors.push('LOGIN_MAX_ATTEMPTS must be at least 1');
  }

  if (securityConfig.loginLimits.adminMaxAttempts < 1) {
    errors.push('ADMIN_MAX_ATTEMPTS must be at least 1');
  }

  if (securityConfig.captcha.minScore < 0 || securityConfig.captcha.minScore > 1) {
    errors.push('CAPTCHA_MIN_SCORE must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Get security status
export function getSecurityStatus() {
  return {
    captcha: securityConfig.captcha.enabled,
    rateLimiting: securityConfig.rateLimiting.enabled,
    ipBlacklist: securityConfig.ipBlacklist.enabled,
    monitoring: securityConfig.monitoring.alertsEnabled,
    sessionSecurity: securityConfig.session.deviceFingerprinting
  };
}
