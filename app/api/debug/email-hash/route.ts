// Debug endpoint to test email hashing
import { NextRequest, NextResponse } from 'next/server';
import { hashEmail } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);
    
    return NextResponse.json({
      email,
      emailHash,
      secret: process.env.EMAIL_HASH_SECRET || 'default-email-secret'
    });

  } catch (error) {
    console.error('Email hash debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
