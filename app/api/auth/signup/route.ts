// Signup API route

import { NextRequest, NextResponse } from 'next/server';
import { createUser, userCodeExists, findUserByEmailHash } from '@/lib/db/users';
import { UserCreateInput } from '@/lib/models/user';
import { generateUserCode } from '@/lib/crypto';
import { generateSecureToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email_hash,
      public_key,
      encrypted_private_key,
      master_salt,
      sss_server_share,
      user_code: providedUserCode,
      location_geohash,
      blood_group_public
    }: UserCreateInput = body;

    // Validate required fields
    if (!email_hash || !public_key || !encrypted_private_key || !master_salt || !sss_server_share) {
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
      user_code: userCode,
      location_geohash: location_geohash || undefined,
      blood_group_public: blood_group_public || undefined
    };

    const user = await createUser(userData);

    // Generate email verification token
    const verificationToken = generateSecureToken();
    
    // TODO: Store verification token in database
    // TODO: Send verification email with SSS email share
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        user_code: user.user_code,
        email_verified: user.email_verified,
        public_profile: user.public_profile,
        plan: user.plan
      },
      verification_token: verificationToken
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
