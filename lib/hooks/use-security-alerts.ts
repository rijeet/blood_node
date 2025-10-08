'use client';

import { useState, useEffect, useCallback } from 'react';
import { SecurityAlert } from '@/components/security/security-alert';

// Mock security alert service for client-side
// In a real implementation, this would connect to a WebSocket or Server-Sent Events
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
    
    // Return unsubscribe function
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
    
    // Limit to 50 alerts max
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

  // Simulate receiving alerts from server
  simulateAlert(type: SecurityAlert['type'], severity: SecurityAlert['severity'] = 'medium'): void {
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
      this.addAlert({
        type,
        severity,
        title: alertData.title,
        message: alertData.message,
        details: alertData.details,
        dismissible: true,
        auto_dismiss_after: severity === 'critical' ? 30000 : 15000
      });
    }
  }
}

export function useSecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const alertService = ClientSecurityAlertService.getInstance();

  useEffect(() => {
    // Subscribe to alert changes
    const unsubscribe = alertService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
    });

    // Initialize with current alerts
    setAlerts(alertService.getAlerts());
    setIsConnected(true);

    // Simulate some alerts for demonstration
    // In production, this would be replaced with real WebSocket/SSE connection
    const simulateAlerts = () => {
      setTimeout(() => {
        alertService.simulateAlert('failed_login', 'medium');
      }, 2000);

      setTimeout(() => {
        alertService.simulateAlert('ip_blacklist', 'high');
      }, 5000);

      setTimeout(() => {
        alertService.simulateAlert('account_lockout', 'high');
      }, 8000);
    };

    // Only simulate in development
    if (process.env.NODE_ENV === 'development') {
      simulateAlerts();
    }

    return () => {
      unsubscribe();
    };
  }, [alertService]);

  const dismissAlert = useCallback((alertId: string) => {
    alertService.removeAlert(alertId);
  }, [alertService]);

  const clearAllAlerts = useCallback(() => {
    alertService.clearAllAlerts();
  }, [alertService]);

  const getAlertsByType = useCallback((type: SecurityAlert['type']) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity: SecurityAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'critical');
  }, [alerts]);

  const getHighSeverityAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical');
  }, [alerts]);

  return {
    alerts,
    isConnected,
    dismissAlert,
    clearAllAlerts,
    getAlertsByType,
    getAlertsBySeverity,
    getCriticalAlerts,
    getHighSeverityAlerts,
    alertCount: alerts.length,
    criticalCount: getCriticalAlerts().length,
    highSeverityCount: getHighSeverityAlerts().length
  };
}
