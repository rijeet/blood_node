// Verification token database operations
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { VerificationToken, VerificationTokenCreateInput, TokenValidationResult } from '@/lib/models/verification';
import { generateSecureToken, generateUUIDToken } from '@/lib/auth/jwt';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'verification_tokens';

/**
 * Get database collection
 */
async function getVerificationCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<VerificationToken>(COLLECTION_NAME);
}

/**
 * Create a verification token
 */
export async function createVerificationToken(
  data: Omit<VerificationTokenCreateInput, 'token' | 'expires_at'> & {
    expiresInHours?: number;
  }
): Promise<{ token: string; tokenId: ObjectId }> {
  const collection = await getVerificationCollection();
  
  // Generate secure token (UUID for email verification, hex for others)
  const token = data.token_type === 'email_verification' ? generateUUIDToken() : generateSecureToken(32);
  
  // Set expiration (default 1 hour)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 1));
  
  const verificationToken: VerificationToken = {
    ...data,
    token,
    expires_at: expiresAt,
    used: false,
    created_at: new Date(),
  };
  
  const result = await collection.insertOne(verificationToken);
  return { token, tokenId: result.insertedId };
}

/**
 * Find verification token by token string
 */
export async function findVerificationTokenByToken(token: string): Promise<VerificationToken | null> {
  const collection = await getVerificationCollection();
  return collection.findOne({ token });
}

/**
 * Find and validate a verification token
 */
export async function validateVerificationToken(
  token: string | null,
  expectedType?: VerificationToken['token_type'],
  codeSearch?: { email_hash: string; code: string }
): Promise<TokenValidationResult> {
  const collection = await getVerificationCollection();
  
  try {
    const query: Record<string, unknown> = { used: false };
    
    if (token) {
      // Token-based search
      query.token = token;
    } else if (codeSearch) {
      // Code-based search for verification codes
      query.email_hash = codeSearch.email_hash;
      query.token_type = expectedType;
      
      // Search in verification_data.code or recovery_data.code
      query.$or = [
        { 'verification_data.code': codeSearch.code },
        { 'recovery_data.code': codeSearch.code }
      ];
    } else {
      return { valid: false, error: 'Token or code search parameters required' };
    }
    
    const verificationToken = await collection.findOne(query);
    
    if (!verificationToken) {
      return { valid: false, error: 'Invalid or expired token' };
    }
    
    // Check if token has expired
    if (verificationToken.expires_at < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }
    
    // Check token type if specified
    if (expectedType && verificationToken.token_type !== expectedType) {
      return { valid: false, error: 'Invalid token type' };
    }
    
    return { valid: true, token: verificationToken };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Mark a verification token as used
 */
export async function markTokenAsUsed(token: string): Promise<boolean> {
  const collection = await getVerificationCollection();
  
  try {
    const result = await collection.updateOne(
      { token, used: false },
      { 
        $set: { 
          used: true, 
          used_at: new Date() 
        } 
      }
    );
    
    return result.modifiedCount === 1;
  } catch (error) {
    console.error('Error marking token as used:', error);
    return false;
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const collection = await getVerificationCollection();
  
  try {
    const result = await collection.deleteMany({
      $or: [
        { expires_at: { $lt: new Date() } },
        { used: true, used_at: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used tokens older than 24h
      ]
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    return 0;
  }
}

/**
 * Find verification tokens by email hash
 */
export async function findTokensByEmailHash(
  emailHash: string,
  tokenType?: VerificationToken['token_type']
): Promise<VerificationToken[]> {
  const collection = await getVerificationCollection();
  
  const query: Record<string, unknown> = { 
    email_hash: emailHash,
    used: false,
    expires_at: { $gt: new Date() }
  };
  
  if (tokenType) {
    query.token_type = tokenType;
  }
  
  return collection.find(query).sort({ created_at: -1 }).toArray();
}

/**
 * Revoke all tokens for a user (useful when password is changed)
 */
export async function revokeUserTokens(
  userId: ObjectId,
  tokenType?: VerificationToken['token_type']
): Promise<number> {
  const collection = await getVerificationCollection();
  
  try {
    const query: Record<string, unknown> = {
      $or: [
        { user_id: userId },
        { 'recovery_data.user_id': userId },
        { 'invite_data.inviter_user_id': userId }
      ],
      used: false
    };
    
    if (tokenType) {
      query.token_type = tokenType;
    }
    
    const result = await collection.updateMany(
      query,
      { 
        $set: { 
          used: true, 
          used_at: new Date() 
        } 
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error revoking user tokens:', error);
    return 0;
  }
}

/**
 * Get token statistics
 */
export async function getTokenStatistics(): Promise<{
  total: number;
  active: number;
  expired: number;
  used: number;
  byType: Record<string, number>;
}> {
  const collection = await getVerificationCollection();
  
  try {
    const [total, active, expired, used, byType] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ used: false, expires_at: { $gt: new Date() } }),
      collection.countDocuments({ used: false, expires_at: { $lt: new Date() } }),
      collection.countDocuments({ used: true }),
      collection.aggregate([
        { $group: { _id: '$token_type', count: { $sum: 1 } } }
      ]).toArray()
    ]);
    
    const typeStats: Record<string, number> = {};
    byType.forEach((item) => {
      const typedItem = item as { _id: string; count: number };
      typeStats[typedItem._id] = typedItem.count;
    });
    
    return { total, active, expired, used, byType: typeStats };
  } catch (error) {
    console.error('Error getting token statistics:', error);
    return { total: 0, active: 0, expired: 0, used: 0, byType: {} };
  }
}
