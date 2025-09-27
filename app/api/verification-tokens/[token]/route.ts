// Verification token API route for backward compatibility

import { NextRequest, NextResponse } from 'next/server';
import { findVerificationTokenByToken } from '@/lib/db/verification';

// Get verification token details (no auth required for viewing token)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = await findVerificationTokenByToken(resolvedParams.token);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (token.expires_at && new Date() > new Date(token.expires_at)) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      ...token
    });

  } catch (error) {
    console.error('Get verification token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
