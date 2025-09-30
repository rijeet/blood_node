import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getEmergencyAlertById } from '@/lib/db/emergency';
import { ObjectId } from 'mongodb';

// GET - Get emergency alert details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const alertId = new ObjectId(resolvedParams.id);
    const alert = await getEmergencyAlertById(alertId);

    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Return alert details
    return NextResponse.json({
      success: true,
      alert: {
        _id: alert._id?.toString(),
        serial_number: alert.serial_number,
        blood_type: alert.blood_type,
        location_address: alert.location_address,
        urgency_level: alert.urgency_level,
        patient_condition: alert.patient_condition,
        required_bags: alert.required_bags,
        hemoglobin_level: alert.hemoglobin_level,
        donation_place: alert.donation_place,
        donation_date: alert.donation_date,
        donation_time: alert.donation_time,
        contact_info: alert.contact_info,
        reference: alert.reference,
        status: alert.status,
        donors_notified: alert.donors_notified,
        donors_responded: alert.donors_responded,
        created_at: alert.created_at,
        expires_at: alert.expires_at
      }
    });

  } catch (error) {
    console.error('Get emergency alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
