import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { getAllSupportTickets } from '@/lib/db/support-tickets';

// GET - Get all support tickets (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async (adminRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || undefined;

      // Get all support tickets
      const result = await getAllSupportTickets(page, limit, status);

      return NextResponse.json({
        success: true,
        tickets: result.tickets,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });

    } catch (error) {
      console.error('Get all support tickets error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
