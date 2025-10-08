// User database operations

import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { User, UserCreateInput, UserAuthData } from '@/lib/models/user';
import { hashEmail } from '@/lib/auth/jwt';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'users';

/**
 * Get database collection
 */
export async function getUsersCollection() {
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
  const user = await collection.findOne({ email_hash: emailHash });
  
  if (user) {
    console.log('🔍 findUserByEmailHash - User found:');
    console.log('  Keys:', Object.keys(user));
    console.log('  password_hash:', user.password_hash);
    console.log('  password_hash type:', typeof user.password_hash);
  } else {
    console.log('🔍 findUserByEmailHash - User not found');
  }
  
  return user;
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
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    location_address?: string;
    blood_group_public?: string;
    last_donation_date?: Date;
    public_profile?: boolean;
  }
): Promise<void> {
  const collection = await getUsersCollection();
  const updateData: any = { 
    updated_at: new Date() 
  };
  
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  
  if (updates.phone !== undefined) {
    updateData.phone = updates.phone;
  }
  
  if (updates.location_address !== undefined) {
    updateData.location_address = updates.location_address;
  }
  
  if (updates.blood_group_public !== undefined) {
    updateData.blood_group_public = updates.blood_group_public;
  }
  
  if (updates.last_donation_date !== undefined) {
    updateData.last_donation_date = updates.last_donation_date;
  }
  
  if (updates.public_profile !== undefined) {
    updateData.public_profile = updates.public_profile;
  }
  
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

/**
 * Update last donation date
 */
export async function updateLastDonationDate(
  userId: string,
  donationDate: Date
): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        last_donation_date: donationDate,
        updated_at: new Date() 
      } 
    }
  );
}

/**
 * Update last donation date (ObjectId version)
 */
export async function updateUserLastDonationDate(
  userId: ObjectId,
  donationDate: Date
): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: userId },
    { 
      $set: { 
        last_donation_date: donationDate,
        updated_at: new Date() 
      } 
    }
  );
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
): Promise<void> {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        password_hash: newPasswordHash,
        updated_at: new Date() 
      } 
    }
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
    // Use prefix matching for geohash search (precision 5 prefixes match precision 7 geohashes)
    query.location_geohash = { $regex: `^(${filters.geohashes.join('|')})` };
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

/**
 * Get users with availability information
 */
export async function getUsersWithAvailability(filters: {
  bloodGroup?: string;
  bloodGroups?: string[]; // Support multiple blood types
  geohashes?: string[];
  excludeUserCode?: string;
  onlyAvailable?: boolean;
  limit?: number;
}): Promise<Array<User & { availability: ReturnType<typeof import('../models/user').calculateAvailability> }>> {
  const collection = await getUsersCollection();
  
  const query: any = {};
  
  if (filters.bloodGroup) {
    query.blood_group_public = filters.bloodGroup;
  } else if (filters.bloodGroups && filters.bloodGroups.length > 0) {
    query.blood_group_public = { $in: filters.bloodGroups };
  }
  
  if (filters.geohashes && filters.geohashes.length > 0) {
    // Use prefix matching for geohash search (precision 5 prefixes match precision 7 geohashes)
    query.location_geohash = { $regex: `^(${filters.geohashes.join('|')})` };
  }
  
  if (filters.excludeUserCode) {
    query.user_code = { $ne: filters.excludeUserCode };
  }
  
  // Only include users with public profiles for donor search
  query.public_profile = true;
  
  const users = await collection
    .find(query)
    .limit(filters.limit || 50)
    .toArray();

  // Add availability information
  const usersWithAvailability = users.map(user => {
    const { calculateAvailability } = require('../models/user');
    const availability = calculateAvailability(user.last_donation_date);
    
    return {
      ...user,
      availability
    };
  });

  // Filter by availability if requested
  if (filters.onlyAvailable) {
    return usersWithAvailability.filter(user => user.availability.isAvailable);
  }

  return usersWithAvailability;
}
