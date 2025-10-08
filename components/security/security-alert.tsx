'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, X, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'ip_blacklist' | 'suspicious_activity' | 'account_lockout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: {
    ip_address?: string;
    user_agent?: string;
    attempt_count?: number;
    lockout_duration?: string;
    location?: string;
    timestamp: string;
  };
  dismissible: boolean;
  auto_dismiss_after?: number; // milliseconds
}

interface SecurityAlertProps {
  alert: SecurityAlert;
  onDismiss: (alertId: string) => void;
  onViewDetails?: (alert: SecurityAlert) => void;
}

export function SecurityAlertComponent({ alert, onDismiss, onViewDetails }: SecurityAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (alert.auto_dismiss_after) {
      setTimeRemaining(alert.auto_dismiss_after);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1000) {
            setIsVisible(false);
            // Use setTimeout to avoid calling onDismiss during render
            setTimeout(() => onDismiss(alert.id), 0);
            return null;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [alert.auto_dismiss_after, alert.id, onDismiss]);

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-700 dark:text-red-300'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-900 dark:text-orange-100',
          text: 'text-orange-700 dark:text-orange-300'
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
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'failed_login':
        return <AlertTriangle className="h-5 w-5" />;
      case 'ip_blacklist':
        return <Shield className="h-5 w-5" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-5 w-5" />;
      case 'account_lockout':
        return <Clock className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.ceil(minutes / 60);
    return `${hours}h`;
  };

  if (!isVisible) return null;

  const styles = getSeverityStyles();

  return (
    <Card className={`${styles.bg} ${styles.border} border-l-4 border-l-current p-4 mb-4 animate-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`${styles.title} font-semibold text-sm`}>
                {alert.title}
              </h4>
              {timeRemaining !== null && (
                <span className={`${styles.text} text-xs font-mono`}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              )}
            </div>
            
            <p className={`${styles.text} text-sm mt-1`}>
              {alert.message}
            </p>
            
            <div className="mt-3 space-y-1">
              {alert.details.ip_address && (
                <div className="flex items-center space-x-2 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span className={styles.text}>IP: {alert.details.ip_address}</span>
                </div>
              )}
              
              {alert.details.attempt_count && (
                <div className="flex items-center space-x-2 text-xs">
                  <User className="h-3 w-3" />
                  <span className={styles.text}>
                    {alert.details.attempt_count} failed attempts
                  </span>
                </div>
              )}
              
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
        
        <div className="flex items-center space-x-2 ml-4">
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(alert)}
              className={`${styles.text} hover:${styles.bg} text-xs`}
            >
              Details
            </Button>
          )}
          
          {alert.dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className={`${styles.text} hover:${styles.bg} p-1`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface SecurityAlertPanelProps {
  alerts: SecurityAlert[];
  onDismiss: (alertId: string) => void;
  onViewDetails?: (alert: SecurityAlert) => void;
  maxAlerts?: number;
}

export function SecurityAlertPanel({ 
  alerts, 
  onDismiss, 
  onViewDetails, 
  maxAlerts = 5 
}: SecurityAlertPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleAlerts = isExpanded ? alerts : alerts.slice(0, maxAlerts);
  const hiddenCount = alerts.length - maxAlerts;

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full space-y-2">
      {visibleAlerts.map(alert => (
        <SecurityAlertComponent
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onViewDetails={onViewDetails}
        />
      ))}
      
      {hiddenCount > 0 && (
        <Card className="p-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 dark:text-gray-400"
          >
            {isExpanded ? 'Show Less' : `Show ${hiddenCount} More Alerts`}
          </Button>
        </Card>
      )}
    </div>
  );
}
