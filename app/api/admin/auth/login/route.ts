// Admin login API route with security
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminLogin, createAdminSession, logAdminActivity } from '@/lib/db/admin';
import { generateAdminToken, createAdminSessionData, generateAdminDeviceFingerprint } from '@/lib/auth/admin';
import { securityMiddleware } from '@/lib/middleware/security';

export async function POST(request: NextRequest) {
  try {
    const { email, password, remember_device = false, captcha_token } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check IP blacklist
    const ipBlacklistResponse = await securityMiddleware.checkIPBlacklist(request);
    if (ipBlacklistResponse) {
      return ipBlacklistResponse;
    }

    // Apply rate limiting (stricter for admin)
    const rateLimitResponse = await securityMiddleware.applyRateLimit(request, 'ADMIN_ATTEMPTS');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check login attempt limits
    const loginLimitResponse = await securityMiddleware.checkLoginLimits(request, email);
    if (loginLimitResponse) {
      return loginLimitResponse;
    }

    // Check if CAPTCHA is required and verify it
    if (securityMiddleware.isCaptchaRequired('admin_login')) {
      if (!captcha_token) {
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

      const captchaResponse = await securityMiddleware.verifyCaptcha(request, 'admin_login');
      if (captchaResponse) {
        return captchaResponse;
      }
    }

    // Verify admin credentials
    const admin = await verifyAdminLogin(email, password);
    if (!admin) {
      // Record failed admin login attempt
      await securityMiddleware.recordLoginAttempt(request, {
        email,
        success: false,
        failure_reason: 'Invalid admin credentials'
      });

      // Check for auto-blacklist
      await securityMiddleware.checkAutoBlacklist(request, email);
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Record successful admin login attempt
    await securityMiddleware.recordLoginAttempt(request, {
      user_id: admin._id!.toString(),
      email,
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

    // Generate JWT token
    const token = generateAdminToken({
      admin_id: admin._id!.toString(),
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    });

    // Log admin activity
    await logAdminActivity({
      admin_id: admin._id!,
      action: 'login',
      resource: 'admin_auth',
      details: { 
        device_fingerprint: deviceFingerprint,
        remember_device: remember_device
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

    // Set session cookie
    const maxAge = remember_device ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 1 day
    response.cookies.set('admin_session', sessionData.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
      path: '/admin'
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
