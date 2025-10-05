// Search relatives API route

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/middleware/auth';
import { searchRelatives } from '@/lib/db/relatives';
import { getGeohashesInRadius } from '@/lib/geo';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const bloodGroup = searchParams.get('blood_group');
    const relation = searchParams.get('relation');
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lng');
    const radiusKm = parseInt(searchParams.get('radius') || '50');
    const availableNow = searchParams.get('available_now') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build search filters
    const filters: any = {
      userId: new ObjectId(user.sub),
      limit
    };

    if (bloodGroup) {
      filters.bloodGroup = bloodGroup;
    }

    if (relation) {
      filters.relation = relation;
    }

    if (availableNow) {
      filters.availableNow = true;
    }

    // If location provided, find geohashes in radius
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const geohashes = getGeohashesInRadius(lat, lng, radiusKm, 5);
      filters.geohashes = geohashes;
    }

    const relatives = await searchRelatives(filters);

    return NextResponse.json({
      success: true,
      relatives,
      filters: {
        blood_group: bloodGroup,
        relation,
        location: latitude && longitude ? { lat: latitude, lng: longitude } : null,
        radius_km: radiusKm,
        available_now: availableNow
      }
    });

  } catch (error) {
    console.error('Search relatives error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
