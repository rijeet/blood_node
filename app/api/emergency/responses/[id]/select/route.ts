import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { 
  getEmergencyResponseById, 
  updateEmergencyResponseStatus,
  getEmergencyResponses,
  cancelPendingResponses
} from '@/lib/db/emergency-responses';
import { getEmergencyAlertById, updateEmergencyAlertStatus } from '@/lib/db/emergency';
import { ObjectId } from 'mongodb';

// POST - Select a responder for emergency
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

    // Check if user is the alert creator
    if (emergencyAlert.user_id.toString() !== user._id!.toString()) {
      return NextResponse.json(
        { error: 'Only the alert creator can select responders' },
        { status: 403 }
      );
    }

    // Check if response is still pending
    if (response.status !== 'pending') {
      return NextResponse.json(
        { error: 'This response is no longer available for selection' },
        { status: 400 }
      );
    }

    // Check if emergency is still active
    if (emergencyAlert.status !== 'active') {
      return NextResponse.json(
        { error: 'This emergency alert is no longer active' },
        { status: 400 }
      );
    }

    // Select the responder
    const success = await updateEmergencyResponseStatus(responseId, 'selected');
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to select responder' },
        { status: 500 }
      );
    }

    // Cancel all other pending responses
    const cancelledCount = await cancelPendingResponses(response.emergency_alert_id);

    // Update emergency alert status to in_progress
    await updateEmergencyAlertStatus(response.emergency_alert_id, 'in_progress');

    // Get updated responses
    const updatedResponses = await getEmergencyResponses(response.emergency_alert_id);

    return NextResponse.json({
      success: true,
      message: 'Responder selected successfully',
      selected_response: response,
      cancelled_responses: cancelledCount,
      updated_responses: updatedResponses
    });

  } catch (error) {
    console.error('Select responder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
