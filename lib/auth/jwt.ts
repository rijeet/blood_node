// JWT and token management utilities

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';

export interface JWTPayload {
  sub: string; // user_id
  user_code: string;
  email_hash: string;
  plan: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenData {
  token_hash: string;
  user_id: string;
  device_id: string;
  fingerprint_hash: string;
  expires_at: Date;
}

/**
 * Generate access JWT token (short-lived)
 */
export function generateAccessToken(payload: {
  user_id: string;
  user_code: string;
  email_hash: string;
  plan: string;
}): string {
  return jwt.sign(
    {
      sub: payload.user_id,
      user_code: payload.user_code,
      email_hash: payload.email_hash,
      plan: payload.plan,
    },
    JWT_SECRET,
    {
      expiresIn: '15m', // Short-lived access token
      issuer: 'blood-node',
      audience: 'blood-node-app',
    }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'blood-node',
      audience: 'blood-node-app',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generate opaque refresh token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash refresh token for storage
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate device fingerprint hash
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const fingerprint = `${userAgent}:${ip}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Generate device ID
 */
export function generateDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Create refresh token data for storage
 */
export function createRefreshTokenData(
  userId: string,
  deviceId: string,
  fingerprintHash: string,
  expiresInDays: number = 30
): RefreshTokenData {
  const token = generateRefreshToken();
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return {
    token_hash: tokenHash,
    user_id: userId,
    device_id: deviceId,
    fingerprint_hash: fingerprintHash,
    expires_at: expiresAt,
  };
}

/**
 * Verify refresh token hash
 */
export function verifyRefreshTokenHash(token: string, storedHash: string): boolean {
  const tokenHash = hashRefreshToken(token);
  return tokenHash === storedHash;
}

/**
 * Generate HMAC for email hashing
 */
export function hashEmail(email: string): string {
  // Use consistent secret - if no env var is set, use the same default as client
  const secret = process.env.EMAIL_HASH_SECRET || 'default-email-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex');
}

/**
 * Generate secure random token for invites, verification, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate UUID v4 token for verification
 */
export function generateUUIDToken(): string {
  return crypto.randomUUID();
}

/**
 * Hash password using bcrypt (to be used on server-side)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}
