// Admin Alerts API for Blood Node
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { AdminAlertService } from '@/lib/services/admin-alerts';

async function handler(request: NextRequest) {
  const alertService = AdminAlertService.getInstance();

  if (request.method === 'GET') {
    // Get alerts
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity') || undefined;
    const alert_type = searchParams.get('alert_type') || undefined;
    const unread_only = searchParams.get('unread_only') === 'true';

    try {
      const alerts = await alertService.getAlerts('', {
        limit,
        offset,
        severity,
        alert_type,
        unread_only
      });

      const statistics = await alertService.getAlertStatistics();

      return NextResponse.json({
        success: true,
        data: {
          alerts,
          statistics
        }
      });
    } catch (error) {
      console.error('Error getting alerts:', error);
      return NextResponse.json(
        { error: 'Failed to get alerts' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    // Mark alert as read
    try {
      const body = await request.json();
      const { alert_id, admin_id } = body;

      if (!alert_id || !admin_id) {
        return NextResponse.json(
          { error: 'Alert ID and admin ID are required' },
          { status: 400 }
        );
      }

      const success = await alertService.markAsRead(alert_id, admin_id);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Alert marked as read'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to mark alert as read' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark alert as read' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Export with admin authentication
export const GET = withAdminAuth(handler, 'system', 'read');
export const POST = withAdminAuth(handler, 'system', 'write');
