// Security models and types for Blood Node
import { ObjectId } from 'mongodb';

export interface RateLimit {
  _id?: ObjectId;
  key: string; // IP address or user ID
  endpoint: string;
  attempts: number;
  window_start: Date;
  expires_at: Date;
  created_at: Date;
}

export interface LoginAttempt {
  _id?: ObjectId;
  user_id?: ObjectId;
  email?: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  captcha_required: boolean;
  captcha_solved: boolean;
  device_fingerprint?: string;
  created_at: Date;
}

export interface AccountLockout {
  _id?: ObjectId;
  user_id?: ObjectId;
  email?: string;
  ip_address: string;
  lockout_type: 'user' | 'ip' | 'email';
  attempts: number;
  lockout_level: 1 | 2 | 3 | 4; // 1: 5min, 2: 15min, 3: 1hour, 4: 24hour
  locked_until: Date;
  created_at: Date;
  unlocked_at?: Date;
  unlocked_by?: ObjectId; // Admin who unlocked
}

export interface IPBlacklist {
  _id?: ObjectId;
  ip_address: string;
  reason: 'malicious' | 'brute_force' | 'spam' | 'geographic' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  added_by?: ObjectId; // Admin who added
  expires_at?: Date; // Optional expiration
  created_at: Date;
  is_active: boolean;
}

export interface SecurityEvent {
  _id?: ObjectId;
  event_type: 'login_attempt' | 'rate_limit_exceeded' | 'account_locked' | 'ip_blocked' | 'captcha_failed' | 'admin_action' | 'suspicious_activity';
  user_id?: ObjectId;
  ip_address: string;
  user_agent: string;
  endpoint?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
}

export interface DeviceFingerprint {
  _id?: ObjectId;
  user_id: ObjectId;
  fingerprint: string;
  device_info: {
    user_agent: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
  };
  ip_address: string;
  is_trusted: boolean;
  last_seen: Date;
  created_at: Date;
}

export interface SecurityConfig {
  _id?: ObjectId;
  config_type: 'rate_limits' | 'login_limits' | 'captcha_settings' | 'ip_blacklist';
  settings: Record<string, any>;
  updated_by: ObjectId;
  updated_at: Date;
}

// Rate limiting configuration
export const RATE_LIMITS = {
  API_GENERAL: {
    requests: 100,
    window: 60, // seconds
    key_prefix: 'api_general'
  },
  LOGIN_ATTEMPTS: {
    requests: 20, // Increased for testing
    window: 60, // seconds
    key_prefix: 'login_attempts'
  },
  ADMIN_ATTEMPTS: {
    requests: 10,
    window: 60, // seconds
    key_prefix: 'admin_attempts'
  },
  PASSWORD_RESET: {
    requests: 3,
    window: 300, // 5 minutes
    key_prefix: 'password_reset'
  },
  REGISTRATION: {
    requests: 5,
    window: 3600, // 1 hour
    key_prefix: 'registration'
  }
} as const;

// Login attempt limits
export const LOGIN_LIMITS = {
  USER_MAX_ATTEMPTS: 5,
  ADMIN_MAX_ATTEMPTS: 3,
  LOCKOUT_LEVELS: [
    { level: 1, duration: 5 * 60 * 1000, attempts: 3 },      // 5 minutes
    { level: 2, duration: 15 * 60 * 1000, attempts: 5 },     // 15 minutes
    { level: 3, duration: 60 * 60 * 1000, attempts: 8 },     // 1 hour
    { level: 4, duration: 24 * 60 * 60 * 1000, attempts: 10 } // 24 hours
  ]
} as const;

// CAPTCHA settings
export const CAPTCHA_SETTINGS = {
  ENABLE_AFTER_ATTEMPTS: 10, // Temporarily increased for testing
  REQUIRED_FOR_REGISTRATION: false, // Temporarily disabled for testing
  REQUIRED_FOR_PASSWORD_RESET: false, // Temporarily disabled for testing
  REQUIRED_FOR_ADMIN_LOGIN: false, // Temporarily disabled for testing
  PROVIDER: 'recaptcha_v3', // or 'hcaptcha'
  MIN_SCORE: 0.5
} as const;

// Security event types
export const SECURITY_EVENT_TYPES = {
  LOGIN_ATTEMPT: 'login_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  ACCOUNT_LOCKED: 'account_locked',
  IP_BLOCKED: 'ip_blocked',
  CAPTCHA_FAILED: 'captcha_failed',
  ADMIN_ACTION: 'admin_action',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
} as const;

// Security severity levels
export const SECURITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;
