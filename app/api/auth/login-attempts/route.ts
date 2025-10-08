// API endpoint to get user-specific login attempt data
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = client.db(DB_NAME);
    const collection = db.collection('login_attempts');

    // Get failed login attempts for this email in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failedAttempts = await collection.countDocuments({
      email: email,
      success: false,
      created_at: { $gte: oneHourAgo }
    });

    // Get failed login attempts for this IP in the last hour
    const ipFailedAttempts = await collection.countDocuments({
      ip_address: ip_address,
      success: false,
      created_at: { $gte: oneHourAgo }
    });

    // Check if account is locked
    const lockoutCollection = db.collection('account_lockouts');
    const activeLockout = await lockoutCollection.findOne({
      $or: [
        { email: email, lockout_type: 'email' },
        { ip_address: ip_address, lockout_type: 'ip' }
      ],
      locked_until: { $gt: new Date() },
      is_active: true
    });

    const response = {
      email: email,
      ip_address: ip_address,
      failed_attempts: failedAttempts,
      ip_failed_attempts: ipFailedAttempts,
      is_locked: !!activeLockout,
      lockout_until: activeLockout?.locked_until,
      last_attempt: null as Date | null
    };

    // Get the most recent failed attempt
    const lastAttempt = await collection.findOne(
      {
        email: email,
        success: false,
        created_at: { $gte: oneHourAgo }
      },
      { sort: { created_at: -1 } }
    );

    if (lastAttempt) {
      response.last_attempt = lastAttempt.created_at;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching login attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

