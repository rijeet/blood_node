// Donors search API route with availability filtering

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { getUsersWithAvailability } from '@/lib/db/users';
import { getDonationRecordCount } from '@/lib/db/donation-records';
import { getGeohashesInRadius, canDonateTo } from '@/lib/geo';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get('blood_group');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius_km') || '50');
    const onlyAvailable = searchParams.get('only_available') === 'true';

    if (!bloodGroup) {
      return NextResponse.json(
        { error: 'Blood group is required' },
        { status: 400 }
      );
    }

    // Get geohashes within radius (using precision 5 for better radius matching)
    const geohashes = getGeohashesInRadius(lat, lng, radiusKm, 5);

    // Search for compatible donors
    const donors = await getUsersWithAvailability({
      bloodGroup,
      geohashes,
      excludeUserCode: user.user_code,
      onlyAvailable,
      limit: 100
    });

    // Filter by blood compatibility
    const compatibleDonors = donors.filter(donor => 
      donor.blood_group_public && canDonateTo(donor.blood_group_public as any, bloodGroup as any)
    );

    // Format response with donation counts
    const formattedDonors = await Promise.all(compatibleDonors.map(async (donor) => {
      const donationCount = await getDonationRecordCount(new ObjectId(donor._id));
      console.log(`Donor ${donor.user_code}: donation count = ${donationCount}`); // Debug log
      
      return {
        user_code: donor.user_code,
        name: donor.name,
        blood_group: donor.blood_group_public,
        location_address: donor.location_address,
        last_donation_date: donor.last_donation_date,
        availability: donor.availability,
        donation_count: donationCount,
        distance_km: null // Would need to calculate based on exact coordinates
      };
    }));

    return NextResponse.json({
      success: true,
      donors: formattedDonors,
      total: formattedDonors.length,
      filters: {
        blood_group: bloodGroup,
        radius_km: radiusKm,
        only_available: onlyAvailable
      }
    });

  } catch (error) {
    console.error('Donors search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}