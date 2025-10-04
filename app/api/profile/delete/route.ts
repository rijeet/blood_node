// Account deletion API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { findUserById } from '@/lib/db/users';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { user_code, confirmation_text } = body;

    // Validate required fields
    if (!user_code || !confirmation_text) {
      return NextResponse.json(
        { error: 'User code and confirmation text are required' },
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

    // Verify user code matches
    if (userRecord.user_code !== user_code) {
      return NextResponse.json(
        { error: 'Invalid user code' },
        { status: 400 }
      );
    }

    // Verify confirmation text
    const expectedConfirmation = `DELETE ${user_code}`;
    if (confirmation_text !== expectedConfirmation) {
      return NextResponse.json(
        { error: 'Invalid confirmation text. Please type exactly: DELETE ' + user_code },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = client.db(DB_NAME);
    const userId = new ObjectId(user.sub);

    // Start transaction for data deletion
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete user record
        await db.collection('users').deleteOne({ _id: userId }, { session });

        // Delete all relatives
        await db.collection('relatives').deleteMany({ user_id: userId }, { session });

        // Delete all refresh tokens
        await db.collection('refresh_tokens').deleteMany({ user_id: userId }, { session });

        // Delete all verification tokens
        await db.collection('verification_tokens').deleteMany({ user_id: userId }, { session });

        // Delete all notifications
        await db.collection('notifications').deleteMany({ user_id: userId }, { session });

        // Delete all invites sent by user
        await db.collection('invites').deleteMany({ from_user_id: userId }, { session });

        // Delete all invites received by user
        await db.collection('invites').deleteMany({ to_user_id: userId }, { session });

        // Delete all emergency alerts
        await db.collection('emergency_alerts').deleteMany({ user_id: userId }, { session });

        // Delete all donation records
        await db.collection('donation_records').deleteMany({ user_id: userId }, { session });

        // Delete all login attempts
        await db.collection('login_attempts').deleteMany({ user_id: userId }, { session });

        // Delete all account lockouts
        await db.collection('account_lockouts').deleteMany({ user_id: userId }, { session });

        // Delete all device fingerprints
        await db.collection('device_fingerprints').deleteMany({ user_id: userId }, { session });

        // Delete all security events
        await db.collection('security_events').deleteMany({ user_id: userId }, { session });

        // Delete all email delivery records
        await db.collection('email_delivery').deleteMany({ user_id: userId }, { session });

        console.log(`✅ Account deleted successfully for user: ${user_code}`);
      });

      // Clear all cookies
      const response = NextResponse.json({
        success: true,
        message: 'Account deleted successfully'
      });

      // Clear authentication cookies
      response.cookies.set('access_token', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/'
      });
      
      response.cookies.set('refresh_token', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/'
      });

      return response;

    } catch (error) {
      console.error('Transaction failed during account deletion:', error);
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 }
      );
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
