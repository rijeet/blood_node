// Manage donor location data
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  encodeGeohash, 
  BloodType, 
  BloodDonorLocation,
  getGeohashPrecisionForRadius
} from '@/lib/geo';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

// POST - Update or create donor location
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
    const { 
      blood_type, 
      lat, 
      lng, 
      is_available = true,
      emergency_contact = false,
      contact_preference = 'app',
      last_donation
    } = body;

    // Validate required fields
    if (!blood_type || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Blood type, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Validate blood type
    const validBloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(blood_type)) {
      return NextResponse.json(
        { error: 'Invalid blood type' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Validate contact preference
    const validContactPreferences = ['email', 'phone', 'app'];
    if (!validContactPreferences.includes(contact_preference)) {
      return NextResponse.json(
        { error: 'Invalid contact preference' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const donorsCollection = client.db(DB_NAME).collection<BloodDonorLocation>('donor_locations');
    
    // Generate geohash
    const geohash = encodeGeohash(lat, lng, 5); // 5-character precision for ~2.4km accuracy
    
    // Prepare donor location data
    const donorLocation: Omit<BloodDonorLocation, 'user_id'> = {
      user_code: user.user_code,
      blood_type,
      lat,
      lng,
      geohash,
      is_available,
      contact_preference,
      emergency_contact,
      last_donation: last_donation ? new Date(last_donation) : undefined,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Upsert donor location (update if exists, insert if not)
    const result = await donorsCollection.replaceOne(
      { user_code: user.user_code },
      { user_id: user._id!.toString(), ...donorLocation },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Donor location updated successfully',
      location: {
        user_code: user.user_code,
        blood_type,
        location: { lat, lng },
        geohash,
        is_available,
        emergency_contact,
        contact_preference,
        last_donation
      }
    });

  } catch (error) {
    console.error('Update donor location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get current donor location
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

    // Connect to database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const donorsCollection = client.db(DB_NAME).collection<BloodDonorLocation>('donor_locations');
    
    // Find donor location
    const donorLocation = await donorsCollection.findOne({ user_code: user.user_code });

    if (!donorLocation) {
      return NextResponse.json({
        success: true,
        has_location: false,
        message: 'No location data found. Please update your location to be discoverable by other donors.'
      });
    }

    return NextResponse.json({
      success: true,
      has_location: true,
      location: {
        user_code: donorLocation.user_code,
        blood_type: donorLocation.blood_type,
        location: { 
          lat: donorLocation.lat, 
          lng: donorLocation.lng 
        },
        geohash: donorLocation.geohash,
        is_available: donorLocation.is_available,
        emergency_contact: donorLocation.emergency_contact,
        contact_preference: donorLocation.contact_preference,
        last_donation: donorLocation.last_donation,
        created_at: donorLocation.created_at,
        updated_at: donorLocation.updated_at
      }
    });

  } catch (error) {
    console.error('Get donor location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove donor location
export async function DELETE(request: NextRequest) {
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

    // Connect to database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const donorsCollection = client.db(DB_NAME).collection('donor_locations');
    
    // Remove donor location
    const result = await donorsCollection.deleteOne({ user_code: user.user_code });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No location data found to remove'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Donor location removed successfully'
    });

  } catch (error) {
    console.error('Remove donor location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
