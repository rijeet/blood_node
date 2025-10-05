// Admin Alert Preferences API for Blood Node
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AdminRequest } from '@/lib/middleware/admin-auth';
import { AdminAlertService } from '@/lib/services/admin-alerts';

async function handler(request: AdminRequest) {
  const alertService = AdminAlertService.getInstance();
  const adminId = request.admin?.id;

  if (!adminId) {
    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 401 }
    );
  }

  if (request.method === 'GET') {
    // Get alert preferences
    try {
      const preferences = await alertService.getAlertPreferences(adminId);

      return NextResponse.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting alert preferences:', error);
      return NextResponse.json(
        { error: 'Failed to get alert preferences' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    // Update alert preferences
    try {
      const body = await request.json();
      const preferences = body.preferences;

      if (!preferences) {
        return NextResponse.json(
          { error: 'Preferences are required' },
          { status: 400 }
        );
      }

      const success = await alertService.setAlertPreferences(adminId, preferences);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Alert preferences updated successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to update alert preferences' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error updating alert preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update alert preferences' },
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
