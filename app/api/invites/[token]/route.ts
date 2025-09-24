// Individual invite API route

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/auth';
import { 
  findInviteByToken, 
  acceptInvite, 
  declineInvite 
} from '@/lib/db/invites';
import { addDekWrapped } from '@/lib/db/relatives';

// Get invite details (no auth required for viewing invite)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const invite = await findInviteByToken(resolvedParams.token);
    
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive data in public view
    return NextResponse.json({
      success: true,
      invite: {
        id: invite._id,
        inviter_user_code: invite.inviter_user_code,
        inviter_public_key: invite.inviter_public_key,
        relation: invite.relation,
        status: invite.status,
        created_at: invite.created_at
      }
    });

  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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
    const { dek_wrapped_for_inviter, share_fields = [] } = body;

    const resolvedParams = await params;
    const invite = await findInviteByToken(resolvedParams.token);
    
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invite already processed' },
        { status: 409 }
      );
    }

    // Verify that the authenticated user is the invitee
    // This requires the user to be signed up with the invited email
    if (invite.invitee_email_hash !== user.email_hash) {
      return NextResponse.json(
        { error: 'This invite is not for you' },
        { status: 403 }
      );
    }

    if (!dek_wrapped_for_inviter) {
      return NextResponse.json(
        { error: 'DEK wrapped for inviter is required' },
        { status: 400 }
      );
    }

    // Accept the invite
    await acceptInvite(resolvedParams.token, {
      dek_wrapped_for_inviter
    });

    // Note: In a real implementation, you would also:
    // 1. Create or update the relative record for the invitee
    // 2. Add the DEK wrapped entry for the inviter
    // 3. Potentially create a reciprocal relationship
    
    // For now, we'll assume the invitee will create their own relative record
    // and add the DEK wrapped entry for the inviter

    return NextResponse.json({
      success: true,
      message: 'Invite accepted successfully',
      shared_fields: share_fields
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Decline invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Authenticate user
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const invite = await findInviteByToken(resolvedParams.token);
    
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invite already processed' },
        { status: 409 }
      );
    }

    // Verify that the authenticated user is the invitee
    if (invite.invitee_email_hash !== user.email_hash) {
      return NextResponse.json(
        { error: 'This invite is not for you' },
        { status: 403 }
      );
    }

    await declineInvite(resolvedParams.token);

    return NextResponse.json({
      success: true,
      message: 'Invite declined'
    });

  } catch (error) {
    console.error('Decline invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
