import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  getEmergencyResponseById, 
  updateEmergencyResponseStatus
} from '@/lib/db/emergency-responses';
import { getEmergencyAlertById, updateEmergencyAlertStatus } from '@/lib/db/emergency';
import { ObjectId } from 'mongodb';

// POST - Complete donation
export async function POST(
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
    const responseId = new ObjectId(resolvedParams.id);

    // Get the response
    const response = await getEmergencyResponseById(responseId);
    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // Get the emergency alert
    const emergencyAlert = await getEmergencyAlertById(response.emergency_alert_id);
    if (!emergencyAlert) {
      return NextResponse.json(
        { error: 'Emergency alert not found' },
        { status: 404 }
      );
    }

    // Check if user is either the alert creator or the selected responder
    const isAlertCreator = emergencyAlert.user_id.toString() === user._id!.toString();
    const isSelectedResponder = response.responder_user_id.toString() === user._id!.toString();

    if (!isAlertCreator && !isSelectedResponder) {
      return NextResponse.json(
        { error: 'Only the alert creator or selected responder can complete the donation' },
        { status: 403 }
      );
    }

    // Check if response is selected
    if (response.status !== 'selected') {
      return NextResponse.json(
        { error: 'Only selected responses can be completed' },
        { status: 400 }
      );
    }

    // Complete the donation
    const success = await updateEmergencyResponseStatus(responseId, 'completed');
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to complete donation' },
        { status: 500 }
      );
    }

    // Update emergency alert status to fulfilled
    await updateEmergencyAlertStatus(response.emergency_alert_id, 'fulfilled');

    return NextResponse.json({
      success: true,
      message: 'Donation completed successfully',
      response: {
        id: response._id?.toString(),
        status: 'completed',
        completed_at: new Date()
      }
    });

  } catch (error) {
    console.error('Complete donation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
