// Email verification API route

import { NextRequest, NextResponse } from 'next/server';
import { validateVerificationToken, markTokenAsUsed } from '@/lib/db/verification';
import { verifyUserEmail } from '@/lib/db/users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const validation = await validateVerificationToken(token, 'email_verification');
    
    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (validation.token.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used
    const marked = await markTokenAsUsed(token);
    if (!marked) {
      return NextResponse.json(
        { error: 'Failed to process verification' },
        { status: 500 }
      );
    }

    // Verify user email
    if (validation.token.user_id) {
      await verifyUserEmail(validation.token.user_id.toString());
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const validation = await validateVerificationToken(token, 'email_verification');
    
    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (validation.token.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    // Mark token as used
    const marked = await markTokenAsUsed(token);
    if (!marked) {
      return NextResponse.json(
        { error: 'Failed to process verification' },
        { status: 500 }
      );
    }

    // Verify user email
    if (validation.token.user_id) {
      await verifyUserEmail(validation.token.user_id.toString());
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}