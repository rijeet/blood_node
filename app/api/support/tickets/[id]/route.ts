import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getSupportTicketWithMessages } from '@/lib/db/support-tickets';
import { ObjectId } from 'mongodb';

// GET - Get a specific support ticket with messages
export async function GET(
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

    // Get the support ticket with messages
    const ticket = await getSupportTicketWithMessages(
      new ObjectId(ticketId),
      new ObjectId(user._id) // Ensure user can only access their own tickets
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Get support ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
