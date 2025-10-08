// Login API route with security

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
import { securityMiddleware } from '@/lib/middleware/security';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    const body = await request.json();
    const { email, password, remember_device = false, captcha_token } = body;
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password ? password.length : 'undefined');

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check IP blacklist
    const ipBlacklistResponse = await securityMiddleware.checkIPBlacklist(request);
    if (ipBlacklistResponse) {
      console.log('🚫 IP address blacklisted');
      return ipBlacklistResponse;
    }

    // Apply rate limiting
    const rateLimitResponse = await securityMiddleware.applyRateLimit(request, 'LOGIN_ATTEMPTS');
    if (rateLimitResponse) {
      console.log('🚫 Rate limit exceeded');
      return rateLimitResponse;
    }

    // Check login attempt limits
    const loginLimitResponse = await securityMiddleware.checkLoginLimits(request, email);
    if (loginLimitResponse) {
      console.log('🚫 Login limits exceeded');
      return loginLimitResponse;
    }

    // Check if CAPTCHA is required and verify it
    if (securityMiddleware.isCaptchaRequired('login')) {
      if (!captcha_token) {
        console.log('🤖 CAPTCHA required');
        return NextResponse.json(
          { 
            error: 'CAPTCHA required',
            message: 'Please complete the CAPTCHA verification',
            captcha_required: true,
            captcha_config: securityMiddleware.getCaptchaConfig()
          },
          { status: 400 }
        );
      }

      const captchaResponse = await securityMiddleware.verifyCaptcha(request, 'login');
      if (captchaResponse) {
        console.log('🤖 CAPTCHA verification failed');
        return captchaResponse;
      }
    }

    // Hash email to find user
    const emailHash = hashEmail(email);
    console.log('🔍 Email hash:', emailHash);
    const user = await findUserByEmailHash(emailHash);
    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ User not found');
      
      // Record failed login attempt with alerts
      await securityMiddleware.recordLoginAttemptWithAlerts(request, {
        email,
        success: false,
        failure_reason: 'User not found'
      });

      // Check for auto-blacklist
      await securityMiddleware.checkAutoBlacklist(request, email);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Email verified:', user.email_verified);
    if (!user.email_verified) {
      console.log('❌ Email not verified');
      
      // Record failed login attempt with alerts
      await securityMiddleware.recordLoginAttemptWithAlerts(request, {
        user_id: user._id!.toString(),
        email,
        success: false,
        failure_reason: 'Email not verified'
      });

      // Check for auto-blacklist
      await securityMiddleware.checkAutoBlacklist(request, email);
      
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
      
      // Record failed login attempt with alerts
      await securityMiddleware.recordLoginAttemptWithAlerts(request, {
        user_id: user._id!.toString(),
        email,
        success: false,
        failure_reason: 'Invalid password'
      });

      // Check for auto-blacklist
      await securityMiddleware.checkAutoBlacklist(request, email);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('✅ Password validation successful');
    
    // Record successful login attempt
    await securityMiddleware.recordLoginAttemptWithAlerts(request, {
      user_id: user._id!.toString(),
      email,
      success: true
    });
    
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
