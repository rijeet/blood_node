// Email notification service for Blood Node
// Handles sending notifications while maintaining privacy

import { sendEmail } from './service';
import { createPasswordChangeEmailTemplate } from './templates';

export interface NotificationRecipient {
  userCode: string;
  emailHash: string;
  name?: string;
}

export interface PasswordChangeNotificationData {
  userCode: string;
  changeTime: string;
  ipAddress: string;
}

/**
 * Send password change notification
 * In development: sends to verified email address
 * In production: would need proper email infrastructure
 */
export async function sendPasswordChangeNotification(
  recipient: NotificationRecipient,
  data: PasswordChangeNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTemplate = createPasswordChangeEmailTemplate({
      title: 'Password Changed Successfully',
      userCode: data.userCode,
      changeTime: data.changeTime,
      ipAddress: data.ipAddress
    });

    // For development: Use environment variable or fallback to verified email
    // In production: You would implement proper email lookup from email_hash
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'rijeet2025@gmail.com';
    
    console.log(`📧 Sending password change notification for user ${data.userCode} to ${notificationEmail}`);
    
    const result = await sendEmail({
      to: notificationEmail,
      subject: '🔒 Password Changed - Blood Node',
      html: emailTemplate,
      from: 'Blood Node <onboarding@resend.dev>'
    });

    if (result.success) {
      console.log('✅ Password change notification sent successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to send password change notification:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('❌ Password change notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Future implementation: Send notification using email hash
 * This would require a secure email lookup system
 */
export async function sendPasswordChangeNotificationByHash(
  emailHash: string,
  data: PasswordChangeNotificationData
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement secure email lookup from hash
  // This would require:
  // 1. A secure email mapping system
  // 2. Proper encryption/decryption of email addresses
  // 3. Compliance with privacy regulations
  
  console.log('📧 Email hash notification not implemented yet:', emailHash);
  return { success: false, error: 'Email hash notifications not implemented' };
}

/**
 * Get notification email for development
 */
export function getNotificationEmail(): string {
  return process.env.NOTIFICATION_EMAIL || 'rijeet2025@gmail.com';
}
