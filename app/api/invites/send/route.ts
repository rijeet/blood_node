// Send family member invitation API route
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { findUserById } from '@/lib/db/users';
import { createInvite } from '@/lib/db/invites';
import { sendFamilyInviteEmail } from '@/lib/email/service';
import { hashEmail, generateSecureToken } from '@/lib/auth/jwt';

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
      email, 
      relation, 
      permissions = ['blood_group', 'location', 'contact'] 
    } = body;

    if (!email || !relation) {
      return NextResponse.json(
        { error: 'Email and relation are required' },
        { status: 400 }
      );
    }

    // Validate relation
    const validRelations = [
      'parent', 'child', 'sibling', 'spouse', 'grandparent', 'grandchild',
      'aunt', 'uncle', 'cousin', 'nephew', 'niece', 'other'
    ];
    
    if (!validRelations.includes(relation)) {
      return NextResponse.json(
        { error: 'Invalid relation type' },
        { status: 400 }
      );
    }

    // Hash email for invite
    const emailHash = hashEmail(email);
    
    // Generate invite token
    const inviteToken = generateSecureToken(32);
    
    // Create invitation
    const invite = await createInvite({
      invite_token: inviteToken,
      inviter_user_code: user.user_code,
      inviter_public_key: user.public_key,
      invitee_email_hash: emailHash,
      relation
    });

    // Send invitation email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const inviterName = user.name || `User ${user.user_code}`;
      await sendFamilyInviteEmail(
        inviterName,
        email,
        inviteToken,
        relation,
        baseUrl
      );
      
      console.log('Family invitation sent to:', email, 'from:', user.user_code);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        email,
        relation,
        permissions,
        expires_in_hours: 24,
        inviter: user.user_code
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get invitation statistics for the user
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

    // Get invitation statistics
    // This would require a query to find all invitations sent by this user
    // For now, return a simple response
    return NextResponse.json({
      success: true,
      statistics: {
        sent: 0,
        accepted: 0,
        pending: 0,
        expired: 0
      }
    });

  } catch (error) {
    console.error('Get invitation stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
