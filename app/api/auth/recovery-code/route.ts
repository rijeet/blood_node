import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { BloodNodeCrypto } from '@/lib/crypto/client';

export async function POST(request: NextRequest) {
  try {
    const { email, recovery_shares } = await request.json();

    if (!email || !recovery_shares || recovery_shares.length === 0) {
      return NextResponse.json(
        { error: 'Email and recovery shares are required' },
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

    // Check if user has recovery shares
    if (!user.recovery_shares || user.recovery_shares.length === 0) {
      return NextResponse.json(
        { error: 'No recovery shares found for this account' },
        { status: 400 }
      );
    }

    // Verify recovery shares
    const storedShares = user.recovery_shares;
    const providedShares = recovery_shares.map((share: string) => share.trim());

    // Check if all provided shares match the stored shares
    const isValid = providedShares.every((share: string) => 
      storedShares.includes(share)
    ) && providedShares.length === storedShares.length;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid recovery shares. Please check and try again.' },
        { status: 400 }
      );
    }

    // Create a recovery token for password reset
    const recoveryToken = await createRecoveryToken(user._id);

    return NextResponse.json({
      success: true,
      message: 'Recovery shares verified successfully',
      recovery_token: recoveryToken,
      user_id: user._id
    });

  } catch (error) {
    console.error('Recovery verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify recovery shares' },
      { status: 500 }
    );
  }
}

async function createRecoveryToken(userId: any) {
  // Generate a secure recovery token
  const crypto = new BloodNodeCrypto();
  const token = crypto.generateSecureToken(32);
  
  // Store the recovery token in the database with expiry
  const { getUsersCollection } = await import('@/lib/db/users');
  const usersCollection = await getUsersCollection();
  await usersCollection.updateOne(
    { _id: userId },
    {
      $set: {
        recovery_token: token,
        recovery_token_expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        updated_at: new Date()
      }
    }
  );

  return token;
}