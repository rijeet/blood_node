// Login attempt limiting service for Blood Node
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { LoginAttempt, AccountLockout, LOGIN_LIMITS, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '@/lib/models/security';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export interface LoginAttemptResult {
  allowed: boolean;
  reason?: string;
  lockoutUntil?: Date;
  attemptsRemaining?: number;
  captchaRequired: boolean;
}

export class LoginAttemptLimiter {
  private static instance: LoginAttemptLimiter;

  static getInstance(): LoginAttemptLimiter {
    if (!LoginAttemptLimiter.instance) {
      LoginAttemptLimiter.instance = new LoginAttemptLimiter();
    }
    return LoginAttemptLimiter.instance;
  }

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(data: {
    user_id?: ObjectId;
    email?: string;
    ip_address: string;
    user_agent: string;
    success: boolean;
    failure_reason?: string;
    device_fingerprint?: string;
  }): Promise<void> {
    const client = await clientPromise;
    if (!client) throw new Error('Database connection failed');

    const collection = client.db(DB_NAME).collection<LoginAttempt>('login_attempts');

    const attempt: Omit<LoginAttempt, '_id'> = {
      user_id: data.user_id,
      email: data.email,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      success: data.success,
      failure_reason: data.failure_reason,
      captcha_required: false,
      captcha_solved: false,
      device_fingerprint: data.device_fingerprint,
      created_at: new Date()
    };

    await collection.insertOne(attempt);
  }

  /**
   * Check if login is allowed
   */
  async checkLoginAllowed(
    email?: string,
    ip_address?: string,
    user_id?: ObjectId
  ): Promise<LoginAttemptResult> {
    const client = await clientPromise;
    if (!client) throw new Error('Database connection failed');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for active lockouts
    const lockoutCollection = client.db(DB_NAME).collection<AccountLockout>('account_lockouts');
    
    // Check user lockout
    if (email || user_id) {
      const userLockout = await lockoutCollection.findOne({
        $or: [
          { email, lockout_type: 'email' },
          { user_id, lockout_type: 'user' }
        ],
        locked_until: { $gt: now },
        is_active: true
      });

      if (userLockout) {
        return {
          allowed: false,
          reason: `Account locked until ${userLockout.locked_until.toISOString()}`,
          lockoutUntil: userLockout.locked_until,
          captchaRequired: true
        };
      }
    }

    // Check IP lockout
    if (ip_address) {
      const ipLockout = await lockoutCollection.findOne({
        ip_address,
        lockout_type: 'ip',
        locked_until: { $gt: now },
        is_active: true
      });

      if (ipLockout) {
        return {
          allowed: false,
          reason: `IP address locked until ${ipLockout.locked_until.toISOString()}`,
          lockoutUntil: ipLockout.locked_until,
          captchaRequired: true
        };
      }
    }

    // Count recent failed attempts
    const attemptsCollection = client.db(DB_NAME).collection<LoginAttempt>('login_attempts');
    
    const query: any = {
      success: false,
      created_at: { $gte: oneHourAgo }
    };

    if (email) query.email = email;
    if (user_id) query.user_id = user_id;
    if (ip_address) query.ip_address = ip_address;

    const failedAttempts = await attemptsCollection.countDocuments(query);

    // Determine if CAPTCHA is required
    const captchaRequired = failedAttempts >= 2;

    // Check if limit exceeded
    const maxAttempts = email?.includes('admin') ? LOGIN_LIMITS.ADMIN_MAX_ATTEMPTS : LOGIN_LIMITS.USER_MAX_ATTEMPTS;
    
    if (failedAttempts >= maxAttempts) {
      // Create lockout
      await this.createLockout({
        user_id,
        email,
        ip_address: ip_address || 'unknown',
        attempts: failedAttempts
      });

      return {
        allowed: false,
        reason: `Too many failed attempts. Account locked.`,
        captchaRequired: true
      };
    }

    return {
      allowed: true,
      attemptsRemaining: maxAttempts - failedAttempts,
      captchaRequired
    };
  }

  /**
   * Create account lockout
   */
  async createLockout(data: {
    user_id?: ObjectId;
    email?: string;
    ip_address: string;
    attempts: number;
  }): Promise<void> {
    const client = await clientPromise;
    if (!client) throw new Error('Database connection failed');

    const collection = client.db(DB_NAME).collection<AccountLockout>('account_lockouts');
    const now = new Date();

    // Determine lockout level based on attempts
    let lockoutLevel = 1;
    let lockoutDuration = LOGIN_LIMITS.LOCKOUT_LEVELS[0].duration;

    for (const level of LOGIN_LIMITS.LOCKOUT_LEVELS) {
      if (data.attempts >= level.attempts) {
        lockoutLevel = level.level;
        lockoutDuration = level.duration;
      }
    }

    const lockout: Omit<AccountLockout, '_id'> = {
      user_id: data.user_id,
      email: data.email,
      ip_address: data.ip_address,
      lockout_type: data.user_id ? 'user' : 'email',
      attempts: data.attempts,
      lockout_level: lockoutLevel as 1 | 2 | 3 | 4,
      locked_until: new Date(now.getTime() + lockoutDuration),
      created_at: now
    };

    await collection.insertOne(lockout);

    // Log security event
    await this.logSecurityEvent({
      event_type: SECURITY_EVENT_TYPES.ACCOUNT_LOCKED,
      user_id: data.user_id,
      ip_address: data.ip_address,
      user_agent: 'system',
      details: {
        email: data.email,
        attempts: data.attempts,
        lockout_level: lockoutLevel,
        lockout_duration: lockoutDuration
      },
      severity: SECURITY_SEVERITY.HIGH
    });
  }

  /**
   * Unlock account
   */
  async unlockAccount(
    email?: string,
    user_id?: ObjectId,
    ip_address?: string,
    unlocked_by?: ObjectId
  ): Promise<boolean> {
    const client = await clientPromise;
    if (!client) throw new Error('Database connection failed');

    const collection = client.db(DB_NAME).collection<AccountLockout>('account_lockouts');
    
    const query: any = {
      locked_until: { $gt: new Date() },
      is_active: true
    };

    if (email) query.email = email;
    if (user_id) query.user_id = user_id;
    if (ip_address) query.ip_address = ip_address;

    const result = await collection.updateMany(query, {
      $set: {
        is_active: false,
        unlocked_at: new Date(),
        unlocked_by
      }
    });

    return result.modifiedCount > 0;
  }

  /**
   * Get failed attempts count
   */
  async getFailedAttemptsCount(
    email?: string,
    ip_address?: string,
    user_id?: ObjectId,
    hours: number = 1
  ): Promise<number> {
    const client = await clientPromise;
    if (!client) throw new Error('Database connection failed');

    const collection = client.db(DB_NAME).collection<LoginAttempt>('login_attempts');
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const query: any = {
      success: false,
      created_at: { $gte: since }
    };

    if (email) query.email = email;
    if (user_id) query.user_id = user_id;
    if (ip_address) query.ip_address = ip_address;

    return await collection.countDocuments(query);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(data: {
    event_type: string;
    user_id?: ObjectId;
    ip_address: string;
    user_agent: string;
    details: Record<string, any>;
    severity: string;
  }): Promise<void> {
    const client = await clientPromise;
    if (!client) return;

    const collection = client.db(DB_NAME).collection('security_events');
    
    await collection.insertOne({
      event_type: data.event_type,
      user_id: data.user_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      details: data.details,
      severity: data.severity,
      created_at: new Date()
    });
  }

  /**
   * Clean up old records
   */
  async cleanup(): Promise<void> {
    const client = await clientPromise;
    if (!client) return;

    const db = client.db(DB_NAME);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Clean up old login attempts
    await db.collection('login_attempts').deleteMany({
      created_at: { $lt: thirtyDaysAgo }
    });

    // Clean up expired lockouts
    await db.collection('account_lockouts').deleteMany({
      locked_until: { $lt: new Date() },
      is_active: false
    });
  }
}
