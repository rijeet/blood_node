// Password update API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { findUserById, updateUserPassword } from '@/lib/db/users';
import { sendPasswordChangeNotification } from '@/lib/email/notification-service';

// Update user password
export async function PUT(request: NextRequest) {
  try {
    console.log('🔐 Password update API called');
    
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    
    const user = authenticateRequest(request);
    if (!user) {
      console.log('❌ Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.sub);

    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;
    console.log('📝 Request body parsed successfully');

    // Validate input
    console.log('🔍 Validating input...');
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Current password, new password, and confirm password are required' },
        { status: 400 }
      );
    }
    console.log('✅ Input validation passed');

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password do not match' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Get user record
    console.log('👤 Looking up user record...');
    const userRecord = await findUserById(user.sub);
    if (!userRecord) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log('✅ User record found');

    // Verify current password using the same method as login
    console.log('🔐 Verifying current password...');
    const crypto = new (await import('@/lib/crypto/client')).BloodNodeCrypto();
    const hashedCurrentPassword = await crypto.hashPassword(currentPassword);
    console.log('🔑 Stored hash:', userRecord.password_hash);
    console.log('🔑 Computed hash:', hashedCurrentPassword);
    console.log('🔑 Match:', userRecord.password_hash === hashedCurrentPassword);
    
    if (userRecord.password_hash !== hashedCurrentPassword) {
      console.log('❌ Current password is incorrect');
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    console.log('✅ Current password verified');

    // Hash new password using the same method
    console.log('🔐 Hashing new password...');
    const newPasswordHash = await crypto.hashPassword(newPassword);
    console.log('✅ New password hashed');

    // Update password in database
    await updateUserPassword(user.sub, newPasswordHash);

    // Send password change notification email
    const notificationResult = await sendPasswordChangeNotification(
      {
        userCode: userRecord.user_code,
        emailHash: userRecord.email_hash,
        name: userRecord.name
      },
      {
        userCode: userRecord.user_code,
        changeTime: new Date().toLocaleString(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
      }
    );

    if (!notificationResult.success) {
      console.error('❌ Failed to send password change notification:', notificationResult.error);
      // Don't fail the password update if email fails
    }

    console.log('✅ Password update completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('❌ Password update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
