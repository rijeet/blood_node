// Location update API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { updateUserProfile, updateUserLocation, findUserById } from '@/lib/db/users';
import { encodeGeohash } from '@/lib/geo';

// Update user location
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
      location_address,
      location_geohash
    } = body;

    if (!location_address) {
      return NextResponse.json(
        { error: 'Location address is required' },
        { status: 400 }
      );
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

    // Update location in profile
    await updateUserProfile(user.sub, {
      location_address
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

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        address: userRecord.location_address,
        geohash: userRecord.location_geohash
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
