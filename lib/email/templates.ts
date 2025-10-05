// Email templates for Blood Node

export interface EmailTemplateData {
  title: string;
  [key: string]: any;
}

export interface VerificationEmailData extends EmailTemplateData {
  verificationUrl: string;
  expiryHours: number;
}

export interface VerificationCodeEmailData extends EmailTemplateData {
  verificationCode: string;
  expiryMinutes: number;
}

export interface PasswordRecoveryEmailData extends EmailTemplateData {
  recoveryUrl: string;
  expiryHours: number;
}

export interface RecoveryCodeEmailData extends EmailTemplateData {
  verificationCode: string;
  expiryMinutes: number;
}

export interface FamilyInviteEmailData extends EmailTemplateData {
  inviterName: string;
  relation: string;
  inviteToken: string;
  expiryHours: number;
  baseUrl?: string;
}

export interface WelcomeEmailData extends EmailTemplateData {
  userCode: string;
}

/**
 * Create email verification template
 */
export function createVerificationEmailTemplate(data: VerificationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background:rgb(129, 216, 135); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p>Welcome to Blood Node! Please verify your email address to complete your account setup.</p>
          
          <p>Click the button below to verify your email:</p>
          
          <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This verification link will expire in ${data.expiryHours} hour(s). 
            If you don't verify your email within this time, you'll need to request a new verification email.
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${data.verificationUrl}
          </p>
          
          <p>If you didn't create an account with Blood Node, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create verification code email template
 */
export function createVerificationCodeEmailTemplate(data: VerificationCodeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { background: #1f2937; color: #f9fafb; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p>Your verification code is:</p>
          
          <div class="code">${data.verificationCode}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This verification code will expire in ${data.expiryMinutes} minutes. 
            If you don't use this code within this time, you'll need to request a new one.
          </div>
          
          <p>Enter this code in the verification form to complete your email verification.</p>
          
          <p>If you didn't request this verification code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create password recovery email template
 */
export function createPasswordRecoveryEmailTemplate(data: PasswordRecoveryEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p>You requested to reset your password for your Blood Node account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${data.recoveryUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This password reset link will expire in ${data.expiryHours} hour(s). 
            If you don't reset your password within this time, you'll need to request a new reset link.
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${data.recoveryUrl}
          </p>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create recovery code email template
 */
export function createRecoveryCodeEmailTemplate(data: RecoveryCodeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { background: #1f2937; color: #f9fafb; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p>Your account recovery code is:</p>
          
          <div class="code">${data.verificationCode}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This recovery code will expire in ${data.expiryMinutes} minutes. 
            If you don't use this code within this time, you'll need to request a new one.
          </div>
          
          <p>Enter this code in the recovery form to regain access to your account.</p>
          
          <p>If you didn't request this recovery code, please contact support immediately as your account may be compromised.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create family invite email template
 */
export function createFamilyInviteEmailTemplate(data: FamilyInviteEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .highlight { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p><strong>${data.inviterName}</strong> has invited you to join their Blood Node family network as their <strong>${data.relation}</strong>.</p>
          
          <div class="highlight">
            <p><strong>What is Blood Node?</strong></p>
            <p>Blood Node is a secure, privacy-first application that helps families map their blood types and find compatible donors in emergencies. All your data is encrypted end-to-end, so only you and your family can see it.</p>
          </div>
          
          <p><strong>New to Blood Node?</strong> Visit our home page to learn more about how we help families stay connected and prepared for emergencies.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.baseUrl || 'http://localhost:3000'}" class="button" style="background: #059669; margin-right: 10px;">Learn More & Create Account</a>
            <a href="${data.baseUrl || 'http://localhost:3000'}" class="button" style="background: #dc2626;">Go to Blood Node</a>
          </div>
          
          <p>To accept this invitation, follow these steps:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Invitation Code:</h3>
            <div style="background: #1f2937; color: #f9fafb; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 6px; font-family: monospace;">
              ${data.inviteToken}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
              Enter this code in your Blood Node dashboard to accept the invitation
            </p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>💡 For New Users:</strong> If you don't have a Blood Node account yet, create one first using the "Learn More & Create Account" button above, then use the invitation code to join your family network.</p>
          </div>
          
          <p><strong>Privacy Note:</strong> You'll be able to choose exactly what information you want to share with your family. Nothing is shared without your explicit consent.</p>
          
          <p>This invitation will expire in ${data.expiryHours} hours. If you don't want to join, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create welcome email template
 */
export function createWelcomeEmailTemplate(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background:rgb(0, 0, 0); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .user-code { background: #1f2937; color: #f9fafb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 8px; margin: 20px 0; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .feature { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Blood Node</h1>
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <p>🎉 Congratulations! Your Blood Node account has been successfully verified and is ready to use.</p>
          
          <p>Your unique user code is:</p>
          <div class="user-code">${data.userCode}</div>
          <p style="text-align: center; color: #6b7280; font-size: 14px;">Share this code with family members to connect with them</p>
          
          <div class="features">
            <div class="feature">
              <h3>🔒 Secure & Private</h3>
              <p>All your data is encrypted end-to-end. We never see your private information.</p>
            </div>
            <div class="feature">
              <h3>🩸 Blood Network</h3>
              <p>Map your family's blood types and find compatible donors in emergencies.</p>
            </div>
            <div class="feature">
              <h3>🌐 Global Network</h3>
              <p>Connect with family members worldwide with privacy-preserving location sharing.</p>
            </div>
            <div class="feature">
              <h3>🚀 Easy Recovery</h3>
              <p>Multiple recovery options ensure you never lose access to your account.</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="http://localhost:3000" class="button">Get Started</a>
          </div>
          
          <p>Need help getting started? Check out our documentation or contact support.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Blood Node - Secure Family Blood Network</p>
          <p>© 2024 Blood Node. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}