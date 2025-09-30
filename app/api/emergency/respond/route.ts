import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getEmergencyAlertById, updateEmergencyAlertStatus } from '@/lib/db/emergency';
import { createDonationRecord, updateUserLastDonationDate } from '@/lib/db/donation-records';
import { ObjectId } from 'mongodb';

// POST - Respond to emergency alert
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { alert_id, can_help } = body;

    if (!alert_id || typeof can_help !== 'boolean') {
      return NextResponse.json(
        { error: 'Alert ID and can_help status are required' },
        { status: 400 }
      );
    }

    // Get emergency alert
    const alert = await getEmergencyAlertById(new ObjectId(alert_id));
    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Check if alert is still active
    if (alert.status !== 'active') {
      return NextResponse.json(
        { error: 'Emergency alert is no longer active' },
        { status: 400 }
      );
    }

    // Check if alert has expired
    if (new Date(alert.expires_at) < new Date()) {
      await updateEmergencyAlertStatus(new ObjectId(alert_id), 'expired');
      return NextResponse.json(
        { error: 'Emergency alert has expired' },
        { status: 400 }
      );
    }

    if (can_help) {
      // User can help - create donation record and update alert
      const donationRecord = await createDonationRecord({
        donor_id: new ObjectId(user._id),
        donation_date: new Date(),
        emergency_alert_id: new ObjectId(alert_id),
        blood_group: user.blood_group_public || 'Unknown',
        bags_donated: alert.required_bags,
        donation_place: alert.donation_place,
        emergency_serial_number: alert.serial_number
      });

      // Update user's last donation date
      await updateUserLastDonationDate(new ObjectId(user._id), new Date());

      // Mark emergency as fulfilled and set selected donor
      await updateEmergencyAlertStatus(
        new ObjectId(alert_id),
        'fulfilled',
        undefined,
        alert.donors_responded + 1,
        new ObjectId(user._id)
      );

      return NextResponse.json({
        success: true,
        message: 'Thank you for responding! Your donation record has been created.',
        donation_record_id: donationRecord._id?.toString(),
        emergency_serial_number: alert.serial_number
      });
    } else {
      // User cannot help - just update response count
      await updateEmergencyAlertStatus(
        new ObjectId(alert_id),
        'active',
        undefined,
        alert.donors_responded + 1
      );

      return NextResponse.json({
        success: true,
        message: 'Response recorded. Thank you for letting us know.',
        emergency_serial_number: alert.serial_number
      });
    }

  } catch (error) {
    console.error('Emergency response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
