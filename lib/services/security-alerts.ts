// Security alert service for real-time notifications
import { SecurityAlert } from '@/components/security/security-alert';

export class SecurityAlertService {
  private static instance: SecurityAlertService;
  private alerts: SecurityAlert[] = [];
  private listeners: ((alerts: SecurityAlert[]) => void)[] = [];

  static getInstance(): SecurityAlertService {
    if (!SecurityAlertService.instance) {
      SecurityAlertService.instance = new SecurityAlertService();
    }
    return SecurityAlertService.instance;
  }

  /**
   * Add a new security alert
   */
  addAlert(alert: Omit<SecurityAlert, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: SecurityAlert = {
      ...alert,
      id,
      details: {
        ...alert.details,
        timestamp: new Date().toISOString()
      }
    };

    this.alerts.unshift(newAlert); // Add to beginning
    
    // Limit to 50 alerts max
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    this.notifyListeners();
    return id;
  }

  /**
   * Remove an alert by ID
   */
  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifyListeners();
  }

  /**
   * Get all alerts
   */
  getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: SecurityAlert['type']): SecurityAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: SecurityAlert['severity']): SecurityAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  /**
   * Clear alerts by type
   */
  clearAlertsByType(type: SecurityAlert['type']): void {
    this.alerts = this.alerts.filter(alert => alert.type !== type);
    this.notifyListeners();
  }

  /**
   * Subscribe to alert changes
   */
  subscribe(listener: (alerts: SecurityAlert[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }

  /**
   * Create a failed login alert
   */
  createFailedLoginAlert(data: {
    ip_address: string;
    attempt_count: number;
    user_agent?: string;
    email?: string;
  }): string {
    const severity = data.attempt_count >= 10 ? 'critical' : 
                    data.attempt_count >= 7 ? 'high' : 
                    data.attempt_count >= 5 ? 'medium' : 'low';

    return this.addAlert({
      type: 'failed_login',
      severity,
      title: `Multiple Failed Login Attempts: ${data.attempt_count}`,
      message: `Detected ${data.attempt_count} failed login attempts from IP ${data.ip_address}${data.email ? ` for user ${data.email}` : ''}`,
      details: {
        ip_address: data.ip_address,
        attempt_count: data.attempt_count,
        user_agent: data.user_agent,
        location: 'Unknown', // Could be enhanced with IP geolocation
        timestamp: new Date().toISOString()
      },
      dismissible: true,
      auto_dismiss_after: severity === 'critical' ? 30000 : 15000 // 30s for critical, 15s for others
    });
  }

  /**
   * Create an IP blacklist alert
   */
  createIPBlacklistAlert(data: {
    ip_address: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): string {
    return this.addAlert({
      type: 'ip_blacklist',
      severity: data.severity,
      title: `IP Address Blacklisted: ${data.ip_address}`,
      message: `IP address ${data.ip_address} has been automatically blacklisted due to: ${data.reason}`,
      details: {
        ip_address: data.ip_address,
        location: 'Unknown',
        timestamp: new Date().toISOString()
      },
      dismissible: true,
      auto_dismiss_after: 60000 // 1 minute
    });
  }

  /**
   * Create an account lockout alert
   */
  createAccountLockoutAlert(data: {
    email?: string;
    ip_address: string;
    lockout_duration: string;
    attempt_count: number;
  }): string {
    return this.addAlert({
      type: 'account_lockout',
      severity: 'high',
      title: `Account Locked: ${data.email || 'Unknown User'}`,
      message: `Account has been locked for ${data.lockout_duration} due to ${data.attempt_count} failed login attempts`,
      details: {
        ip_address: data.ip_address,
        attempt_count: data.attempt_count,
        lockout_duration: data.lockout_duration,
        timestamp: new Date().toISOString()
      },
      dismissible: true,
      auto_dismiss_after: 45000 // 45 seconds
    });
  }

  /**
   * Create a suspicious activity alert
   */
  createSuspiciousActivityAlert(data: {
    activity_type: string;
    ip_address: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): string {
    return this.addAlert({
      type: 'suspicious_activity',
      severity: data.severity,
      title: `Suspicious Activity Detected: ${data.activity_type}`,
      message: data.details,
      details: {
        ip_address: data.ip_address,
        location: 'Unknown',
        timestamp: new Date().toISOString()
      },
      dismissible: true,
      auto_dismiss_after: 20000 // 20 seconds
    });
  }
}
