// Security monitoring API for admin
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/admin-auth';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

async function handler(request: NextRequest) {
  const client = await clientPromise;
  if (!client) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }

  const db = client.db(DB_NAME);

  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = parseInt(searchParams.get('limit') || '100');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get security events
    const securityEvents = await db.collection('security_events')
      .find({ created_at: { $gte: since } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Get login attempts
    const loginAttempts = await db.collection('login_attempts')
      .find({ created_at: { $gte: since } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Get account lockouts
    const accountLockouts = await db.collection('account_lockouts')
      .find({ created_at: { $gte: since } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Get statistics
    const [
      totalEvents,
      eventsByType,
      eventsBySeverity,
      failedLogins,
      successfulLogins,
      activeLockouts,
      topIPs
    ] = await Promise.all([
      db.collection('security_events').countDocuments({ created_at: { $gte: since } }),
      db.collection('security_events').aggregate([
        { $match: { created_at: { $gte: since } } },
        { $group: { _id: '$event_type', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('security_events').aggregate([
        { $match: { created_at: { $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('login_attempts').countDocuments({ 
        created_at: { $gte: since }, 
        success: false 
      }),
      db.collection('login_attempts').countDocuments({ 
        created_at: { $gte: since }, 
        success: true 
      }),
      db.collection('account_lockouts').countDocuments({ 
        locked_until: { $gt: new Date() },
        is_active: true
      }),
      db.collection('login_attempts').aggregate([
        { $match: { created_at: { $gte: since }, success: false } },
        { $group: { _id: '$ip_address', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray()
    ]);

    // Get rate limit violations
    const rateLimitViolations = await db.collection('rate_limits')
      .find({ 
        created_at: { $gte: since },
        attempts: { $gte: 100 } // Assuming 100 is the limit
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_events: totalEvents,
          failed_logins: failedLogins,
          successful_logins: successfulLogins,
          active_lockouts: activeLockouts,
          time_range_hours: hours
        },
        events_by_type: eventsByType.reduce((acc, item) => ({
          ...acc,
          [item._id]: item.count
        }), {}),
        events_by_severity: eventsBySeverity.reduce((acc, item) => ({
          ...acc,
          [item._id]: item.count
        }), {}),
        top_ips: topIPs,
        recent_events: securityEvents.slice(0, 20),
        recent_login_attempts: loginAttempts.slice(0, 20),
        recent_lockouts: accountLockouts.slice(0, 20),
        rate_limit_violations: rateLimitViolations
      }
    });

  } catch (error) {
    console.error('Error getting security monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to get security monitoring data' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(handler, 'system', 'read');
