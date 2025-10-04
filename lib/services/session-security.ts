// Session Security service for Blood Node
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { DeviceFingerprint, SECURITY_EVENT_TYPES, SECURITY_SEVERITY } from '@/lib/models/security';
import crypto from 'crypto';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export interface SessionSecurityResult {
  allowed: boolean;
  reason?: string;
  requiresVerification: boolean;
  deviceTrusted: boolean;
  riskScore: number;
}

export interface DeviceInfo {
  user_agent: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  browser?: string;
  os?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
}

export class SessionSecurityService {
  private static instance: SessionSecurityService;

  static getInstance(): SessionSecurityService {
    if (!SessionSecurityService.instance) {
      SessionSecurityService.instance = new SessionSecurityService();
    }
    return SessionSecurityService.instance;
  }

  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(deviceInfo: DeviceInfo, ip: string): string {
    const fingerprintData = {
      user_agent: deviceInfo.user_agent,
      screen_resolution: deviceInfo.screen_resolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      ip: ip
    };

    const fingerprintString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Analyze device information
   */
  analyzeDevice(deviceInfo: DeviceInfo): {
    device_type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    risk_factors: string[];
  } {
    const userAgent = deviceInfo.user_agent.toLowerCase();
    const riskFactors: string[] = [];

    // Detect device type
    let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      device_type = 'mobile';
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      device_type = 'tablet';
    }

    // Detect browser
    let browser = 'unknown';
    if (userAgent.includes('chrome')) browser = 'chrome';
    else if (userAgent.includes('firefox')) browser = 'firefox';
    else if (userAgent.includes('safari')) browser = 'safari';
    else if (userAgent.includes('edge')) browser = 'edge';
    else if (userAgent.includes('opera')) browser = 'opera';

    // Detect OS
    let os = 'unknown';
    if (userAgent.includes('windows')) os = 'windows';
    else if (userAgent.includes('mac')) os = 'macos';
    else if (userAgent.includes('linux')) os = 'linux';
    else if (userAgent.includes('android')) os = 'android';
    else if (userAgent.includes('ios')) os = 'ios';

    // Risk factors
    if (browser === 'unknown') riskFactors.push('unknown_browser');
    if (os === 'unknown') riskFactors.push('unknown_os');
    if (device_type === 'mobile' && !deviceInfo.screen_resolution) riskFactors.push('missing_screen_resolution');
    if (!deviceInfo.timezone) riskFactors.push('missing_timezone');
    if (!deviceInfo.language) riskFactors.push('missing_language');

    return {
      device_type,
      browser,
      os,
      risk_factors: riskFactors
    };
  }

  /**
   * Check session security
   */
  async checkSessionSecurity(
    userId: string,
    deviceInfo: DeviceInfo,
    ip: string,
    userAgent: string
  ): Promise<SessionSecurityResult> {
    const client = await clientPromise;
    if (!client) {
      return { allowed: true, deviceTrusted: false, riskScore: 0, requiresVerification: false };
    }

    const fingerprint = this.generateDeviceFingerprint(deviceInfo, ip);
    const analysis = this.analyzeDevice(deviceInfo);

    // Get device history
    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');
    const existingDevice = await deviceCollection.findOne({
      user_id: new ObjectId(userId),
      fingerprint
    });

    // Calculate risk score
    let riskScore = 0;
    riskScore += analysis.risk_factors.length * 10; // 10 points per risk factor
    riskScore += analysis.device_type === 'mobile' ? 5 : 0; // Mobile devices slightly riskier
    riskScore += analysis.browser === 'unknown' ? 20 : 0; // Unknown browser is risky
    riskScore += analysis.os === 'unknown' ? 15 : 0; // Unknown OS is risky

    // Check if device is trusted
    const deviceTrusted = existingDevice?.is_trusted || false;

    // Check concurrent sessions
    const maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5');
    const activeSessions = await this.getActiveSessionCount(userId);
    
    if (activeSessions >= maxSessions) {
      return {
        allowed: false,
        reason: 'Maximum concurrent sessions exceeded',
        requiresVerification: true,
        deviceTrusted: false,
        riskScore
      };
    }

    // High risk requires verification
    const requiresVerification = riskScore > 50 || !deviceTrusted;

    return {
      allowed: true,
      requiresVerification,
      deviceTrusted,
      riskScore
    };
  }

  /**
   * Register device
   */
  async registerDevice(
    userId: string,
    deviceInfo: DeviceInfo,
    ip: string,
    isTrusted: boolean = false
  ): Promise<string> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const fingerprint = this.generateDeviceFingerprint(deviceInfo, ip);
    const analysis = this.analyzeDevice(deviceInfo);

    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');

    const device: Omit<DeviceFingerprint, '_id'> = {
      user_id: new ObjectId(userId),
      fingerprint,
      device_info: {
        user_agent: deviceInfo.user_agent,
        screen_resolution: deviceInfo.screen_resolution,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language,
        platform: deviceInfo.platform
      },
      ip_address: ip,
      is_trusted: isTrusted,
      last_seen: new Date(),
      created_at: new Date()
    };

    // Update existing or insert new
    await deviceCollection.updateOne(
      { user_id: new ObjectId(userId), fingerprint },
      { $set: device },
      { upsert: true }
    );

    return fingerprint;
  }

  /**
   * Trust device
   */
  async trustDevice(userId: string, fingerprint: string): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      return false;
    }

    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');

    const result = await deviceCollection.updateOne(
      { user_id: new ObjectId(userId), fingerprint },
      { 
        $set: { 
          is_trusted: true,
          last_seen: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get user devices
   */
  async getUserDevices(userId: string): Promise<DeviceFingerprint[]> {
    const client = await clientPromise;
    if (!client) {
      return [];
    }

    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');

    return await deviceCollection.find({
      user_id: new ObjectId(userId)
    })
    .sort({ last_seen: -1 })
    .toArray();
  }

  /**
   * Revoke device
   */
  async revokeDevice(userId: string, fingerprint: string): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      return false;
    }

    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');

    const result = await deviceCollection.deleteOne({
      user_id: new ObjectId(userId),
      fingerprint
    });

    return result.deletedCount > 0;
  }

  /**
   * Get active session count
   */
  private async getActiveSessionCount(userId: string): Promise<number> {
    const client = await clientPromise;
    if (!client) {
      return 0;
    }

    const db = client.db(DB_NAME);
    const now = new Date();
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || '24') * 60 * 60 * 1000; // 24 hours
    const timeoutThreshold = new Date(now.getTime() - sessionTimeout);

    // Count active refresh tokens
    const refreshTokens = await db.collection('refresh_tokens').countDocuments({
      user_id: new ObjectId(userId),
      revoked: false,
      expires_at: { $gt: now },
      created_at: { $gt: timeoutThreshold }
    });

    return refreshTokens;
  }

  /**
   * Clean up old devices
   */
  async cleanupOldDevices(daysOld: number = 90): Promise<number> {
    const client = await clientPromise;
    if (!client) {
      return 0;
    }

    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await deviceCollection.deleteMany({
      last_seen: { $lt: cutoffDate },
      is_trusted: false
    });

    return result.deletedCount;
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(
    userId: string,
    deviceInfo: DeviceInfo,
    ip: string
  ): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const client = await clientPromise;
    if (!client) {
      return { isSuspicious: false, reasons: [], riskScore: 0 };
    }

    const reasons: string[] = [];
    let riskScore = 0;

    // Check for new device
    const fingerprint = this.generateDeviceFingerprint(deviceInfo, ip);
    const deviceCollection = client.db(DB_NAME).collection<DeviceFingerprint>('device_fingerprints');
    const existingDevice = await deviceCollection.findOne({
      user_id: new ObjectId(userId),
      fingerprint
    });

    if (!existingDevice) {
      reasons.push('New device detected');
      riskScore += 30;
    }

    // Check for IP change
    const recentDevices = await deviceCollection.find({
      user_id: new ObjectId(userId),
      last_seen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).toArray();

    const uniqueIPs = new Set(recentDevices.map(d => d.ip_address));
    if (uniqueIPs.size > 3) {
      reasons.push('Multiple IP addresses in short time');
      riskScore += 25;
    }

    // Check for unusual location (simplified)
    const isNewLocation = !recentDevices.some(d => d.ip_address === ip);
    if (isNewLocation) {
      reasons.push('New location detected');
      riskScore += 20;
    }

    // Check device analysis
    const analysis = this.analyzeDevice(deviceInfo);
    if (analysis.risk_factors.length > 0) {
      reasons.push(`Device risk factors: ${analysis.risk_factors.join(', ')}`);
      riskScore += analysis.risk_factors.length * 10;
    }

    return {
      isSuspicious: riskScore > 50,
      reasons,
      riskScore
    };
  }
}
