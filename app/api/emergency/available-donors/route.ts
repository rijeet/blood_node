import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getEmergencyAlertById } from '@/lib/db/emergency';
import { getUsersWithAvailability } from '@/lib/db/users';
import { getGeohashesInRadius } from '@/lib/geo';
import { ObjectId } from 'mongodb';

// GET - Get available donors for emergency
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const emergencyId = searchParams.get('emergency_id');

    if (!emergencyId) {
      return NextResponse.json(
        { error: 'Emergency ID is required' },
        { status: 400 }
      );
    }

    // Get emergency alert
    const alert = await getEmergencyAlertById(new ObjectId(emergencyId));
    if (!alert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Check if user owns this emergency alert
    if (alert.user_id.toString() !== user._id?.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to view this emergency' },
        { status: 403 }
      );
    }

    // Get geohashes for the search area
    const geohashes = getGeohashesInRadius(alert.location_lat, alert.location_lng, alert.radius_km, 5);
    
    // Find compatible donors in the area
    const donors = await getUsersWithAvailability({
      bloodGroup: alert.blood_type,
      geohashes: geohashes,
      onlyAvailable: true
    });

    // Filter only available donors and format response
    const availableDonors = donors
      .filter(donor => donor.availability?.isAvailable)
      .map(donor => ({
        _id: donor._id?.toString(),
        user_code: donor.user_code,
        name: donor.name,
        blood_type: donor.blood_group_public || 'Unknown',
        location_address: donor.location_address,
        last_donation_date: donor.last_donation_date,
        availability: donor.availability
      }));

    return NextResponse.json({
      success: true,
      donors: availableDonors
    });

  } catch (error) {
    console.error('Get available donors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
