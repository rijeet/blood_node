// Invites API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { 
  createInvite, 
  getInvitesByInviter, 
  getInvitesByInvitee,
  inviteExists 
} from '@/lib/db/invites';
import { findUserByUserCode } from '@/lib/db/users';
import { generateSecureToken, hashEmail } from '@/lib/auth/jwt';

// Get invites (sent and received)
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
    const type = searchParams.get('type'); // 'sent' or 'received'

    let invites;
    if (type === 'sent') {
      invites = await getInvitesByInviter(user.user_code);
    } else if (type === 'received') {
      invites = await getInvitesByInvitee(user.email_hash);
    } else {
      // Get both
      const [sentInvites, receivedInvites] = await Promise.all([
        getInvitesByInviter(user.user_code),
        getInvitesByInvitee(user.email_hash)
      ]);
      invites = { sent: sentInvites, received: receivedInvites };
    }

    return NextResponse.json({
      success: true,
      invites
    });

  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send new invite
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
    const { invitee_email, relation } = body;

    if (!invitee_email || !relation) {
      return NextResponse.json(
        { error: 'Invitee email and relation are required' },
        { status: 400 }
      );
    }

    // Hash invitee email
    const inviteeEmailHash = hashEmail(invitee_email);

    // Check if invite already exists
    const exists = await inviteExists(user.user_code, inviteeEmailHash);
    if (exists) {
      return NextResponse.json(
        { error: 'Invite already exists for this user' },
        { status: 409 }
      );
    }

    // Get inviter's user data
    const inviter = await findUserByUserCode(user.user_code);
    if (!inviter) {
      return NextResponse.json(
        { error: 'Inviter not found' },
        { status: 404 }
      );
    }

    // Generate invite token
    const inviteToken = generateSecureToken();

    // Create invite
    const inviteData = {
      inviter_user_code: user.user_code,
      inviter_public_key: inviter.public_key,
      invitee_email_hash: inviteeEmailHash,
      relation
    };

    const invite = await createInvite(inviteData);
    
    // Set the invite token
    invite.invite_token = inviteToken;

    // TODO: Send invitation email to invitee_email
    // Email should include:
    // - Invitation details (who invited, what relation)
    // - Link to accept: /invite/accept?token=inviteToken
    // - Instructions about Blood Node and privacy

    return NextResponse.json({
      success: true,
      invite: {
        id: invite._id,
        invite_token: inviteToken,
        invitee_email_hash: inviteeEmailHash,
        relation,
        status: invite.status,
        created_at: invite.created_at
      },
      message: 'Invitation sent successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Send invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
