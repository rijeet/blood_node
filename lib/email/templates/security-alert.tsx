import React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';

interface SecurityAlertEmailProps {
  alert_title: string;
  alert_message: string;
  alert_severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: string;
  details: {
    ip_address?: string;
    user_email?: string;
    attempt_count?: number;
    risk_score?: number;
    location?: string;
    timestamp: Date;
  };
  timestamp: Date;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#dc2626'; // red-600
    case 'high': return '#ea580c'; // orange-600
    case 'medium': return '#d97706'; // amber-600
    case 'low': return '#059669'; // emerald-600
    default: return '#6b7280'; // gray-500
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '🔶';
    case 'low': return 'ℹ️';
    default: return '📢';
  }
};

export const SecurityAlertEmail = ({
  alert_title,
  alert_message,
  alert_severity,
  alert_type,
  details,
  timestamp
}: SecurityAlertEmailProps) => {
  const severityColor = getSeverityColor(alert_severity);
  const severityIcon = getSeverityIcon(alert_severity);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerTitle}>
              🛡️ Blood Node Security Alert
            </Text>
            <Text style={headerSubtitle}>
              Real-time Security Monitoring System
            </Text>
          </Section>

          {/* Alert Card */}
          <Section style={alertCard}>
            <div style={{
              ...alertHeader,
              borderLeftColor: severityColor
            }}>
              <Text style={alertTitle}>
                {severityIcon} {alert_title}
              </Text>
              <Text style={{
                ...alertSeverity,
                color: severityColor
              }}>
                {alert_severity.toUpperCase()} SEVERITY
              </Text>
            </div>

            <Section style={alertBody}>
              <Text style={alertMessage}>
                {alert_message}
              </Text>

              {/* Alert Details */}
              <Section style={detailsSection}>
                <Text style={detailsTitle}>Alert Details:</Text>
                
                {details.ip_address && (
                  <Text style={detailItem}>
                    <strong>IP Address:</strong> {details.ip_address}
                  </Text>
                )}
                
                {details.user_email && (
                  <Text style={detailItem}>
                    <strong>User Email:</strong> {details.user_email}
                  </Text>
                )}
                
                {details.attempt_count && (
                  <Text style={detailItem}>
                    <strong>Attempt Count:</strong> {details.attempt_count}
                  </Text>
                )}
                
                {details.risk_score && (
                  <Text style={detailItem}>
                    <strong>Risk Score:</strong> {details.risk_score}/100
                  </Text>
                )}
                
                {details.location && (
                  <Text style={detailItem}>
                    <strong>Location:</strong> {details.location}
                  </Text>
                )}
                
                <Text style={detailItem}>
                  <strong>Alert Type:</strong> {alert_type.replace('_', ' ').toUpperCase()}
                </Text>
                
                <Text style={detailItem}>
                  <strong>Timestamp:</strong> {timestamp.toLocaleString()}
                </Text>
              </Section>

              {/* Action Buttons */}
              <Section style={actionSection}>
                <Button
                  href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/security/alerts`}
                  style={primaryButton}
                >
                  View Security Dashboard
                </Button>
                
                <Button
                  href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/security/ip-blacklist`}
                  style={secondaryButton}
                >
                  Manage IP Blacklist
                </Button>
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              This is an automated security alert from Blood Node.
              <br />
              If you did not expect this alert, please contact your system administrator immediately.
            </Text>
            <Text style={footerText}>
              Blood Node Security System • {new Date().getFullYear()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1e293b',
  padding: '32px 24px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const headerSubtitle = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '0',
};

const alertCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '0 0 8px 8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const alertHeader = {
  padding: '24px',
  borderLeft: '4px solid #3b82f6',
  backgroundColor: '#f8fafc',
};

const alertTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 8px 0',
};

const alertSeverity = {
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const alertBody = {
  padding: '24px',
};

const alertMessage = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
};

const detailsSection = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '6px',
  margin: '0 0 24px 0',
};

const detailsTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 12px 0',
};

const detailItem = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
};

const actionSection = {
  textAlign: 'center' as const,
  margin: '24px 0 0 0',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 8px 8px 0',
  display: 'inline-block',
};

const secondaryButton = {
  backgroundColor: '#6b7280',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 8px 8px 0',
  display: 'inline-block',
};

const footer = {
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '0 0 16px 0',
};

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
};

export default SecurityAlertEmail;

// Template function for email service
export const createSecurityAlertEmailTemplate = (data: SecurityAlertEmailProps) => {
  return {
    subject: `🚨 Blood Node Security Alert: ${data.alert_title}`,
    html: SecurityAlertEmail(data)
  };
};
