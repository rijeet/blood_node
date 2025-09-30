// Login API route

import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailHash, getUserAuthData } from '@/lib/db/users';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashRefreshToken,
  generateDeviceFingerprint,
  generateDeviceId,
  hashEmail
} from '@/lib/auth/jwt';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    const body = await request.json();
    const { email, password, remember_device = false } = body;
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password ? password.length : 'undefined');

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Hash email to find user
    const emailHash = hashEmail(email);
    console.log('🔍 Email hash:', emailHash);
    const user = await findUserByEmailHash(emailHash);
    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Email verified:', user.email_verified);
    if (!user.email_verified) {
      console.log('❌ Email not verified');
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 401 }
      );
    }

    // Validate password
    console.log('🔐 Validating password...');
    const crypto = new (await import('@/lib/crypto/client')).BloodNodeCrypto();
    const hashedPassword = await crypto.hashPassword(password);
    console.log('🔑 Stored hash:', user.password_hash);
    console.log('🔑 Computed hash:', hashedPassword);
    console.log('🔑 Match:', user.password_hash === hashedPassword);
    
    if (user.password_hash !== hashedPassword) {
      console.log('❌ Password validation failed');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('✅ Password validation successful');
    
    console.log('Login successful for user:', user.user_code);

    // Generate device fingerprint
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const fingerprintHash = generateDeviceFingerprint(userAgent, ip);

    // Generate device ID
    const deviceId = generateDeviceId();

    // Get user auth data
    const authData = await getUserAuthData(user._id!.toString());
    if (!authData) {
      return NextResponse.json(
        { error: 'User auth data not found' },
        { status: 500 }
      );
    }

    // Generate access token
    const accessToken = generateAccessToken({
      user_id: user._id!.toString(),
      user_code: user.user_code,
      email_hash: user.email_hash,
      plan: user.plan
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    
    // Store refresh token in database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const refreshTokensCollection = client.db(DB_NAME).collection('refresh_tokens');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember_device ? 30 : 7)); // 30 days if remember device, 7 days otherwise

    await refreshTokensCollection.insertOne({
      token_hash: refreshTokenHash,
      user_id: user._id,
      device_id: deviceId,
      fingerprint_hash: fingerprintHash,
      expires_at: expiresAt,
      revoked: false,
      created_at: new Date()
    });

    // Set refresh token as HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      access_token: accessToken,
      user: {
        id: user._id,
        user_code: user.user_code,
        email_verified: user.email_verified,
        public_profile: user.public_profile,
        plan: user.plan
      },
      device_id: deviceId
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: remember_device ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // seconds
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
