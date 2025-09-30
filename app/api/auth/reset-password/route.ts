import { NextRequest, NextResponse } from 'next/server';
import { getUsersCollection } from '@/lib/db/users';
import { validateVerificationToken } from '@/lib/db/verification';
import { BloodNodeCrypto } from '@/lib/crypto/client';

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate the recovery token
    const validationResult = await validateVerificationToken(token, 'password_recovery');
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Get user from token
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ _id: validationResult.token?.user_id });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const crypto = new BloodNodeCrypto();
    const hashedPassword = await crypto.hashPassword(new_password);

    // Update user password
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password_hash: hashedPassword,
          updated_at: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
