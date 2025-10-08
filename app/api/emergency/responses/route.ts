import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  createEmergencyResponse, 
  getEmergencyResponses, 
  hasUserRespondedToEmergency,
  getEmergencyResponseStats 
} from '@/lib/db/emergency-responses';
import { getEmergencyAlertById } from '@/lib/db/emergency';
import { ObjectId } from 'mongodb';

// POST - Create emergency response
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
      emergency_alert_id,
      response_message,
      can_donate_immediately,
      available_times,
      contact_preference
    } = body;

    // Validate required fields
    if (!emergency_alert_id) {
      return NextResponse.json(
        { error: 'Emergency alert ID is required' },
        { status: 400 }
      );
    }

    // Check if emergency alert exists
    const emergencyAlert = await getEmergencyAlertById(new ObjectId(emergency_alert_id));
    if (!emergencyAlert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Check if user has already responded
    const hasResponded = await hasUserRespondedToEmergency(
      new ObjectId(emergency_alert_id), 
      user._id!
    );
    
    if (hasResponded) {
      return NextResponse.json(
        { error: 'You have already responded to this emergency alert' },
        { status: 400 }
      );
    }

    // Check if user's blood type is compatible
    const { getCompatibleBloodTypesForEmergency } = await import('@/lib/utils');
    const compatibleBloodTypes = getCompatibleBloodTypesForEmergency(emergencyAlert.blood_type);
    
    if (!user.blood_group_public || !compatibleBloodTypes.includes(user.blood_group_public)) {
      return NextResponse.json(
        { error: 'Your blood type is not compatible with this emergency' },
        { status: 400 }
      );
    }

    // Create response
    const response = await createEmergencyResponse({
      emergency_alert_id: new ObjectId(emergency_alert_id),
      responder_user_id: user._id!,
      responder_user_code: user.user_code,
      responder_name: user.name || 'Unknown User',
      responder_blood_type: user.blood_group_public,
      responder_location: {
        address: user.location_address || 'Location not specified',
        geohash: user.location_geohash || '',
        coordinates: [0, 0] // Default coordinates, will be calculated from geohash if needed
      },
      response_message: response_message || '',
      status: 'pending',
      can_donate_immediately: can_donate_immediately || false,
      available_times: available_times || [],
      contact_preference: contact_preference || 'both'
    });

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      response: {
        id: response._id?.toString(),
        status: response.status,
        created_at: response.created_at
      }
    });

  } catch (error) {
    console.error('Create emergency response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get responses for an emergency alert
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

    const { searchParams } = new URL(request.url);
    const emergency_alert_id = searchParams.get('emergency_alert_id');

    if (!emergency_alert_id) {
      return NextResponse.json(
        { error: 'Emergency alert ID is required' },
        { status: 400 }
      );
    }

    // Check if emergency alert exists
    const emergencyAlert = await getEmergencyAlertById(new ObjectId(emergency_alert_id));
    if (!emergencyAlert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Get user details to check if they're the alert creator
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only alert creator can view responses
    if (emergencyAlert.user_id.toString() !== user._id!.toString()) {
      return NextResponse.json(
        { error: 'Only the alert creator can view responses' },
        { status: 403 }
      );
    }

    // Get responses and statistics
    const responses = await getEmergencyResponses(new ObjectId(emergency_alert_id));
    const stats = await getEmergencyResponseStats(new ObjectId(emergency_alert_id));

    return NextResponse.json({
      success: true,
      responses,
      statistics: stats
    });

  } catch (error) {
    console.error('Get emergency responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
