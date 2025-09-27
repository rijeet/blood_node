// Send verification code API route

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { createVerificationToken } from '@/lib/db/verification';
import { sendVerificationCodeEmail } from '@/lib/email/service';

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

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create verification token with code
    const { token } = await createVerificationToken({
      email_hash: user.email_hash,
      token_type: 'email_verification_code',
      user_id: user._id!,
      verification_code_data: {
        user_id: user._id!,
        code: code
      },
      expiresInHours: 0.25 // 15 minutes
    });

    // Send verification code email
    const emailResult = await sendVerificationCodeEmail(email, code, 15);
    
    if (!emailResult.success) {
      console.error('Failed to send verification code email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 15 // minutes
    });

  } catch (error) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
