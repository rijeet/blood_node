# Blood Node - Complete Email API Guide

## 📧 Enhanced Email System with Resend API

This guide covers the comprehensive email functionality implemented in Blood Node, including verification codes, recovery codes, family invitations, batch sending, and email tracking.

## 🚀 **Features Overview**

### ✅ **Core Email Features**
- **Resend API Integration** - Professional email delivery service
- **Template System** - Reusable, maintainable email templates
- **Batch Email Sending** - Send multiple emails efficiently
- **Email Tracking** - Monitor delivery status and events
- **Retry Mechanism** - Automatic retry with exponential backoff
- **Verification Codes** - 6-digit numeric codes for verification
- **Recovery Codes** - Secure account recovery process
- **Scheduled Emails** - Send emails at specific times
- **Email Cancellation** - Cancel scheduled emails

### 🔒 **Security Features**
- **Email Enumeration Protection** - Consistent responses regardless of user existence
- **Token Expiration** - Time-limited verification tokens
- **Rate Limiting** - Protection against spam and abuse
- **Non-retryable Error Detection** - Smart error classification
- **End-to-End Encryption Support** - Respects client-side encryption

## 📚 **API Endpoints**

### 1. **Authentication Endpoints**

#### **Email Verification (Token-based)**
```http
POST /api/auth/verify
GET  /api/auth/verify?token={token}
```

#### **Email Verification (Code-based)**
```http
POST /api/auth/verify-code    # Send verification code
PUT  /api/auth/verify-code    # Verify code
GET  /api/auth/verify-code?email={email}  # Check status
```

#### **Password Recovery (Token-based)**
```http
POST /api/auth/recover
GET  /api/auth/recover?token={token}
```

#### **Password Recovery (Code-based)**
```http
POST /api/auth/recovery-code  # Send recovery code
PUT  /api/auth/recovery-code  # Verify code
GET  /api/auth/recovery-code?email={email}  # Check status
```

### 2. **Email Management**

#### **Email Operations**
```http
GET    /api/emails                    # Get email statistics
POST   /api/emails                    # Send single/batch emails
DELETE /api/emails?id={emailId}       # Cancel scheduled email
GET    /api/emails?id={emailId}&action=status  # Get email status
```

### 3. **Family Invitations**
```http
POST /api/invites/send     # Send family invitation
GET  /api/invites/send     # Get invitation statistics
```

## 🔧 **Email Service Functions**

### **Core Functions**
```typescript
// Basic email sending with retry
sendEmail(emailTemplate, retryConfig?)

// Batch email sending
sendBatchEmails(emailTemplates[])

// Email status tracking
getEmailStatus(emailId)

// Cancel scheduled email
cancelEmail(emailId)

// Send scheduled email
sendScheduledEmail(emailTemplate, scheduledAt)
```

### **Verification Functions**
```typescript
// Token-based verification
sendVerificationEmail(email, token, baseUrl)

// Code-based verification  
sendVerificationCodeEmail(email, code, expiryMinutes)
generateVerificationCode() // Returns 6-digit code
```

### **Recovery Functions**
```typescript
// Token-based recovery
sendPasswordRecoveryEmail(email, token, baseUrl)

// Code-based recovery
sendRecoveryCodeEmail(email, code, expiryMinutes)
```

### **Other Functions**
```typescript
// Family invitations
sendFamilyInviteEmail(inviterName, email, token, relation, baseUrl)

// Welcome email
sendWelcomeEmail(email, userCode)
```

## 📝 **Email Templates**

### **Template Components**
All emails use reusable template components from `lib/email/templates.ts`:

- `createBaseTemplate()` - Base HTML structure
- `createHeader()` - Email header with Blood Node branding
- `createFooter()` - Consistent footer
- `createVerificationButton()` - CTA buttons for verification
- `createVerificationCodeDisplay()` - Formatted code display
- `createSecurityNotice()` - Security warnings and notices
- `createFeaturesList()` - Blood Node features list
- `createNextSteps()` - Onboarding guidance

### **Available Templates**
- `createVerificationEmailTemplate()` - Email verification with link
- `createVerificationCodeEmailTemplate()` - Email verification with code
- `createPasswordRecoveryEmailTemplate()` - Password recovery with link
- `createRecoveryCodeEmailTemplate()` - Password recovery with code
- `createFamilyInviteEmailTemplate()` - Family network invitations
- `createWelcomeEmailTemplate()` - Welcome email after verification

## 🔄 **Retry Mechanism**

### **Default Configuration**
```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,      // 1 second
  backoffMultiplier: 2   // Exponential backoff
}
```

### **Retry Behavior**
- **Retryable Errors**: Network issues, temporary server errors
- **Non-retryable Errors**: Invalid email, blacklisted address, unsubscribed
- **Exponential Backoff**: 1s, 2s, 4s delays between attempts
- **Smart Classification**: Automatically identifies error types

### **Custom Retry Config**
```typescript
const customRetry = {
  maxRetries: 5,
  retryDelay: 2000,
  backoffMultiplier: 1.5
};

await sendEmail(emailTemplate, customRetry);
```

## 📊 **Email Tracking**

### **Delivery Status Types**
- `pending` - Email queued for sending
- `sent` - Email sent successfully
- `delivered` - Email delivered to recipient
- `bounced` - Email bounced back
- `complained` - Recipient marked as spam
- `failed` - Delivery failed

### **Tracking Data**
```typescript
interface EmailDeliveryStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  email: string;
  subject: string;
  sent_at?: string;
  delivered_at?: string;
  last_event?: string;
  error?: string;
}
```

## 🛡️ **Security Implementation**

### **Email Enumeration Protection**
```typescript
// Always return success for recovery requests
const successResponse = {
  success: true,
  message: 'If an account with that email exists, we\'ve sent recovery instructions.'
};

if (!user) {
  console.log('Recovery requested for non-existent email:', email);
  return NextResponse.json(successResponse);
}
```

### **Token Security**
- **Unique Generation**: Cryptographically secure tokens
- **Email Hash Storage**: No plaintext email storage
- **Time-based Expiry**: Automatic token expiration
- **Single Use**: Tokens invalidated after use

### **Rate Limiting** (Recommended Implementation)
```typescript
// Implement rate limiting per email/IP
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // Max 5 verification requests per window
};
```

## 📱 **Usage Examples**

### **Send Verification Code**
```typescript
// Send verification code
const response = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Verify the code
const verifyResponse = await fetch('/api/auth/verify-code', {
  method: 'PUT', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    code: '123456' 
  })
});
```

### **Send Batch Emails**
```typescript
const emails = [
  {
    to: 'user1@example.com',
    subject: 'Welcome to Blood Node',
    html: '<h1>Welcome!</h1>'
  },
  {
    to: 'user2@example.com', 
    subject: 'Family Invitation',
    html: '<h1>You\'re invited!</h1>'
  }
];

const response = await fetch('/api/emails', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    type: 'batch', 
    emails 
  })
});
```

### **Check Email Status**
```typescript
const response = await fetch(`/api/emails?id=${emailId}&action=status`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { email } = await response.json();
console.log('Email status:', email.status);
console.log('Delivered at:', email.delivered_at);
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Required
RESEND_API_KEY=re_your_api_key_here

# Optional
NEXTAUTH_URL=http://localhost:3000  # For email links
DB_NAME=blood_node                  # Database name
```

### **MongoDB Collections**
- `verification_tokens` - Stores all verification and recovery tokens
- Automatic cleanup of expired tokens
- Indexed for optimal performance

## 🚀 **Getting Started**

### 1. **Set up Resend API**
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to environment variables

### 2. **Test Email Sending**
```typescript
import { sendEmail } from '@/lib/email/service';

const result = await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Hello from Blood Node!</h1>'
});

console.log('Email sent:', result.success);
```

### 3. **Use Templates**
```typescript
import { createVerificationEmailTemplate } from '@/lib/email/templates';

const html = createVerificationEmailTemplate({
  title: 'Verify Your Account',
  verificationUrl: 'https://app.com/verify?token=abc123',
  expiryHours: 1
});
```

## 📈 **Production Considerations**

### **Performance**
- Use batch sending for multiple emails
- Implement email queues for high volume
- Monitor delivery rates and bounces

### **Monitoring**
- Track email delivery success rates
- Monitor bounce and complaint rates
- Set up alerts for failed deliveries

### **Compliance**
- Implement unsubscribe mechanisms
- Follow CAN-SPAM and GDPR guidelines
- Respect user email preferences

## 🔍 **Troubleshooting**

### **Common Issues**
1. **API Key Not Working**
   - Verify key is correct in environment
   - Check Resend account status

2. **Emails Not Delivered**
   - Check spam folders
   - Verify recipient email addresses
   - Monitor bounce rates

3. **Template Errors**
   - Validate HTML syntax
   - Test templates with different data

### **Debug Mode**
Enable detailed logging:
```typescript
console.log('Email send attempt:', { to, subject, attempt });
console.log('Email result:', result);
```

## 🎯 **Next Steps**

This comprehensive email system provides:
- ✅ **Production-ready** email functionality
- ✅ **Security-first** approach
- ✅ **Scalable** architecture
- ✅ **Maintainable** codebase
- ✅ **User-friendly** experience

Your Blood Node application now has enterprise-grade email capabilities! 🩸
