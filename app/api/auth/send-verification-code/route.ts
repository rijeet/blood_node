import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { sendEmail } from '@/lib/email/service';
import { createVerificationToken } from '@/lib/db/verification';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create verification token for password reset
    console.log('Creating verification token for user:', user._id);
    console.log('Verification code:', verificationCode);
    
    const verificationToken = await createVerificationToken({
      user_id: user._id,
      email_hash: user.email_hash,
      token_type: 'password_recovery_code',
      verification_code_data: {
        user_id: user._id!,
        code: verificationCode
      },
      expiresInHours: 0.25 // 15 minutes expiry
    });
    
    console.log('Verification token created:', verificationToken);

    // Send verification code via email
    const emailSubject = 'Blood Node - Password Reset Verification Code';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0;">Blood Node</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Password Reset</p>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">Verification Code</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
            Use this verification code to reset your password. This code is valid for 15 minutes.
          </p>
          
          <div style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 24px; text-align: center;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Your Verification Code:</h3>
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
            <li>If you didn't request this password reset, please contact support immediately</li>
            <li>After entering the code, you'll be able to set a new password</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent because you requested a password reset for Blood Node.
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
        token: verificationToken.token
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development/testing, return the verification code directly
      return NextResponse.json({
        success: true,
        message: 'Verification code (email sending failed, but code is available)',
        token: verificationToken.token,
        verification_code: verificationCode, // Include code in response for testing
        debug: 'Email service not configured - code returned in response'
      });
    }

  } catch (error) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification code request' },
      { status: 500 }
    );
  }
}