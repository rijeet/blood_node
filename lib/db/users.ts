// User database operations

import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { User, UserCreateInput, UserAuthData } from '@/lib/models/user';
import { hashEmail } from '@/lib/auth/jwt';

const DB_NAME = process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'users';

/**
 * Get database collection
 */
async function getUsersCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<User>(COLLECTION_NAME);
}

/**
 * Create a new user
 */
export async function createUser(userData: UserCreateInput): Promise<User> {
  const collection = await getUsersCollection();
  
  const user: User = {
    ...userData,
    email_verified: false,
    public_profile: false,
    plan: 'free',
    recovery_email_sent: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  const result = await collection.insertOne(user);
  return { ...user, _id: result.insertedId };
}

/**
 * Find user by email hash
 */
export async function findUserByEmailHash(emailHash: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ email_hash: emailHash });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const emailHash = hashEmail(email);
  return findUserByEmailHash(emailHash);
}

/**
 * Find user by user code
 */
export async function findUserByUserCode(userCode: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ user_code: userCode });
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ _id: new ObjectId(userId) });
}

/**
 * Update user verification status
 */
export async function verifyUserEmail(userId: string): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        email_verified: true, 
        updated_at: new Date() 
      } 
    }
  );
}

/**
 * Update user plan
 */
export async function updateUserPlan(
  userId: string, 
  plan: 'free' | 'paid_block' | 'unlimited',
  expiresAt?: Date
): Promise<void> {
  const collection = await getUsersCollection();
  const updateData: any = { 
    plan,
    updated_at: new Date() 
  };
  
  if (expiresAt) {
    updateData.plan_expires = expiresAt;
  }
  
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

/**
 * Update recovery email sent status
 */
export async function markRecoveryEmailSent(userId: string): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        recovery_email_sent: true,
        updated_at: new Date() 
      } 
    }
  );
}

/**
 * Get user auth data (for JWT generation)
 */
export async function getUserAuthData(userId: string): Promise<UserAuthData | null> {
  const collection = await getUsersCollection();
  const user = await collection.findOne(
    { _id: new ObjectId(userId) },
    { 
      projection: { 
        user_code: 1, 
        email_hash: 1, 
        public_key: 1, 
        encrypted_private_key: 1, 
        master_salt: 1, 
        plan: 1 
      } 
    }
  );
  
  if (!user) return null;
  
  return {
    user_id: userId,
    user_code: user.user_code,
    email_hash: user.email_hash,
    public_key: user.public_key,
    encrypted_private_key: user.encrypted_private_key,
    master_salt: user.master_salt,
    plan: user.plan,
  };
}

/**
 * Update user location and blood group
 */
export async function updateUserLocation(
  userId: string,
  locationGeohash?: string,
  bloodGroupPublic?: string
): Promise<void> {
  const collection = await getUsersCollection();
  const updateData: any = { 
    updated_at: new Date() 
  };
  
  if (locationGeohash) {
    updateData.location_geohash = locationGeohash;
  }
  
  if (bloodGroupPublic) {
    updateData.blood_group_public = bloodGroupPublic;
  }
  
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

/**
 * Check if user code exists
 */
export async function userCodeExists(userCode: string): Promise<boolean> {
  const collection = await getUsersCollection();
  const count = await collection.countDocuments({ user_code: userCode });
  return count > 0;
}

/**
 * Search users by blood group and location
 */
export async function searchUsers(filters: {
  bloodGroup?: string;
  geohashes?: string[];
  excludeUserCode?: string;
  limit?: number;
}): Promise<User[]> {
  const collection = await getUsersCollection();
  
  const query: any = {};
  
  if (filters.bloodGroup) {
    query.blood_group_public = filters.bloodGroup;
  }
  
  if (filters.geohashes && filters.geohashes.length > 0) {
    query.location_geohash = { $in: filters.geohashes };
  }
  
  if (filters.excludeUserCode) {
    query.user_code = { $ne: filters.excludeUserCode };
  }
  
  // Only include users with public profiles or public blood groups
  query.$or = [
    { public_profile: true },
    { blood_group_public: { $exists: true } }
  ];
  
  return collection
    .find(query)
    .limit(filters.limit || 50)
    .toArray();
}
