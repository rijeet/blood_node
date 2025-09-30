import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getDonationRecordCount } from '@/lib/db/donation-records';
import { ObjectId } from 'mongodb';

// GET - Get user's donation record count
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user ID from query params if provided (for admin access)
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    const targetUserId = userIdParam ? new ObjectId(userIdParam) : new ObjectId(user._id);

    // Get donation record count
    const count = await getDonationRecordCount(targetUserId);

    return NextResponse.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Get donation record count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
