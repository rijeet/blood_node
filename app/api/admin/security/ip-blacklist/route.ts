// IP Blacklist management API for admin
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { IPBlacklistService } from '@/lib/services/ip-blacklist';
import { ObjectId } from 'mongodb';

async function handler(request: NextRequest) {
  const ipBlacklistService = IPBlacklistService.getInstance();

  if (request.method === 'GET') {
    // Get blacklisted IPs
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
      const blacklistedIPs = await ipBlacklistService.getBlacklistedIPs(limit, offset);
      const statistics = await ipBlacklistService.getIPStatistics();

      return NextResponse.json({
        success: true,
        data: {
          blacklisted_ips: blacklistedIPs,
          statistics
        }
      });
    } catch (error) {
      console.error('Error getting blacklisted IPs:', error);
      return NextResponse.json(
        { error: 'Failed to get blacklisted IPs' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    // Add IP to blacklist
    try {
      const body = await request.json();
      const { ip_address, reason, severity, description, expires_hours } = body;

      if (!ip_address || !reason || !severity) {
        return NextResponse.json(
          { error: 'IP address, reason, and severity are required' },
          { status: 400 }
        );
      }

      const expires_at = expires_hours ? 
        new Date(Date.now() + expires_hours * 60 * 60 * 1000) : 
        undefined;

      const success = await ipBlacklistService.addToBlacklist({
        ip_address,
        reason,
        severity,
        description,
        expires_at
      });

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'IP address added to blacklist'
        });
      } else {
        return NextResponse.json(
          { error: 'IP address is already blacklisted' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error adding IP to blacklist:', error);
      return NextResponse.json(
        { error: 'Failed to add IP to blacklist' },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    // Remove IP from blacklist
    try {
      const { searchParams } = new URL(request.url);
      const ip_address = searchParams.get('ip_address');

      if (!ip_address) {
        return NextResponse.json(
          { error: 'IP address is required' },
          { status: 400 }
        );
      }

      const success = await ipBlacklistService.removeFromBlacklist(ip_address);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'IP address removed from blacklist'
        });
      } else {
        return NextResponse.json(
          { error: 'IP address not found in blacklist' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error removing IP from blacklist:', error);
      return NextResponse.json(
        { error: 'Failed to remove IP from blacklist' },
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
export const DELETE = withAdminAuth(handler, 'system', 'write');
