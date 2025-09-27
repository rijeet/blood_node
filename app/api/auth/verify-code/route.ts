// Email verification code API route

import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markTokenAsUsed } from '@/lib/db/verification';
import { verifyUserEmail } from '@/lib/db/users';
import { hashEmail } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Hash email for lookup
    const emailHash = hashEmail(email);

    // Validate the code
    const validation = await validateVerificationToken(
      null, 
      'email_verification_code',
      { email_hash: emailHash, code }
    );
    
    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (validation.token.used) {
      return NextResponse.json(
        { error: 'Verification code has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used
    const marked = await markTokenAsUsed(validation.token.token);
    if (!marked) {
      return NextResponse.json(
        { error: 'Failed to process verification' },
        { status: 500 }
      );
    }

    // Verify user email
    if (validation.token.user_id) {
      await verifyUserEmail(validation.token.user_id.toString());
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}