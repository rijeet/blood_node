// Admin Alert Service for Blood Node
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
// import { sendEmail } from '@/lib/email/service';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export interface AdminAlert {
  _id?: ObjectId;
  alert_type: 'ip_blacklisted' | 'multiple_failed_attempts' | 'suspicious_activity' | 'rate_limit_exceeded' | 'account_locked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: {
    ip_address?: string;
    user_email?: string;
    user_id?: string;
    attempt_count?: number;
    lockout_duration?: number;
    risk_score?: number;
    device_info?: any;
    location?: string;
    timestamp: Date;
  };
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
  read_by?: ObjectId | string;
}

export interface AlertPreferences {
  _id?: ObjectId;
  admin_id: ObjectId;
  email_alerts: boolean;
  real_time_notifications: boolean;
  alert_types: {
    ip_blacklisted: boolean;
    multiple_failed_attempts: boolean;
    suspicious_activity: boolean;
    rate_limit_exceeded: boolean;
    account_locked: boolean;
  };
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  updated_at: Date;
}

export class AdminAlertService {
  private static instance: AdminAlertService;

  static getInstance(): AdminAlertService {
    if (!AdminAlertService.instance) {
      AdminAlertService.instance = new AdminAlertService();
    }
    return AdminAlertService.instance;
  }

  /**
   * Create a new admin alert
   */
  async createAlert(alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'>): Promise<ObjectId> {
    const client = await clientPromise;
    if (!client) {
      throw new Error('Database connection failed');
    }

    const collection = client.db(DB_NAME).collection<AdminAlert>('admin_alerts');

    const newAlert: Omit<AdminAlert, '_id'> = {
      ...alert,
      is_read: false,
      created_at: new Date()
    };

    const result = await collection.insertOne(newAlert);
    
    // Send real-time notifications to online admins
    await this.sendRealTimeNotification(newAlert);
    
    // Send email alerts to subscribed admins
    await this.sendEmailAlerts(newAlert);

    return result.insertedId;
  }

  /**
   * Alert for IP blacklisting
   */
  async alertIPBlacklisted(data: {
    ip_address: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    attempt_count: number;
    user_email?: string;
    location?: string;
  }): Promise<void> {
    const alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'> = {
      alert_type: 'ip_blacklisted',
      severity: data.severity,
      title: `🚫 IP Address Blacklisted: ${data.ip_address}`,
      message: `IP address ${data.ip_address} has been automatically blacklisted after ${data.attempt_count} failed login attempts. Reason: ${data.reason}`,
      details: {
        ip_address: data.ip_address,
        user_email: data.user_email,
        attempt_count: data.attempt_count,
        location: data.location,
        timestamp: new Date()
      }
    };

    await this.createAlert(alert);
  }

  /**
   * Alert for multiple failed attempts
   */
  async alertMultipleFailedAttempts(data: {
    ip_address: string;
    user_email?: string;
    user_id?: string;
    attempt_count: number;
    location?: string;
  }): Promise<void> {
    const severity = data.attempt_count >= 15 ? 'critical' : 
                    data.attempt_count >= 10 ? 'high' : 'medium';

    const alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'> = {
      alert_type: 'multiple_failed_attempts',
      severity,
      title: `⚠️ Multiple Failed Login Attempts: ${data.attempt_count}`,
      message: `Detected ${data.attempt_count} failed login attempts from IP ${data.ip_address}${data.user_email ? ` for user ${data.user_email}` : ''}`,
      details: {
        ip_address: data.ip_address,
        user_email: data.user_email,
        user_id: data.user_id,
        attempt_count: data.attempt_count,
        location: data.location,
        timestamp: new Date()
      }
    };

    await this.createAlert(alert);
  }

  /**
   * Alert for suspicious activity
   */
  async alertSuspiciousActivity(data: {
    ip_address: string;
    user_email?: string;
    user_id?: string;
    activity_type: string;
    risk_score: number;
    device_info?: any;
    location?: string;
  }): Promise<void> {
    const severity = data.risk_score >= 80 ? 'critical' : 
                    data.risk_score >= 60 ? 'high' : 
                    data.risk_score >= 40 ? 'medium' : 'low';

    const alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'> = {
      alert_type: 'suspicious_activity',
      severity,
      title: `🔍 Suspicious Activity Detected`,
      message: `Suspicious activity detected from IP ${data.ip_address}: ${data.activity_type}. Risk Score: ${data.risk_score}/100`,
      details: {
        ip_address: data.ip_address,
        user_email: data.user_email,
        user_id: data.user_id,
        risk_score: data.risk_score,
        device_info: data.device_info,
        location: data.location,
        timestamp: new Date()
      }
    };

    await this.createAlert(alert);
  }

  /**
   * Alert for rate limit exceeded
   */
  async alertRateLimitExceeded(data: {
    ip_address: string;
    endpoint: string;
    limit_type: string;
    attempt_count: number;
    location?: string;
  }): Promise<void> {
    const alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'> = {
      alert_type: 'rate_limit_exceeded',
      severity: 'medium',
      title: `🚦 Rate Limit Exceeded: ${data.endpoint}`,
      message: `Rate limit exceeded for ${data.limit_type} on ${data.endpoint}. IP: ${data.ip_address}, Attempts: ${data.attempt_count}`,
      details: {
        ip_address: data.ip_address,
        attempt_count: data.attempt_count,
        location: data.location,
        timestamp: new Date()
      }
    };

    await this.createAlert(alert);
  }

  /**
   * Alert for account locked
   */
  async alertAccountLocked(data: {
    user_email: string;
    user_id: string;
    lockout_duration: number;
    attempt_count: number;
    ip_address: string;
    location?: string;
  }): Promise<void> {
    const alert: Omit<AdminAlert, '_id' | 'created_at' | 'is_read'> = {
      alert_type: 'account_locked',
      severity: 'high',
      title: `🔒 Account Locked: ${data.user_email}`,
      message: `Account ${data.user_email} has been locked for ${Math.round(data.lockout_duration / 60000)} minutes after ${data.attempt_count} failed attempts`,
      details: {
        user_email: data.user_email,
        user_id: data.user_id,
        ip_address: data.ip_address,
        attempt_count: data.attempt_count,
        lockout_duration: data.lockout_duration,
        location: data.location,
        timestamp: new Date()
      }
    };

    await this.createAlert(alert);
  }

  /**
   * Get alerts for admin
   */
  async getAlerts(adminId: string, options: {
    limit?: number;
    offset?: number;
    severity?: string;
    alert_type?: string;
    unread_only?: boolean;
  } = {}): Promise<AdminAlert[]> {
    const client = await clientPromise;
    if (!client) {
      return [];
    }

    const collection = client.db(DB_NAME).collection<AdminAlert>('admin_alerts');
    const query: any = {};

    if (options.severity) {
      query.severity = options.severity;
    }

    if (options.alert_type) {
      query.alert_type = options.alert_type;
    }

    if (options.unread_only) {
      query.is_read = false;
    }

    return await collection.find(query)
      .sort({ created_at: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 50)
      .toArray();
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string, adminId: string): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      return false;
    }

    const collection = client.db(DB_NAME).collection<AdminAlert>('admin_alerts');

    // Handle adminId - if it's an email, store as string, otherwise try ObjectId
    let readByValue: string | ObjectId;
    try {
      // Try to create ObjectId if it looks like one
      if (adminId.length === 24 && /^[0-9a-fA-F]{24}$/.test(adminId)) {
        readByValue = new ObjectId(adminId);
      } else {
        // Store as string (email or other identifier)
        readByValue = adminId;
      }
    } catch {
      // If ObjectId creation fails, store as string
      readByValue = adminId;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(alertId) },
      { 
        $set: { 
          is_read: true,
          read_at: new Date(),
          read_by: readByValue
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(): Promise<{
    total: number;
    unread: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    recent_24h: number;
  }> {
    const client = await clientPromise;
    if (!client) {
      return {
        total: 0,
        unread: 0,
        by_severity: {},
        by_type: {},
        recent_24h: 0
      };
    }

    const collection = client.db(DB_NAME).collection<AdminAlert>('admin_alerts');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, unread, bySeverity, byType, recent24h] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ is_read: false }),
      collection.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$alert_type', count: { $sum: 1 } } }
      ]).toArray(),
      collection.countDocuments({ created_at: { $gte: oneDayAgo } })
    ]);

    return {
      total,
      unread,
      by_severity: bySeverity.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      by_type: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recent_24h: recent24h
    };
  }

  /**
   * Send real-time notification to online admins
   */
  private async sendRealTimeNotification(alert: Omit<AdminAlert, '_id'>): Promise<void> {
    // In a real implementation, this would use WebSockets or Server-Sent Events
    // For now, we'll just log it
    console.log(`🔔 Real-time alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send email alerts to subscribed admins
   */
  private async sendEmailAlerts(alert: Omit<AdminAlert, '_id'>): Promise<void> {
    try {
      // For now, just log the alert instead of sending emails
      console.log(`📧 Admin Alert: ${alert.title} - ${alert.message}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Type: ${alert.alert_type}`);
      console.log(`   Details:`, alert.details);
      
      // TODO: Implement email sending when email service is ready
      /*
      const client = await clientPromise;
      if (!client) return;

      // Get admin alert preferences
      const preferencesCollection = client.db(DB_NAME).collection<AlertPreferences>('admin_alert_preferences');
      const admins = await preferencesCollection.find({
        email_alerts: true,
        [`alert_types.${alert.alert_type}`]: true,
        severity_threshold: { $lte: alert.severity }
      }).toArray();

      // Get admin emails
      const adminCollection = client.db(DB_NAME).collection('admins');
      const adminEmails = await adminCollection.find({
        _id: { $in: admins.map(a => a.admin_id) },
        is_active: true
      }).toArray();

      // Send email to each admin
      for (const admin of adminEmails) {
        await sendEmail({
          to: admin.email,
          subject: `🚨 Blood Node Security Alert: ${alert.title}`,
          template: 'security_alert',
          data: {
            alert_title: alert.title,
            alert_message: alert.message,
            alert_severity: alert.severity,
            alert_type: alert.alert_type,
            details: alert.details,
            timestamp: alert.created_at
          }
        });
      }
      */
    } catch (error) {
      console.error('Failed to send email alerts:', error);
    }
  }

  /**
   * Set admin alert preferences
   */
  async setAlertPreferences(adminId: string, preferences: Partial<AlertPreferences>): Promise<boolean> {
    const client = await clientPromise;
    if (!client) {
      return false;
    }

    const collection = client.db(DB_NAME).collection<AlertPreferences>('admin_alert_preferences');

    const result = await collection.updateOne(
      { admin_id: new ObjectId(adminId) },
      { 
        $set: {
          ...preferences,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  /**
   * Get admin alert preferences
   */
  async getAlertPreferences(adminId: string): Promise<AlertPreferences | null> {
    const client = await clientPromise;
    if (!client) {
      return null;
    }

    const collection = client.db(DB_NAME).collection<AlertPreferences>('admin_alert_preferences');
    return await collection.findOne({ admin_id: new ObjectId(adminId) });
  }
}
