import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { getSupportTicketWithMessages, replyToSupportTicket, markMessagesAsRead } from '@/lib/db/support-tickets';
import { ObjectId } from 'mongodb';

// POST - Reply to a support ticket (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  
  return withAdminAuth(async (adminRequest) => {
    try {
      const ticketId = resolvedParams.id;
      if (!ObjectId.isValid(ticketId)) {
        return NextResponse.json(
          { error: 'Invalid ticket ID' },
          { status: 400 }
        );
      }

      const adminId = adminRequest.admin?.id;
      if (!adminId) {
        return NextResponse.json(
          { error: 'Admin ID not found' },
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

      // Check if ticket exists
      const ticket = await getSupportTicketWithMessages(new ObjectId(ticketId));

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

      // Reply to the ticket as admin
      const reply = await replyToSupportTicket(
        new ObjectId(ticketId),
        new ObjectId(adminId),
        'admin',
        { message: message.trim() }
      );

      // Mark messages as read for the user
      await markMessagesAsRead(new ObjectId(ticketId), ticket.user_id);

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
      console.error('Admin reply to support ticket error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}