'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SecurityAlertPanel } from './security-alert';
import { useFilteredSecurityAlerts } from '@/lib/hooks/use-filtered-security-alerts';
import { SecurityAlert } from './security-alert';

interface SecurityAlertContextType {
  alerts: SecurityAlert[];
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  alertCount: number;
  isConnected: boolean;
  showSecurityAlerts: boolean;
}

const SecurityAlertContext = createContext<SecurityAlertContextType | undefined>(undefined);

export function useSecurityAlertContext() {
  const context = useContext(SecurityAlertContext);
  if (context === undefined) {
    throw new Error('useSecurityAlertContext must be used within a SecurityAlertProvider');
  }
  return context;
}

interface SecurityAlertProviderProps {
  children: ReactNode;
  showAlerts?: boolean;
  maxAlerts?: number;
}

export function SecurityAlertProvider({ 
  children, 
  showAlerts = true, 
  maxAlerts = 5 
}: SecurityAlertProviderProps) {
  const securityAlerts = useFilteredSecurityAlerts();

  const handleViewDetails = (alert: SecurityAlert) => {
    console.log('View details for alert:', alert);
    // In a real implementation, this would open a detailed view or modal
    // For now, just log to console
  };

  return (
    <SecurityAlertContext.Provider value={securityAlerts}>
      {children}
      
      {showAlerts && securityAlerts.showSecurityAlerts && securityAlerts.alerts.length > 0 && (
        <SecurityAlertPanel
          alerts={securityAlerts.alerts}
          onDismiss={securityAlerts.dismissAlert}
          onViewDetails={handleViewDetails}
          maxAlerts={maxAlerts}
        />
      )}
    </SecurityAlertContext.Provider>
  );
}
