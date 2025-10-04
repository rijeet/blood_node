// IP Blacklisting service for Blood Node
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { IPBlacklist, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '@/lib/models/security';
import { AdminAlertService } from './admin-alerts';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export interface IPBlacklistResult {
  isBlocked: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
  addedBy?: string;
}

export interface IPAnalysis {
  ip: string;
  country?: string;
  isp?: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  riskScore: number;
  lastSeen?: Date;
  totalAttempts: number;
  failedAttempts: number;
  successRate: number;
}

export class IPBlacklistService {
  private static instance: IPBlacklistService;

  static getInstance(): IPBlacklistService {
    if (!IPBlacklistService.instance) {
      IPBlacklistService.instance = new IPBlacklistService();
    }
    return IPBlacklistService.instance;
  }

  /**
   * Check if IP is blacklisted
   */
  async isIPBlacklisted(ip: string): Promise<IPBlacklistResult> {
    const client = await clientPromise;
    if (!client) {
      return { isBlocked: false };
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');
    const now = new Date();

    const blacklistEntry = await collection.findOne({
      ip_address: ip,
      is_active: true,
      $or: [
        { expires_at: { $exists: false } }, // Permanent blacklist
        { expires_at: { $gt: now } } // Not expired
      ]
    });

    if (!blacklistEntry) {
      return { isBlocked: false };
    }

    return {
      isBlocked: true,
      reason: blacklistEntry.reason,
      severity: blacklistEntry.severity,
      expiresAt: blacklistEntry.expires_at,
      addedBy: blacklistEntry.added_by?.toString()
    };
  }

  /**
   * Add IP to blacklist
   */
  async addToBlacklist(data: {
    ip_address: string;
    reason: 'malicious' | 'brute_force' | 'spam' | 'geographic' | 'manual';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    added_by?: ObjectId;
    expires_at?: Date;
  }): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');

    // Check if already blacklisted
    const existing = await collection.findOne({
      ip_address: data.ip_address,
      is_active: true
    });

    if (existing) {
      return false; // Already blacklisted
    }

    const blacklistEntry: Omit<IPBlacklist, '_id'> = {
      ip_address: data.ip_address,
      reason: data.reason,
      severity: data.severity,
      description: data.description,
      added_by: data.added_by,
      expires_at: data.expires_at,
      created_at: new Date(),
      is_active: true
    };

    await collection.insertOne(blacklistEntry);

    // Log security event
    await this.logSecurityEvent({
      event_type: SECURITY_EVENT_TYPES.IP_BLOCKED,
      ip_address: data.ip_address,
      user_agent: 'system',
      details: {
        reason: data.reason,
        severity: data.severity,
        description: data.description,
        expires_at: data.expires_at
      },
      severity: data.severity === 'critical' ? SECURITY_SEVERITY.CRITICAL : SECURITY_SEVERITY.HIGH
    });

    return true;
  }

  /**
   * Remove IP from blacklist
   */
  async removeFromBlacklist(ip: string, removed_by?: ObjectId): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');

    const result = await collection.updateMany(
      { ip_address: ip, is_active: true },
      { 
        $set: { 
          is_active: false,
          removed_at: new Date(),
          removed_by
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Auto-blacklist IP based on failed attempts
   */
  async autoBlacklistIP(ip: string, attempts: number): Promise<boolean> {
    if (attempts < 10) {
      return false; // Not enough attempts for auto-blacklist
    }

    const severity = attempts >= 20 ? 'critical' : attempts >= 15 ? 'high' : 'medium';
    const duration = attempts >= 20 ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 1 day

    const success = await this.addToBlacklist({
      ip_address: ip,
      reason: 'brute_force',
      severity,
      description: `Auto-blacklisted after ${attempts} failed attempts`,
      expires_at: new Date(Date.now() + duration)
    });

    // Send admin alert for IP blacklisting
    if (success) {
      const alertService = AdminAlertService.getInstance();
      await alertService.alertIPBlacklisted({
        ip_address: ip,
        reason: 'brute_force',
        severity,
        attempt_count: attempts,
        location: 'Unknown' // Could be enhanced with IP geolocation
      });
    }

    return success;
  }

  /**
   * Get IP analysis data
   */
  async analyzeIP(ip: string): Promise<IPAnalysis> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const db = client.db(DB_NAME);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get login attempts for this IP
    const loginAttempts = await db.collection('login_attempts').find({
      ip_address: ip,
      created_at: { $gte: oneDayAgo }
    }).toArray();

    const totalAttempts = loginAttempts.length;
    const failedAttempts = loginAttempts.filter(attempt => !attempt.success).length;
    const successRate = totalAttempts > 0 ? (totalAttempts - failedAttempts) / totalAttempts : 0;

    // Basic IP analysis (in production, use a service like IPQualityScore)
    const isVpn = await this.checkIfVPN(ip);
    const isProxy = await this.checkIfProxy(ip);
    const isTor = await this.checkIfTor(ip);

    // Calculate risk score (0-100)
    let riskScore = 0;
    if (failedAttempts > 5) riskScore += 30;
    if (failedAttempts > 10) riskScore += 20;
    if (successRate < 0.1) riskScore += 25;
    if (isVpn) riskScore += 15;
    if (isProxy) riskScore += 20;
    if (isTor) riskScore += 30;

    return {
      ip,
      isVpn,
      isProxy,
      isTor,
      riskScore: Math.min(riskScore, 100),
      lastSeen: loginAttempts.length > 0 ? new Date(Math.max(...loginAttempts.map(a => a.created_at.getTime()))) : undefined,
      totalAttempts,
      failedAttempts,
      successRate
    };
  }

  /**
   * Get blacklisted IPs
   */
  async getBlacklistedIPs(limit: number = 100, offset: number = 0): Promise<IPBlacklist[]> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');

    return await collection.find({
      is_active: true
    })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  }

  /**
   * Get IP statistics
   */
  async getIPStatistics(): Promise<{
    totalBlacklisted: number;
    byReason: Record<string, number>;
    bySeverity: Record<string, number>;
    recentAdditions: number;
  }> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalBlacklisted, byReason, bySeverity, recentAdditions] = await Promise.all([
      collection.countDocuments({ is_active: true }),
      collection.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: '$reason', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).toArray(),
      collection.countDocuments({ 
        is_active: true, 
        created_at: { $gte: oneDayAgo } 
      })
    ]);

    return {
      totalBlacklisted,
      byReason: byReason.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      bySeverity: bySeverity.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recentAdditions
    };
  }

  /**
   * Clean up expired blacklist entries
   */
  async cleanup(): Promise<number> {
    const client = await clientPromise;
    if (!client) {
      return 0;
    }

    const collection = client.db(DB_NAME).collection<IPBlacklist>('ip_blacklist');
    const now = new Date();

    const result = await collection.updateMany(
      {
        is_active: true,
        expires_at: { $lt: now }
      },
      {
        $set: { is_active: false }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Check if IP is VPN (simplified check)
   */
  private async checkIfVPN(ip: string): Promise<boolean> {
    // In production, use a service like IPQualityScore or similar
    // For now, return false as we don't have a VPN detection service
    return false;
  }

  /**
   * Check if IP is proxy (simplified check)
   */
  private async checkIfProxy(ip: string): Promise<boolean> {
    // In production, use a service like IPQualityScore or similar
    // For now, return false as we don't have a proxy detection service
    return false;
  }

  /**
   * Check if IP is Tor (simplified check)
   */
  private async checkIfTor(ip: string): Promise<boolean> {
    // In production, use a service like IPQualityScore or similar
    // For now, return false as we don't have a Tor detection service
    return false;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(data: {
    event_type: string;
    ip_address: string;
    user_agent: string;
    details: Record<string, any>;
    severity: string;
  }): Promise<void> {
    try {
      const client = await clientPromise;
      if (!client) return;

      const collection = client.db(DB_NAME).collection('security_events');
      
      await collection.insertOne({
        event_type: data.event_type,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        details: data.details,
        severity: data.severity,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
