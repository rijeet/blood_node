import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { validateVerificationToken } from '@/lib/db/verification';
import { BloodNodeCrypto } from '@/lib/crypto/client';

export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
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

    // Validate the verification code
    const validationResult = await validateVerificationToken(
      null, // no token string
      'password_recovery_code',
      { 
        email_hash: user.email_hash, 
        code: code 
      }
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate a reset token for password reset
    const resetToken = await createResetToken(user._id);

    return NextResponse.json({
      success: true,
      message: 'Verification code verified successfully',
      reset_token: resetToken
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

async function createResetToken(userId: any) {
  // Generate a secure reset token
  const crypto = new BloodNodeCrypto();
  const token = crypto.generateSecureToken(32);
  
  // Store the reset token in the database with expiry
  const { getUsersCollection } = await import('@/lib/db/users');
  const usersCollection = await getUsersCollection();
  await usersCollection.updateOne(
    { _id: userId },
    {
      $set: {
        reset_token: token,
        reset_token_expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        updated_at: new Date()
      }
    }
  );

  return token;
}