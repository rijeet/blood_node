// Donors search API route with availability filtering

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { getUsersWithAvailability } from '@/lib/db/users';
import { getDonationRecordCount } from '@/lib/db/donation-records';
import { getGeohashesForRadius, canDonateTo, calculateDistance, decodeGeohash } from '@/lib/geo';
import { getCompatibleBloodTypesForDonorSearch } from '@/lib/utils';
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
    const radiusKm = parseFloat(searchParams.get('radius_km') || '10'); // Default 10km radius
    const onlyAvailable = searchParams.get('only_available') === 'true';

    if (!bloodGroup) {
      return NextResponse.json(
        { error: 'Blood group is required' },
        { status: 400 }
      );
    }

    // Get geohashes within radius using advanced system
    const geohashResult = getGeohashesForRadius(lat, lng, radiusKm);
    
    // Get compatible blood types for donor search
    const compatibleBloodTypes = getCompatibleBloodTypesForDonorSearch(bloodGroup);
    
    console.log(`Donor search: ${geohashResult.geohashes.length} geohashes for ${radiusKm}km radius (precision: ${geohashResult.precision})`);
    console.log(`Searching for donors with blood types: ${compatibleBloodTypes.join(', ')}`);

    // Search for compatible donors using optimized geohash search
    const donors = await getUsersWithAvailability({
      bloodGroups: compatibleBloodTypes, // Search for ALL compatible blood types
      geohashes: geohashResult.geohashes,
      excludeUserCode: user.user_code,
      onlyAvailable,
      limit: 100
    });

    // Additional filter by blood compatibility (redundant but safe)
    const compatibleDonors = donors.filter(donor => 
      donor.blood_group_public && canDonateTo(donor.blood_group_public as any, bloodGroup as any)
    );

    // Format response with donation counts and distance calculations
    const formattedDonors = await Promise.all(compatibleDonors.map(async (donor) => {
      const donationCount = await getDonationRecordCount(new ObjectId(donor._id));
      
      // Calculate distance using geohash coordinates
      let distanceKm = null;
      if (donor.location_geohash) {
        try {
          const donorCoords = decodeGeohash(donor.location_geohash);
          distanceKm = calculateDistance(lat, lng, donorCoords.lat, donorCoords.lng);
        } catch (error) {
          console.warn(`Failed to decode geohash ${donor.location_geohash}:`, error);
        }
      }
      
      console.log(`Donor ${donor.user_code}: donation count = ${donationCount}, distance = ${distanceKm?.toFixed(2)}km`);
      
      return {
        user_code: donor.user_code,
        name: donor.name,
        blood_group: donor.blood_group_public,
        location_address: donor.location_address,
        last_donation_date: donor.last_donation_date,
        availability: donor.availability,
        donation_count: donationCount,
        distance_km: distanceKm ? Math.round(distanceKm * 100) / 100 : null
      };
    }));

    // Sort by distance if available
    formattedDonors.sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

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