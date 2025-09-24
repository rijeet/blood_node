// Relatives database operations

import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Relative, RelativeCreateInput } from '@/lib/models/relative';

const DB_NAME = process.env.DB_NAME || 'blood_node';
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
  ownerUserCode: string,
  relativeData: RelativeCreateInput
): Promise<Relative> {
  const collection = await getRelativesCollection();
  
  const relative: Relative = {
    owner_user_code: ownerUserCode,
    ...relativeData,
    created_at: new Date(),
  };
  
  const result = await collection.insertOne(relative);
  return { ...relative, _id: result.insertedId };
}

/**
 * Get relatives for a user
 */
export async function getRelativesByOwner(ownerUserCode: string): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  return collection.find({ owner_user_code: ownerUserCode }).toArray();
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
export async function getAccessibleRelatives(userCode: string): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  
  return collection.find({
    $or: [
      { owner_user_code: userCode }, // User owns the record
      { 'dek_wrapped.recipient_user_code': userCode } // User has been granted access
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
  userCode: string;
  limit?: number;
}): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  
  const pipeline = [
    // First, find relatives accessible to the user
    {
      $match: {
        $or: [
          { owner_user_code: filters.userCode },
          { 'dek_wrapped.recipient_user_code': filters.userCode }
        ]
      }
    },
    
    // Join with users collection to get user data
    {
      $lookup: {
        from: 'users',
        localField: 'relative_user_code',
        foreignField: 'user_code',
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
export async function countRelativesByOwner(ownerUserCode: string): Promise<number> {
  const collection = await getRelativesCollection();
  return collection.countDocuments({ owner_user_code: ownerUserCode });
}

/**
 * Delete relative record
 */
export async function deleteRelative(relativeId: string, ownerUserCode: string): Promise<void> {
  const collection = await getRelativesCollection();
  await collection.deleteOne({ 
    _id: new ObjectId(relativeId),
    owner_user_code: ownerUserCode // Ensure only owner can delete
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
  userCode: string,
  minimumDaysSinceLastDonation: number = 56 // Standard blood donation interval
): Promise<Relative[]> {
  const collection = await getRelativesCollection();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minimumDaysSinceLastDonation);
  
  return collection.find({
    $and: [
      {
        $or: [
          { owner_user_code: userCode },
          { 'dek_wrapped.recipient_user_code': userCode }
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
