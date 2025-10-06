import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { getEmergencyAlertById } from '@/lib/db/emergency';
import { getUsersWithAvailability } from '@/lib/db/users';
import { getGeohashesForRadius, generateMongoQuery } from '@/lib/geo';
import { getCompatibleBloodTypesForEmergency } from '@/lib/utils';
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

    // Get geohashes for the search area using advanced system
    // Default to 10km radius if not specified
    const searchRadius = alert.radius_km || 10;
    const geohashResult = getGeohashesForRadius(alert.location_lat, alert.location_lng, searchRadius);
    
    // Get compatible blood types for emergency alerts
    const compatibleBloodTypes = getCompatibleBloodTypesForEmergency(alert.blood_type);
    
    console.log(`Emergency search: ${geohashResult.geohashes.length} geohashes for ${searchRadius}km radius (precision: ${geohashResult.precision})`);
    console.log(`Emergency blood type: ${alert.blood_type}`);
    console.log(`Compatible donor types: ${compatibleBloodTypes.join(', ')}`);
    
    // Find compatible donors in the area using optimized query
    const donors = await getUsersWithAvailability({
      bloodGroups: compatibleBloodTypes, // Search for ALL compatible blood types
      geohashes: geohashResult.geohashes,
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
