import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { getSupportTicketWithMessages, closeSupportTicket } from '@/lib/db/support-tickets';
import { ObjectId } from 'mongodb';

// GET - Get a specific support ticket (admin only)
export async function GET(
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

      // Get the support ticket with messages (no user restriction for admin)
      const ticket = await getSupportTicketWithMessages(new ObjectId(ticketId));

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
  })(request);
}

// PUT - Close a support ticket (admin only)
export async function PUT(
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

      // Close the support ticket
      await closeSupportTicket(new ObjectId(ticketId), new ObjectId(adminId));

      return NextResponse.json({
        success: true,
        message: 'Support ticket closed successfully'
      });

    } catch (error) {
      console.error('Close support ticket error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
