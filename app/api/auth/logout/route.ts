// Logout API route

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { hashRefreshToken } from '@/lib/auth/jwt';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      // Hash the token to find it in database
      const tokenHash = hashRefreshToken(refreshToken);

      // Revoke token in database
      const client = await clientPromise;
      if (!client) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
      const refreshTokensCollection = client.db(DB_NAME).collection('refresh_tokens');
      
      await refreshTokensCollection.updateOne(
        { token_hash: tokenHash },
        { $set: { revoked: true } }
      );
    }

    // Clear refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Revoke all devices for the user
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const tokenHash = hashRefreshToken(refreshToken);

    // Find the token to get user_id
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const refreshTokensCollection = client.db(DB_NAME).collection('refresh_tokens');
    
    const storedToken = await refreshTokensCollection.findOne({
      token_hash: tokenHash
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Revoke all tokens for this user
    await refreshTokensCollection.updateMany(
      { user_id: storedToken.user_id },
      { $set: { revoked: true } }
    );

    // Clear refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'All devices logged out successfully'
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout all devices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
