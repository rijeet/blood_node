// Refresh token API route

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashRefreshToken,
  generateDeviceFingerprint,
  verifyRefreshTokenHash
} from '@/lib/auth/jwt';
import { getUserAuthData } from '@/lib/db/users';

const DB_NAME = process.env.DB_NAME || 'blood_node';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Hash the token to find it in database
    const tokenHash = hashRefreshToken(refreshToken);

    // Find token in database
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const refreshTokensCollection = client.db(DB_NAME).collection('refresh_tokens');
    
    const storedToken = await refreshTokensCollection.findOne({
      token_hash: tokenHash,
      revoked: false,
      expires_at: { $gt: new Date() }
    });

    if (!storedToken) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      response.cookies.set('refresh_token', '', { 
        httpOnly: true, 
        maxAge: 0,
        path: '/' 
      });
      return response;
    }

    // Verify fingerprint (optional security measure)
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const currentFingerprintHash = generateDeviceFingerprint(userAgent, ip);

    // Note: In production, you might want to be more strict about fingerprint changes
    // For now, we'll just log if they don't match
    if (currentFingerprintHash !== storedToken.fingerprint_hash) {
      console.warn('Device fingerprint mismatch for refresh token');
    }

    // Get user auth data
    const authData = await getUserAuthData(storedToken.user_id.toString());
    if (!authData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      user_id: authData.user_id,
      user_code: authData.user_code,
      email_hash: authData.email_hash,
      plan: authData.plan
    });

    // Generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    // Update stored token (revoke old, insert new)
    await refreshTokensCollection.updateOne(
      { _id: storedToken._id },
      { $set: { revoked: true } }
    );

    // Insert new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await refreshTokensCollection.insertOne({
      token_hash: newTokenHash,
      user_id: storedToken.user_id,
      device_id: storedToken.device_id,
      fingerprint_hash: currentFingerprintHash,
      expires_at: expiresAt,
      revoked: false,
      created_at: new Date()
    });

    // Set new refresh token cookie
    const response = NextResponse.json({
      success: true,
      access_token: accessToken
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
