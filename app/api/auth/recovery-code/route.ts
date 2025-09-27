// Recovery code API route for numeric code recovery
import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markTokenAsUsed, createVerificationToken } from '@/lib/db/verification';
import { findUserByEmailHash } from '@/lib/db/users';
import { sendRecoveryCodeEmail, generateVerificationCode } from '@/lib/email/service';
import { hashEmail } from '@/lib/auth/jwt';

// POST - Send recovery code to email
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
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, we\'ve sent a recovery code.',
      expires_in_minutes: 15
    };

    if (!user) {
      console.log('Recovery code requested for non-existent email:', email);
      return NextResponse.json(successResponse);
    }

    if (!user.email_verified) {
      console.log('Recovery code requested for unverified email:', email);
      return NextResponse.json(successResponse);
    }

    // Generate 6-digit recovery code
    const recoveryCode = generateVerificationCode();
    
    // Create recovery token with the code
    const { token } = await createVerificationToken({
      email_hash: emailHash,
      token_type: 'password_recovery_code',
      recovery_code_data: {
        user_id: user._id!,
        code: recoveryCode
      },
      expiresInHours: 0.25 // 15 minutes
    });

    // Send recovery code email
    try {
      await sendRecoveryCodeEmail(email, recoveryCode, 15);
      console.log('Recovery code sent to:', email);
    } catch (emailError) {
      console.error('Failed to send recovery code email:', emailError);
      // Still return success to prevent information disclosure
    }

    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Send recovery code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Verify recovery code (first step of recovery process)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and recovery code are required' },
        { status: 400 }
      );
    }

    // Hash email to find tokens
    const emailHash = hashEmail(email);
    
    // Find the recovery token with the matching code
    const validation = await validateVerificationToken(null, 'password_recovery_code', {
      email_hash: emailHash,
      code: code
    });
    
    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Invalid or expired recovery code' },
        { status: 400 }
      );
    }

    const recoveryToken = validation.token;
    
    if (!recoveryToken.recovery_data?.user_id) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await findUserByEmailHash(emailHash);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark token as used
    await markTokenAsUsed(recoveryToken.token);

    // Return recovery instructions since Blood Node uses client-side encryption
    return NextResponse.json({
      success: true,
      message: 'Recovery code verified. You can now proceed with account recovery.',
      recovery_instructions: {
        step: 1,
        title: 'Code Verified - Next Steps',
        description: 'Your recovery code has been verified. Since Blood Node uses end-to-end encryption, you\'ll need your recovery shares to restore access to your encrypted data.',
        options: [
          {
            method: 'recovery_shares',
            title: 'Use Recovery Shares',
            description: 'Enter your User Share and Email Share to restore account access',
            recommended: true
          },
          {
            method: 'backup_file',
            title: 'Import Backup File',
            description: 'Upload your downloaded recovery file to restore access',
            recommended: false
          }
        ],
        warning: 'If you\'ve lost both your recovery shares and backup file, your encrypted data cannot be recovered. You can create a new account with the same email.'
      },
      user: {
        id: user._id,
        user_code: user.user_code,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('Verify recovery code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check recovery code status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Hash email to find user
    const emailHash = hashEmail(email);
    const user = await findUserByEmailHash(emailHash);
    
    // Don't reveal if user exists to prevent enumeration
    const publicResponse = {
      success: true,
      can_request_recovery: true,
      recovery_method: 'code_based',
      encryption_info: {
        type: 'client_side',
        description: 'Blood Node uses client-side encryption. Recovery codes only verify identity - you\'ll need your recovery shares to access encrypted data.'
      }
    };

    if (!user) {
      return NextResponse.json(publicResponse);
    }

    return NextResponse.json({
      ...publicResponse,
      user_exists: true,
      email_verified: user.email_verified
    });

  } catch (error) {
    console.error('Check recovery status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
