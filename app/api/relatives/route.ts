// Relatives API route

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '@/lib/middleware/auth';
import { 
  createRelative, 
  getRelativesByOwner, 
  countRelativesByOwner 
} from '@/lib/db/relatives';
import { findUserById } from '@/lib/db/users';
import { RelativeCreateInput } from '@/lib/models/relative';

// Get relatives for authenticated user
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

    const relatives = await getRelativesByOwner(new ObjectId(user.sub));
    
    return NextResponse.json({
      success: true,
      relatives
    });

  } catch (error) {
    console.error('Get relatives error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new relative
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      relative_user_id,
      relation,
      visibility,
      encrypted_blob,
      dek_wrapped,
      last_donation_date,
      time_availability
    }: RelativeCreateInput = body;

    // Validate required fields
    if (!relation || !visibility || !encrypted_blob || !dek_wrapped) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check plan limits
    const currentCount = await countRelativesByOwner(new ObjectId(user.sub));
    const userRecord = await findUserById(user.sub);
    
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Plan enforcement
    let maxRelatives = 20; // Free plan default
    if (userRecord.plan === 'unlimited') {
      maxRelatives = Infinity;
    } else if (userRecord.plan === 'paid_block') {
      // TODO: Calculate based on purchased blocks
      maxRelatives = 40; // Example: 20 + purchased block of 20
    }

    if (currentCount >= maxRelatives) {
      return NextResponse.json({
        error: 'Plan limit reached',
        requires_upgrade: true,
        current_count: currentCount,
        max_allowed: maxRelatives,
        plan: userRecord.plan
      }, { status: 402 });
    }

    // Create relative
    const relativeData: RelativeCreateInput = {
      relative_user_id: relative_user_id ? new ObjectId(relative_user_id) : undefined,
      relation,
      visibility,
      encrypted_blob,
      dek_wrapped,
      last_donation_date: last_donation_date ? new Date(last_donation_date) : undefined,
      time_availability: time_availability || undefined
    };

    const relative = await createRelative(new ObjectId(user.sub), relativeData);

    return NextResponse.json({
      success: true,
      relative
    }, { status: 201 });

  } catch (error) {
    console.error('Create relative error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
