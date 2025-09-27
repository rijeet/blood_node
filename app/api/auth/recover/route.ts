// Password recovery API route
import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailHash } from '@/lib/db/users';
import { createVerificationToken, validateVerificationToken, markTokenAsUsed } from '@/lib/db/verification';
import { sendPasswordRecoveryEmail } from '@/lib/email/service';
import { hashEmail } from '@/lib/auth/jwt';

// POST - Send recovery email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Hash email to find user
    const emailHash = hashEmail(email);
    const user = await findUserByEmailHash(emailHash);

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we pretend to send an email
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, we\'ve sent password recovery instructions.'
    };

    if (!user) {
      console.log('Password recovery requested for non-existent email:', email);
      return NextResponse.json(successResponse);
    }

    if (!user.email_verified) {
      console.log('Password recovery requested for unverified email:', email);
      return NextResponse.json(successResponse);
    }

    // Create recovery token
    const { token } = await createVerificationToken({
      email_hash: emailHash,
      token_type: 'password_recovery',
      recovery_data: {
        user_id: user._id!
      },
      expiresInHours: 1
    });

    // Send recovery email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await sendPasswordRecoveryEmail(email, token, baseUrl);
      console.log('Recovery email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send recovery email:', emailError);
      // Still return success to prevent information disclosure
    }

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Password recovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Validate recovery token and show recovery form
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Password Recovery - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Recovery Error</h2>
              <p>No recovery token provided.</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  // Validate the token
  const validation = await validateVerificationToken(token, 'password_recovery');
  
  if (!validation.valid || !validation.token) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Recovery Error - Blood Node</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🩸 Blood Node</h1>
            <div class="error">
              <h2>Recovery Failed</h2>
              <p>${validation.error || 'Invalid or expired recovery token'}</p>
            </div>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>`,
      { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  // Show recovery instructions since Blood Node uses client-side encryption
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>Password Recovery - Blood Node</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .info { background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .steps { text-align: left; }
          .steps li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🩸 Blood Node - Account Recovery</h1>
          
          <div class="warning">
            <h3>🔒 End-to-End Encryption Notice</h3>
            <p>Blood Node uses client-side encryption. Your password is never stored on our servers and cannot be reset traditionally.</p>
          </div>
          
          <h2>Recovery Options:</h2>
          
          <div class="info">
            <h3>📱 Option 1: Use Your Recovery Shares</h3>
            <div class="steps">
              <p>If you have your Shamir Secret Sharing (SSS) recovery shares:</p>
              <ol>
                <li>Go to the Blood Node login page</li>
                <li>Click "Forgot your password? Use recovery shares"</li>
                <li>Enter your User Share and Email Share</li>
                <li>Set a new password</li>
              </ol>
            </div>
          </div>
          
          <div class="info">
            <h3>💾 Option 2: Use Your Downloaded Backup</h3>
            <div class="steps">
              <p>If you downloaded your recovery data during signup:</p>
              <ol>
                <li>Locate your recovery file</li>
                <li>Follow the import instructions</li>
                <li>Restore your account access</li>
              </ol>
            </div>
          </div>
          
          <div class="warning">
            <h3>⚠️ If You Lost Your Recovery Data</h3>
            <p>Unfortunately, if you've lost both your password and recovery shares, your encrypted data cannot be recovered. This is by design to ensure maximum security.</p>
            <p>You can create a new account with the same email address.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="/" class="button">Go to Login</a>
          </p>
        </div>
      </body>
    </html>`,
    { 
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}
