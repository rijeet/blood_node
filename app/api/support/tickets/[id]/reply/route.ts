import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getSupportTicketWithMessages, replyToSupportTicket, markMessagesAsRead } from '@/lib/db/support-tickets';
import { ObjectId } from 'mongodb';

// POST - Reply to a support ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
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

    const ticketId = resolvedParams.id;
    if (!ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if ticket exists and user has access
    const ticket = await getSupportTicketWithMessages(
      new ObjectId(ticketId),
      new ObjectId(user._id)
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket' },
        { status: 400 }
      );
    }

    // Reply to the ticket
    const reply = await replyToSupportTicket(
      new ObjectId(ticketId),
      new ObjectId(user._id),
      'user',
      { message: message.trim() }
    );

    // Mark other messages as read
    await markMessagesAsRead(new ObjectId(ticketId), new ObjectId(user._id));

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      reply: {
        id: reply._id?.toString(),
        message: reply.message,
        sender_type: reply.sender_type,
        created_at: reply.created_at
      }
    });

  } catch (error) {
    console.error('Reply to support ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
