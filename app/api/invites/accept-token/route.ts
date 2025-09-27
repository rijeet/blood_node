// Accept family invitation using token API route
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById, findUserByUserCode } from '@/lib/db/users';
import { findInviteByToken, acceptInvite } from '@/lib/db/invites';
import { createRelative } from '@/lib/db/relatives';
import { hashEmail } from '@/lib/auth/jwt';

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

    // Get current user
    const currentUser = await findUserById(payload.sub);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { inviteToken } = body;

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Find the invitation by token
    const invite = await findInviteByToken(inviteToken);
    
    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Check if invitation is still pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been used or expired' },
        { status: 400 }
      );
    }

    // Get inviter details by user_code
    const inviter = await findUserByUserCode(invite.inviter_user_code);
    if (!inviter) {
      return NextResponse.json(
        { error: 'Inviter not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to invite themselves
    if (inviter.user_code === currentUser.user_code) {
      return NextResponse.json(
        { error: 'Cannot invite yourself' },
        { status: 400 }
      );
    }

    // Mark invitation as accepted
    await acceptInvite(inviteToken, {
      dek_wrapped_for_inviter: {
        recipient_user_code: currentUser.user_code,
        wrapped: '', // Placeholder for now
        meta: {}
      }
    });

    // Create the family relationship
    // For now, we'll create a simple relationship record
    // In a full implementation, this would involve encryption and DEK sharing
    const relativeData = {
      relative_user_id: new ObjectId(currentUser._id),
      relation: invite.relation,
      status: 'active' as const,
      visibility: 'shared' as const,
    };

    await createRelative(new ObjectId(inviter._id), relativeData);

    // Create reciprocal relationship (current user can see inviter as their relative)
    const reciprocalRelation = getReciprocalRelation(invite.relation);
    const reciprocalData = {
      relative_user_id: new ObjectId(inviter._id),
      relation: reciprocalRelation,
      status: 'active' as const,
      visibility: 'shared' as const,
    };

    await createRelative(new ObjectId(currentUser._id), reciprocalData);

    return NextResponse.json({
      success: true,
      message: 'Family invitation accepted successfully!',
      connection: {
        inviter_name: inviter.name || `User ${inviter.user_code}`,
        inviter_code: inviter.user_code,
        relation: invite.relation,
        reciprocal_relation: reciprocalRelation
      }
    });

  } catch (error) {
    console.error('Accept invitation token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get reciprocal relationship type
 */
function getReciprocalRelation(relation: string): string {
  const reciprocalMap: Record<string, string> = {
    'parent': 'child',
    'child': 'parent',
    'sibling': 'sibling',
    'spouse': 'spouse',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'aunt': 'niece/nephew',
    'uncle': 'niece/nephew',
    'cousin': 'cousin',
    'nephew': 'uncle/aunt',
    'niece': 'uncle/aunt',
    'other': 'other'
  };
  
  return reciprocalMap[relation] || 'other';
}
