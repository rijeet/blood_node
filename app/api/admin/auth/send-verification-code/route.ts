// Admin send verification code API route
import { NextRequest, NextResponse } from 'next/server';
import { findAdminByEmail } from '@/lib/db/admin';
import { sendEmail } from '@/lib/email/service';
import { generateAdminVerificationCode, generateAdminVerificationToken } from '@/lib/auth/admin';
import { securityMiddleware } from '@/lib/middleware/security';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check IP blacklist
    const ipBlacklistResponse = await securityMiddleware.checkIPBlacklist(request);
    if (ipBlacklistResponse) {
      return ipBlacklistResponse;
    }

    // Apply rate limiting for admin verification
    const rateLimitResponse = await securityMiddleware.applyRateLimit(request, 'ADMIN_ATTEMPTS');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Find admin by email
    const admin = await findAdminByEmail(email);

    if (!admin) {
      return NextResponse.json(
        { error: 'No admin account found with this email address' },
        { status: 404 }
      );
    }

    // Check if admin is active
    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'Admin account is inactive' },
        { status: 403 }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = generateAdminVerificationCode();

    // Generate verification token
    const verificationToken = generateAdminVerificationToken(admin._id!.toString(), verificationCode);

    // Send verification code via email
    const emailSubject = 'Blood Node Admin - Login Verification Code';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0;">🩸 Blood Node Admin</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Admin Login Verification</p>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">Verification Code</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
            Use this verification code to complete your admin login. This code is valid for 15 minutes.
          </p>
          
          <div style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 24px; text-align: center;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Your Admin Verification Code:</h3>
            <div style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #dc2626;">
              ${verificationCode}
            </div>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">⚠️ Important Security Notes:</h3>
          <ul style="color: #92400e; font-size: 12px; margin: 0; padding-left: 16px;">
            <li>This code is valid for 15 minutes only</li>
            <li>Never share this verification code with anyone</li>
            <li>If you didn't request this admin login, please contact support immediately</li>
            <li>After entering the code, you'll be logged in for 7 days</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent because you requested admin login verification for Blood Node.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml
      });
      
      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email address',
        verification_token: verificationToken
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development/testing, return the verification code directly
      return NextResponse.json({
        success: true,
        message: 'Verification code (email sending failed, but code is available)',
        verification_token: verificationToken,
        verification_code: verificationCode, // Include code in response for testing
        debug: 'Email service not configured - code returned in response'
      });
    }

  } catch (error) {
    console.error('Admin send verification code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
