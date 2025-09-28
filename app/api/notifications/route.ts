import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  getUserNotifications, 
  getUnreadNotificationCount,
  markAllNotificationsAsRead 
} from '@/lib/db/notifications';
import { ObjectId } from 'mongodb';

// GET - Get user notifications
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeRead = searchParams.get('includeRead') === 'true';

    // Get notifications
    const notifications = await getUserNotifications(
      new ObjectId(user._id),
      limit,
      includeRead
    );

    // Get unread count
    const unreadCount = await getUnreadNotificationCount(new ObjectId(user._id));

    return NextResponse.json({
      success: true,
      notifications,
      unread_count: unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Mark all notifications as read
export async function POST(request: NextRequest) {
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

    const { action } = await request.json();

    if (action === 'mark_all_read') {
      const markedCount = await markAllNotificationsAsRead(new ObjectId(user._id));
      
      return NextResponse.json({
        success: true,
        message: `Marked ${markedCount} notifications as read`,
        marked_count: markedCount
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
