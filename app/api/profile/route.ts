// Profile management API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { updateUserProfile, findUserById, updateUserLocation } from '@/lib/db/users';
import { calculateAvailability, getAvailabilityStatus } from '@/lib/models/user';
import { encodeGeohash } from '@/lib/geo';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRecord = await findUserById(user.sub);
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate availability
    const availability = calculateAvailability(userRecord.last_donation_date);
    const availabilityStatus = getAvailabilityStatus(userRecord.last_donation_date);

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord._id,
        user_code: userRecord.user_code,
        name: userRecord.name,
        phone: userRecord.phone,
        blood_group_public: userRecord.blood_group_public,
        location_address: userRecord.location_address,
        location_geohash: userRecord.location_geohash,
        last_donation_date: userRecord.last_donation_date,
        availability: availability,
        availability_status: availabilityStatus,
        plan: userRecord.plan,
        email_verified: userRecord.email_verified,
        public_profile: userRecord.public_profile,
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      location_address,
      location_geohash,
      blood_group_public,
      last_donation_date,
      public_profile
    } = body;

    // Validate last_donation_date if provided
    let donationDate: Date | undefined;
    if (last_donation_date) {
      donationDate = new Date(last_donation_date);
      if (isNaN(donationDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid donation date format' },
          { status: 400 }
        );
      }
    }

    // Process location geohash if provided
    let processedLocationGeohash = location_geohash;
    if (location_geohash && typeof location_geohash === 'string' && location_geohash.includes(',')) {
      try {
        const [lat, lng] = location_geohash.split(',').map(coord => parseFloat(coord.trim()));
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return NextResponse.json(
            { error: 'Invalid coordinates provided' },
            { status: 400 }
          );
        }
        
        // Convert to precision 7 geohash
        processedLocationGeohash = encodeGeohash(lat, lng, 7);
        console.log(`Converted coordinates ${lat}, ${lng} to geohash: ${processedLocationGeohash}`);
      } catch (error) {
        console.error('Error converting coordinates to geohash:', error);
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    // Update profile
    await updateUserProfile(user.sub, {
      name,
      phone,
      location_address,
      blood_group_public,
      last_donation_date: donationDate,
      public_profile
    });

    // Update location geohash if provided
    if (processedLocationGeohash) {
      await updateUserLocation(user.sub, processedLocationGeohash);
    }

    // Get updated user record
    const userRecord = await findUserById(user.sub);
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate updated availability
    const availability = calculateAvailability(userRecord.last_donation_date);
    const availabilityStatus = getAvailabilityStatus(userRecord.last_donation_date);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userRecord._id,
        user_code: userRecord.user_code,
        name: userRecord.name,
        phone: userRecord.phone,
        blood_group_public: userRecord.blood_group_public,
        location_address: userRecord.location_address,
        last_donation_date: userRecord.last_donation_date,
        availability: availability,
        availability_status: availabilityStatus,
        plan: userRecord.plan,
        email_verified: userRecord.email_verified,
        public_profile: userRecord.public_profile,
        updated_at: userRecord.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
