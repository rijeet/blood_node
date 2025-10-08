// Password update API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { findUserById, updateUserPassword } from '@/lib/db/users';
import { verifyPassword, hashPassword } from '@/lib/auth/jwt';
import { sendEmail } from '@/lib/email/service';
import { createPasswordChangeEmailTemplate } from '@/lib/email/templates';

// Update user password
export async function PUT(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirm password are required' },
        { status: 400 }
      );
    }

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
    const userRecord = await findUserById(user.sub);
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, userRecord.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await updateUserPassword(user.sub, newPasswordHash);

    // Send password change notification email
    try {
      const emailTemplate = createPasswordChangeEmailTemplate({
        title: 'Password Changed Successfully',
        userCode: userRecord.user_code,
        changeTime: new Date().toLocaleString(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
      });

      // Note: In a real implementation, we would need to decrypt the email from email_hash
      // For now, we'll use a placeholder email since we don't store plaintext emails
      const placeholderEmail = `user-${userRecord.user_code}@bloodnode.example`;
      
      await sendEmail({
        to: placeholderEmail,
        subject: '🔒 Password Changed - Blood Node',
        html: emailTemplate,
        from: 'Blood Node <onboarding@resend.dev>'
      });

      console.log('✅ Password change notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send password change notification email:', emailError);
      // Don't fail the password update if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
