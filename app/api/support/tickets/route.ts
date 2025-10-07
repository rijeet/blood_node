import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { createSupportTicket, getUserSupportTickets } from '@/lib/db/support-tickets';
import { ObjectId } from 'mongodb';

// POST - Create a new support ticket
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

    const body = await request.json();
    const { subject, message, priority = 'medium' } = body;

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Create the support ticket
    const ticket = await createSupportTicket(
      new ObjectId(user._id),
      {
        subject,
        message,
        priority
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id?.toString(),
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at
      }
    });

  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get user's support tickets
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

    // Get user's support tickets
    const tickets = await getUserSupportTickets(new ObjectId(user._id));

    return NextResponse.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Get support tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
