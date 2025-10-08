'use client';

import { useState, useEffect, useCallback } from 'react';
import { SecurityAlert } from '@/components/security/security-alert';
import { useAuthContext } from '@/lib/contexts/auth-context';

// Mock security alert service for client-side
class ClientSecurityAlertService {
  private static instance: ClientSecurityAlertService;
  private alerts: SecurityAlert[] = [];
  private listeners: ((alerts: SecurityAlert[]) => void)[] = [];

  static getInstance(): ClientSecurityAlertService {
    if (!ClientSecurityAlertService.instance) {
      ClientSecurityAlertService.instance = new ClientSecurityAlertService();
    }
    return ClientSecurityAlertService.instance;
  }

  subscribe(listener: (alerts: SecurityAlert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

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

    this.alerts.unshift(newAlert);
    
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    this.notifyListeners();
    return id;
  }

  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifyListeners();
  }

  clearAllAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }

  // Create user-specific login alerts
  createUserLoginAlert(email: string, attemptCount: number): string {
    return this.addAlert({
      type: 'failed_login',
      severity: attemptCount >= 5 ? 'high' : attemptCount >= 3 ? 'medium' : 'low',
      title: `Login Attempts: ${attemptCount}`,
      message: `You have ${attemptCount} failed login attempts. ${attemptCount >= 5 ? 'Your account may be locked.' : 'Please check your credentials.'}`,
      details: {
        ip_address: 'Your IP',
        attempt_count: attemptCount,
        user_agent: 'Your Browser',
        location: 'Your Location',
        timestamp: new Date().toISOString()
      },
      dismissible: true,
      auto_dismiss_after: 10000 // 10 seconds
    });
  }

  // Create admin alerts (all security events)
  createAdminAlert(type: SecurityAlert['type'], severity: SecurityAlert['severity'] = 'medium'): string {
    const alerts = {
      failed_login: {
        title: 'Multiple Failed Login Attempts: 5',
        message: 'Detected 5 failed login attempts from IP 192.168.1.100',
        details: {
          ip_address: '192.168.1.100',
          attempt_count: 5,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'Unknown',
          timestamp: new Date().toISOString()
        }
      },
      ip_blacklist: {
        title: 'IP Address Blacklisted: 192.168.1.100',
        message: 'IP address 192.168.1.100 has been automatically blacklisted due to: Brute force attack',
        details: {
          ip_address: '192.168.1.100',
          location: 'Unknown',
          timestamp: new Date().toISOString()
        }
      },
      account_lockout: {
        title: 'Account Locked: user@example.com',
        message: 'Account has been locked for 15 minutes due to 5 failed login attempts',
        details: {
          ip_address: '192.168.1.100',
          attempt_count: 5,
          lockout_duration: '15 minutes',
          timestamp: new Date().toISOString()
        }
      },
      suspicious_activity: {
        title: 'Suspicious Activity Detected: Unusual Login Pattern',
        message: 'Detected unusual login pattern from multiple IP addresses',
        details: {
          ip_address: '192.168.1.100',
          location: 'Unknown',
          timestamp: new Date().toISOString()
        }
      }
    };

    const alertData = alerts[type];
    if (alertData) {
      return this.addAlert({
        type,
        severity,
        title: alertData.title,
        message: alertData.message,
        details: alertData.details,
        dismissible: true,
        auto_dismiss_after: severity === 'critical' ? 30000 : 15000
      });
    }
    return '';
  }
}

export function useFilteredSecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, isAdmin, userEmail, currentPage, showSecurityAlerts } = useAuthContext();

  const alertService = ClientSecurityAlertService.getInstance();

  useEffect(() => {
    const unsubscribe = alertService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
    });

    setAlerts(alertService.getAlerts());
    setIsConnected(true);

    // Only simulate alerts if we should show them
    if (showSecurityAlerts) {
      if (currentPage === 'login' && !isAuthenticated) {
        // Show user-specific login alerts only on login page when not authenticated
        setTimeout(() => {
          alertService.createUserLoginAlert('user@example.com', 3);
        }, 2000);
      } else if (isAdmin && currentPage === 'admin') {
        // Show admin alerts only on admin pages when authenticated as admin
        setTimeout(() => {
          alertService.createAdminAlert('failed_login', 'medium');
        }, 2000);
        setTimeout(() => {
          alertService.createAdminAlert('ip_blacklist', 'high');
        }, 5000);
        setTimeout(() => {
          alertService.createAdminAlert('account_lockout', 'high');
        }, 8000);
      }
    } else {
      // Clear alerts if we shouldn't show them
      alertService.clearAllAlerts();
    }

    return () => {
      unsubscribe();
    };
  }, [alertService, showSecurityAlerts, currentPage, isAuthenticated, isAdmin]);

  const dismissAlert = useCallback((alertId: string) => {
    alertService.removeAlert(alertId);
  }, [alertService]);

  const clearAllAlerts = useCallback(() => {
    alertService.clearAllAlerts();
  }, [alertService]);

  // Filter alerts based on context
  const filteredAlerts = alerts.filter(alert => {
    if (currentPage === 'login' && !isAuthenticated) {
      // On login page, only show user-specific alerts
      return alert.type === 'failed_login' || alert.type === 'account_lockout';
    } else if (isAdmin && currentPage === 'admin') {
      // For admins, show all alerts
      return true;
    }
    return false;
  });

  return {
    alerts: filteredAlerts,
    isConnected,
    dismissAlert,
    clearAllAlerts,
    alertCount: filteredAlerts.length,
    showSecurityAlerts
  };
}
