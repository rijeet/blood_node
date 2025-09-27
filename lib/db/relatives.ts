// Relatives database operations

import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Relative, RelativeCreateInput } from '@/lib/models/relative';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'relatives';

/**
 * Get database collection
 */
async function getRelativesCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<Relative>(COLLECTION_NAME);
}

/**
 * Create a new relative record
 */
export async function createRelative(
  userId: ObjectId,
  relativeData: RelativeCreateInput
): Promise<Relative> {
  const collection = await getRelativesCollection();
  
  const relative: Relative = {
    user_id: userId,
    ...relativeData,
    status: relativeData.status || 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  const result = await collection.insertOne(relative);
  return { ...relative, _id: result.insertedId };
}

/**
 * Get relatives for a user
 */
export async function getRelativesByOwner(userId: ObjectId): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  return collection.find({ user_id: userId }).toArray();
}

/**
 * Get relative by ID
 */
export async function getRelativeById(relativeId: string): Promise<Relative | null> {
  const collection = await getRelativesCollection();
  return collection.findOne({ _id: new ObjectId(relativeId) });
}

/**
 * Update relative record
 */
export async function updateRelative(
  relativeId: string,
  updates: Partial<Relative>
): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.updateOne(
    { _id: new ObjectId(relativeId) },
    { $set: updates }
  );
}

/**
 * Add DEK wrapped entry to a relative record
 */
export async function addDekWrapped(
  relativeId: string,
  dekWrapped: {
    recipient_user_code: string;
    wrapped: string;
    meta: Record<string, any>;
  }
): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.updateOne(
    { _id: new ObjectId(relativeId) },
    { $push: { dek_wrapped: dekWrapped } }
  );
}

/**
 * Remove DEK wrapped entry from a relative record
 */
export async function removeDekWrapped(
  relativeId: string,
  recipientUserCode: string
): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.updateOne(
    { _id: new ObjectId(relativeId) },
    { $pull: { dek_wrapped: { recipient_user_code: recipientUserCode } } }
  );
}

/**
 * Get relatives where user has access (either as owner or shared)
 */
export async function getAccessibleRelatives(userId: ObjectId): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  
  return collection.find({
    $or: [
      { user_id: userId }, // User owns the record
      { relative_user_id: userId } // User is the relative in someone else's record
    ]
  }).toArray();
}

/**
 * Search relatives by criteria
 */
export async function searchRelatives(filters: {
  bloodGroup?: string;
  relation?: string;
  geohashes?: string[];
  availableNow?: boolean;
  userId: ObjectId;
  limit?: number;
}): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  
  const pipeline = [
    // First, find relatives accessible to the user
    {
      $match: {
        $or: [
          { user_id: filters.userId },
          { relative_user_id: filters.userId }
        ]
      }
    },
    
    // Join with users collection to get user data
    {
      $lookup: {
        from: 'users',
        localField: 'relative_user_id',
        foreignField: '_id',
        as: 'relative_user'
      }
    },
    
    // Filter based on criteria
    {
      $match: {
        ...(filters.relation && { relation: filters.relation }),
        ...(filters.bloodGroup && { 
          'relative_user.blood_group_public': filters.bloodGroup 
        }),
        ...(filters.geohashes && {
          'relative_user.location_geohash': { $in: filters.geohashes }
        })
      }
    },
    
    // Limit results
    { $limit: filters.limit || 50 }
  ];
  
  return collection.aggregate<Relative>(pipeline).toArray();
}

/**
 * Count relatives for a user (for plan enforcement)
 */
export async function countRelativesByOwner(userId: ObjectId): Promise<number> {
  const collection = await getRelativesCollection();
  return collection.countDocuments({ user_id: userId });
}

/**
 * Delete relative record
 */
export async function deleteRelative(relativeId: string, userId: ObjectId): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.deleteOne({ 
    _id: new ObjectId(relativeId),
    user_id: userId // Ensure only owner can delete
  });
}

/**
 * Update last donation date
 */
export async function updateLastDonationDate(
  relativeId: string,
  donationDate: Date
): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.updateOne(
    { _id: new ObjectId(relativeId) },
    { $set: { last_donation_date: donationDate } }
  );
}

/**
 * Get relatives available for donation (based on last donation date)
 */
export async function getAvailableRelatives(
  userId: ObjectId,
  minimumDaysSinceLastDonation: number = 56 // Standard blood donation interval
): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minimumDaysSinceLastDonation);
  
  return collection.find({
    $and: [
      {
        $or: [
          { user_id: userId },
          { relative_user_id: userId }
        ]
      },
      {
        $or: [
          { last_donation_date: { $exists: false } }, // Never donated
          { last_donation_date: { $lt: cutoffDate } } // Long enough since last donation
        ]
      }
    ]
  }).toArray();
}
