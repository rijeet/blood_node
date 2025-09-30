import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { sendEmail } from '@/lib/email/service';
import { createVerificationToken } from '@/lib/db/verification';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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

    // Create recovery token in database
    console.log('Creating password recovery token for user:', user._id);
    const { token } = await createVerificationToken({
      user_id: user._id!,
      email_hash: user.email_hash,
      token_type: 'password_recovery',
      recovery_data: {
        user_id: user._id!
      },
      expiresInHours: 1 // 1 hour expiry
    });
    console.log('Created password recovery token:', token);

    // Send recovery email
    const emailSubject = 'Blood Node - Password Reset';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0;">Blood Node</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Password Reset</p>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">Reset Your Password</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
            Click the button below to reset your password. This link will expire in 1 hour.
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Reset Password
            </a>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">⚠️ Security Notes:</h3>
          <ul style="color: #92400e; font-size: 12px; margin: 0; padding-left: 16px;">
            <li>This link is valid for 1 hour only</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Never share this link with anyone</li>
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
        message: 'Password reset link sent to your email address'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development/testing, return the token directly
      return NextResponse.json({
        success: true,
        message: 'Password reset link (email sending failed, but link is available)',
        reset_token: token, // Include token in response for testing
        reset_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`,
        debug: 'Email service not configured - token returned in response'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
