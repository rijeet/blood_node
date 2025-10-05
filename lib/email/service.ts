// Email service using Resend
import { Resend } from 'resend';
import {
  createVerificationEmailTemplate,
  createVerificationCodeEmailTemplate,
  createPasswordRecoveryEmailTemplate,
  createRecoveryCodeEmailTemplate,
  createFamilyInviteEmailTemplate,
  createWelcomeEmailTemplate,
  EmailTemplateData
} from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailDeliveryStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  email: string;
  subject: string;
  sent_at?: string;
  delivered_at?: string;
  last_event?: string;
  error?: string;
}

export interface EmailRetryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: EmailRetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

/**
 * Sleep function for retry delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send email using Resend with retry functionality
 */
export async function sendEmail({ to, subject, html, from = 'Blood Node <onboarding@resend.dev>' }: EmailTemplate, retryConfig: EmailRetryConfig = DEFAULT_RETRY_CONFIG) {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      if (!process.env.RESEND_API_KEY) {
        const error = 'Email service not configured - RESEND_API_KEY missing';
        console.warn('RESEND_API_KEY not configured, email not sent');
        return { success: false, error, attempt, maxRetries: retryConfig.maxRetries };
      }

      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        lastError = error;
        console.error(`Email send error (attempt ${attempt + 1}):`, error);
        
        // Don't retry for certain types of errors
        if (isNonRetryableError(error)) {
          return { 
            success: false, 
            error: error.message, 
            attempt: attempt + 1, 
            maxRetries: retryConfig.maxRetries,
            nonRetryable: true 
          };
        }
        
        // If this isn't the last attempt, wait and retry
        if (attempt < retryConfig.maxRetries) {
          const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
          console.log(`Retrying email send in ${delay}ms (attempt ${attempt + 2}/${retryConfig.maxRetries + 1})`);
          await sleep(delay);
          continue;
        }
        
        return { 
          success: false, 
          error: error.message, 
          attempt: attempt + 1, 
          maxRetries: retryConfig.maxRetries 
        };
      }

      console.log(`Email sent successfully on attempt ${attempt + 1}:`, data?.id);
      return { 
        success: true, 
        data, 
        attempt: attempt + 1, 
        maxRetries: retryConfig.maxRetries 
      };
      
    } catch (error) {
      lastError = error;
      console.error(`Email service error (attempt ${attempt + 1}):`, error);
      
      // If this isn't the last attempt, wait and retry
      if (attempt < retryConfig.maxRetries) {
        const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        console.log(`Retrying email send in ${delay}ms (attempt ${attempt + 2}/${retryConfig.maxRetries + 1})`);
        await sleep(delay);
        continue;
      }
    }
  }
  
  return { 
    success: false, 
    error: lastError?.message || 'Failed to send email after all retry attempts', 
    attempt: retryConfig.maxRetries + 1, 
    maxRetries: retryConfig.maxRetries 
  };
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  const nonRetryableErrors = [
    'invalid_email',
    'invalid_from_address', 
    'blacklisted_email',
    'blocked_email',
    'unsubscribed_email',
    'suppressed_email'
  ];
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorType = error?.type?.toLowerCase() || '';
  
  return nonRetryableErrors.some(nonRetryable => 
    errorMessage.includes(nonRetryable) || errorType.includes(nonRetryable)
  );
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(email: string, token: string, baseUrl: string = 'http://localhost:3000') {
  const verificationUrl = `${baseUrl}/verify?token=${token}`;
  
  const html = createVerificationEmailTemplate({
    title: 'Email Verification',
    verificationUrl,
    expiryHours: 1
  });

  return sendEmail({
    to: email,
    subject: '🩸 Verify your Blood Node account',
    html
  });
}

/**
 * Send password recovery email
 */
export async function sendPasswordRecoveryEmail(email: string, token: string, baseUrl: string = 'http://localhost:3000') {
  const recoveryUrl = `${baseUrl}/recover?token=${token}`;
  
  const html = createPasswordRecoveryEmailTemplate({
    title: 'Account Recovery',
    recoveryUrl,
    expiryHours: 1
  });

  return sendEmail({
    to: email,
    subject: '🔒 Reset your Blood Node password',
    html
  });
}

/**
 * Send family member invitation
 */
export async function sendFamilyInviteEmail(
  inviterName: string,
  recipientEmail: string, 
  token: string, 
  relation: string,
  baseUrl: string = 'http://localhost:3000'
) {
  const html = createFamilyInviteEmailTemplate({
    title: 'Family Network Invitation',
    inviterName,
    relation,
    inviteToken: token,
    expiryHours: 24,
    baseUrl
  });

  return sendEmail({
    to: recipientEmail,
    subject: `🩸 ${inviterName} invited you to join their Blood Node family network`,
    html
  });
}

/**
 * Send batch emails using Resend
 */
export async function sendBatchEmails(emails: EmailTemplate[]) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, batch emails not sent');
      return { success: false, error: 'Email service not configured' };
    }

    if (emails.length === 0) {
      return { success: false, error: 'No emails to send' };
    }

    // Format emails for Resend batch API
    const batchEmails = emails.map(email => ({
      from: email.from || 'Blood Node <onboarding@resend.dev>',
      to: [email.to],
      subject: email.subject,
      html: email.html,
    }));

    const { data, error } = await resend.batch.send(batchEmails);

    if (error) {
      console.error('Batch email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Batch emails sent successfully:', data?.length, 'emails');
    return { success: true, data };
  } catch (error) {
    console.error('Batch email service error:', error);
    return { success: false, error: 'Failed to send batch emails' };
  }
}

/**
 * Retrieve email status from Resend
 */
export async function getEmailStatus(emailId: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.get(emailId);

    if (error) {
      console.error('Get email status error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email status service error:', error);
    return { success: false, error: 'Failed to get email status' };
  }
}

/**
 * Cancel a scheduled email
 */
export async function cancelEmail(emailId: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.cancel(emailId);

    if (error) {
      console.error('Cancel email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email cancelled successfully:', emailId);
    return { success: true, data };
  } catch (error) {
    console.error('Cancel email service error:', error);
    return { success: false, error: 'Failed to cancel email' };
  }
}

/**
 * Send scheduled email
 */
export async function sendScheduledEmail({ to, subject, html, from = 'Blood Node <onboarding@resend.dev>', scheduledAt }: EmailTemplate & { scheduledAt: string }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, scheduled email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      scheduledAt,
    });

    if (error) {
      console.error('Scheduled email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Scheduled email created successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Scheduled email service error:', error);
    return { success: false, error: 'Failed to send scheduled email' };
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code email (alternative to token-based verification)
 */
export async function sendVerificationCodeEmail(email: string, code: string, expiryMinutes: number = 15) {
  const html = createVerificationCodeEmailTemplate({
    title: 'Email Verification Code',
    verificationCode: code,
    expiryMinutes
  });

  return sendEmail({
    to: email,
    subject: `🩸 Your Blood Node verification code: ${code}`,
    html
  });
}

/**
 * Send password recovery code email
 */
export async function sendRecoveryCodeEmail(email: string, code: string, expiryMinutes: number = 15) {
  const html = createRecoveryCodeEmailTemplate({
    title: 'Account Recovery Code',
    verificationCode: code,
    expiryMinutes
  });

  return sendEmail({
    to: email,
    subject: `🔒 Your Blood Node recovery code: ${code}`,
    html
  });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, userCode: string) {
  const html = createWelcomeEmailTemplate({
    title: 'Welcome to Blood Node!',
    userCode
  });

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Blood Node - Account Verified!',
    html
  });
}
