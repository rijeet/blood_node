// Admin verify code API route
import { NextRequest, NextResponse } from 'next/server';
import { findAdminById, createAdminSession, logAdminActivity } from '@/lib/db/admin';
import { generateAdminToken, createAdminSessionData, generateAdminDeviceFingerprint, verifyAdminVerificationToken } from '@/lib/auth/admin';
import { securityMiddleware } from '@/lib/middleware/security';

export async function POST(request: NextRequest) {
  try {
    const { verification_token, verification_code } = await request.json();

    if (!verification_token || !verification_code) {
      return NextResponse.json(
        { error: 'Verification token and code are required' },
        { status: 400 }
      );
    }

    // Check IP blacklist
    const ipBlacklistResponse = await securityMiddleware.checkIPBlacklist(request);
    if (ipBlacklistResponse) {
      return ipBlacklistResponse;
    }

    // Apply rate limiting for admin verification
    const rateLimitResponse = await securityMiddleware.applyRateLimit(request, 'ADMIN_ATTEMPTS');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Verify the verification token
    const tokenData = verifyAdminVerificationToken(verification_token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Verify the code matches
    if (tokenData.code !== verification_code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Get admin details
    const admin = await findAdminById(tokenData.admin_id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      );
    }

    // Check if admin is active
    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'Admin account is inactive' },
        { status: 403 }
      );
    }

    // Record successful admin verification
    await securityMiddleware.recordLoginAttempt(request, {
      user_id: admin._id!.toString(),
      email: admin.email,
      success: true
    });

    // Generate device fingerprint
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';
    const deviceFingerprint = generateAdminDeviceFingerprint(userAgent, ipAddress);

    // Create admin session
    const sessionData = createAdminSessionData(
      admin._id!.toString(),
      deviceFingerprint,
      ipAddress,
      userAgent
    );

    const sessionId = await createAdminSession(sessionData);

    // Generate JWT token (7 days expiry)
    const token = generateAdminToken({
      admin_id: admin._id!.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    });

    // Log admin activity
    await logAdminActivity({
      admin_id: admin._id!,
      action: 'login_verified',
      resource: 'admin_auth',
      details: { 
        device_fingerprint: deviceFingerprint,
        verification_method: 'email_code'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin._id!.toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      token
    });

    // Set session cookie (7 days)
    response.cookies.set('admin_session', sessionData.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/admin'
    });

    return response;

  } catch (error) {
    console.error('Admin verify code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
