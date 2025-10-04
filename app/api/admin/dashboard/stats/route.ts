// Admin dashboard statistics API route
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { getAdminDashboardStats } from '@/lib/db/admin';

async function handler(request: NextRequest) {
  try {
    const stats = await getAdminDashboardStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard statistics' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(handler, 'analytics', 'read');
