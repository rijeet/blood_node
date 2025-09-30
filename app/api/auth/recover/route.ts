import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db/users';
import { sendEmail } from '@/lib/email/service';
import { createVerificationToken } from '@/lib/db/verification';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    console.log('User found:', !!user);
    console.log('User object keys:', user ? Object.keys(user) : 'No user');
    console.log('User recovery shares:', user?.recovery_shares);
    console.log('Recovery shares length:', user?.recovery_shares?.length || 0);
    console.log('User email_hash:', user?.email_hash);
    console.log('EMAIL_HASH_SECRET:', process.env.EMAIL_HASH_SECRET || 'default-email-secret');
    
    // Let's also try a direct database query
    const { getUsersCollection } = await import('@/lib/db/users');
    const collection = await getUsersCollection();
    const directUser = await collection.findOne({ email_hash: user?.email_hash });
    console.log('Direct query user recovery shares:', directUser?.recovery_shares);
    console.log('Direct query user keys:', directUser ? Object.keys(directUser) : 'No user');
    
    // Let's check what database we're connected to
    const dbName = collection.dbName;
    console.log('Database name:', dbName);
    
    // Let's also try to find all users to see what's in the database
    const allUsers = await collection.find({}).toArray();
    console.log('Total users in database:', allUsers.length);
    if (allUsers.length > 0) {
      console.log('First user keys:', Object.keys(allUsers[0]));
      console.log('First user recovery shares:', allUsers[0].recovery_shares);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Check if user has recovery shares
    if (!user.recovery_shares || user.recovery_shares.length === 0) {
      return NextResponse.json(
        { error: 'No recovery shares found for this account. Please contact support.' },
        { status: 400 }
      );
    }

    // Generate recovery shares (in a real implementation, these would be generated from the stored shares)
    // For now, we'll use the stored recovery shares
    const recoveryShares = user.recovery_shares;

    // Create verification token for recovery
    const verificationToken = await createVerificationToken({
      user_id: user._id,
      email_hash: user.email_hash,
      token_type: 'password_recovery',
      expiresInHours: 0.25 // 15 minutes expiry
    });

    // Send recovery shares via email
    const emailSubject = 'Blood Node - Account Recovery Shares';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 28px; margin: 0;">Blood Node</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Account Recovery</p>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">Recovery Shares</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
            Use these recovery shares to regain access to your account. You need all 3 shares to recover your account.
          </p>
          
          <div style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 16px;">
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Your Recovery Shares:</h3>
            ${recoveryShares.map((share: string, index: number) => `
              <div style="margin-bottom: 8px;">
                <strong style="color: #6b7280; font-size: 12px;">Share ${index + 1}:</strong>
                <div style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px; border-radius: 4px; margin-top: 4px; word-break: break-all; font-size: 12px;">
                  ${share}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">⚠️ Important Security Notes:</h3>
          <ul style="color: #92400e; font-size: 12px; margin: 0; padding-left: 16px;">
            <li>These shares are valid for 15 minutes only</li>
            <li>Never share these recovery shares with anyone</li>
            <li>If you didn't request this recovery, please contact support immediately</li>
            <li>After successful recovery, you'll need to set a new password</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent because you requested account recovery for Blood Node.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail(email, emailSubject, emailHtml);
      
      return NextResponse.json({
        success: true,
        message: 'Recovery shares sent to your email address',
        token: verificationToken.token
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development/testing, return the recovery shares directly
      return NextResponse.json({
        success: true,
        message: 'Recovery shares (email sending failed, but shares are available)',
        token: verificationToken.token,
        recovery_shares: recoveryShares, // Include shares in response for testing
        debug: 'Email service not configured - shares returned in response'
      });
    }

  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to process recovery request' },
      { status: 500 }
    );
  }
}