// Signup API route

import { NextRequest, NextResponse } from 'next/server';
import { createUser, userCodeExists, findUserByEmailHash } from '@/lib/db/users';
import { UserCreateInput } from '@/lib/models/user';
import { generateUserCode } from '@/lib/crypto';
import { createVerificationToken } from '@/lib/db/verification';
import { sendVerificationEmail } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email_hash,
      public_key,
      encrypted_private_key,
      master_salt,
      sss_server_share,
      password_hash,
      user_code: providedUserCode,
      location_geohash,
      location_address,
      blood_group_public,
      name,
      phone,
      last_donation_date,
      email // We need the actual email to send verification
    }: UserCreateInput & { email?: string } = body;

    // Validate required fields
    if (!email_hash || !public_key || !encrypted_private_key || !master_salt || !sss_server_share || !password_hash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmailHash(email_hash);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Generate unique user code if not provided
    let userCode = providedUserCode;
    if (!userCode) {
      do {
        userCode = generateUserCode();
      } while (await userCodeExists(userCode));
    } else {
      // Check if provided user code is already taken
      if (await userCodeExists(userCode)) {
        return NextResponse.json(
          { error: 'User code already taken' },
          { status: 409 }
        );
      }
    }

    // Create user
    const userData: UserCreateInput = {
      email_hash,
      public_key,
      encrypted_private_key,
      master_salt,
      sss_server_share,
      password_hash,
      user_code: userCode,
      location_geohash: location_geohash || undefined,
      location_address: location_address || undefined,
      blood_group_public: blood_group_public || undefined,
      name: name || undefined,
      phone: phone || undefined,
      last_donation_date: last_donation_date ? new Date(last_donation_date) : undefined
    };

    const user = await createUser(userData);

    // Create verification token in database
    const { token } = await createVerificationToken({
      email_hash,
      token_type: 'email_verification',
      user_id: user._id,
      expiresInHours: 1
    });
    
    // Send verification email if email is provided
    if (email) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await sendVerificationEmail(email, token, baseUrl);
        console.log('Verification email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the signup if email fails - user can resend later
      }
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        user_code: user.user_code,
        email_verified: user.email_verified,
        public_profile: user.public_profile,
        plan: user.plan
      },
      verification_token: token,
      message: email ? 'Account created! Please check your email to verify your account.' : 'Account created! Please verify your email address.'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
