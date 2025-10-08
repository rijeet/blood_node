'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LoginSecurityAlert {
  id: string;
  type: 'failed_login' | 'account_locked';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  details: {
    attempt_count: number;
    lockout_duration?: string;
    timestamp: string;
  };
  dismissible: boolean;
  auto_dismiss_after?: number;
}

interface LoginSecurityAlertsProps {
  userEmail?: string;
  onDismiss?: (alertId: string) => void;
}

export function LoginSecurityAlerts({ userEmail, onDismiss }: LoginSecurityAlertsProps) {
  const [alerts, setAlerts] = useState<LoginSecurityAlert[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check for real user-specific security alerts
    const checkUserAlerts = async () => {
      if (!userEmail) {
        setAlerts([]);
        return;
      }

      try {
        const response = await fetch(`/api/auth/login-attempts?email=${encodeURIComponent(userEmail)}`);
        
        if (!response.ok) {
          console.error('Failed to fetch login attempts');
          return;
        }

        const data = await response.json();
        const newAlerts: LoginSecurityAlert[] = [];

        // Show failed login attempts alert
        if (data.failed_attempts >= 3) {
          newAlerts.push({
            id: `login_alert_${Date.now()}`,
            type: 'failed_login',
            severity: data.failed_attempts >= 5 ? 'high' : data.failed_attempts >= 3 ? 'medium' : 'low',
            title: `Login Attempts: ${data.failed_attempts}`,
            message: `You have ${data.failed_attempts} failed login attempts. ${data.failed_attempts >= 5 ? 'Your account may be locked.' : 'Please check your credentials.'}`,
            details: {
              attempt_count: data.failed_attempts,
              timestamp: new Date().toISOString()
            },
            dismissible: true,
            auto_dismiss_after: 10000
          });
        }

        // Show account lockout alert
        if (data.is_locked) {
          const lockoutDuration = data.lockout_until ? 
            Math.ceil((new Date(data.lockout_until).getTime() - Date.now()) / (1000 * 60)) : 15;
          
          newAlerts.push({
            id: `lockout_alert_${Date.now()}`,
            type: 'account_locked',
            severity: 'high',
            title: 'Account Temporarily Locked',
            message: `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${lockoutDuration} minutes.`,
            details: {
              attempt_count: data.failed_attempts,
              lockout_duration: `${lockoutDuration} minutes`,
              timestamp: new Date().toISOString()
            },
            dismissible: true,
            auto_dismiss_after: 15000
          });
        }

        setAlerts(newAlerts);
      } catch (error) {
        console.error('Error checking user alerts:', error);
      }
    };

    checkUserAlerts();
  }, [userEmail]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    onDismiss?.(alertId);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-700 dark:text-red-300'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100',
          text: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          text: 'text-blue-700 dark:text-blue-300'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-900 dark:text-gray-100',
          text: 'text-gray-700 dark:text-gray-300'
        };
    }
  };

  if (!isVisible || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full space-y-2">
      {alerts.map(alert => {
        const styles = getSeverityStyles(alert.severity);
        
        return (
          <Card 
            key={alert.id} 
            className={`${styles.bg} ${styles.border} border-l-4 border-l-current p-4 animate-in slide-in-from-top-2 duration-300`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`${styles.title} font-semibold text-sm`}>
                    {alert.title}
                  </h4>
                  
                  <p className={`${styles.text} text-sm mt-1`}>
                    {alert.message}
                  </p>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <User className="h-3 w-3" />
                      <span className={styles.text}>
                        {alert.details.attempt_count} failed attempts
                      </span>
                    </div>
                    
                    {alert.details.lockout_duration && (
                      <div className="flex items-center space-x-2 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={styles.text}>
                          Locked for: {alert.details.lockout_duration}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span className={styles.text}>
                        {new Date(alert.details.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {alert.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className={`${styles.text} hover:${styles.bg} p-1`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
