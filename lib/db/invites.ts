// Invites database operations

import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Invite, InviteCreateInput, InviteAcceptInput } from '@/lib/models/invite';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'invites';

/**
 * Get database collection
 */
async function getInvitesCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<Invite>(COLLECTION_NAME);
}

/**
 * Create a new invite
 */
export async function createInvite(inviteData: InviteCreateInput): Promise<Invite> {
  const collection = await getInvitesCollection();
  
  const invite: Invite = {
    ...inviteData,
    invite_token: inviteData.invite_token || '', // Use provided token or empty string
    status: 'pending',
    created_at: new Date(),
    accepted_at: null,
  };
  
  const result = await collection.insertOne(invite);
  return { ...invite, _id: result.insertedId };
}

/**
 * Find invite by token
 */
export async function findInviteByToken(token: string): Promise<Invite | null> {
  const collection = await getInvitesCollection();
  return collection.findOne({ invite_token: token });
}

/**
 * Get invites sent by user
 */
export async function getInvitesByInviter(inviterUserCode: string): Promise<Invite[]> {
  const collection = await getInvitesCollection();
  return collection.find({ inviter_user_code: inviterUserCode }).toArray();
}

/**
 * Get invites received by user (by email hash)
 */
export async function getInvitesByInvitee(inviteeEmailHash: string): Promise<Invite[]> {
  const collection = await getInvitesCollection();
  return collection.find({ 
    invitee_email_hash: inviteeEmailHash,
    status: 'pending'
  }).toArray();
}

/**
 * Accept an invite
 */
export async function acceptInvite(
  inviteToken: string,
  acceptData: InviteAcceptInput
): Promise<void> {
  const collection = await getInvitesCollection();
  await collection.updateOne(
    { invite_token: inviteToken },
    { 
      $set: { 
        status: 'accepted',
        accepted_at: new Date()
      } 
    }
  );
}

/**
 * Decline an invite
 */
export async function declineInvite(inviteToken: string): Promise<void> {
  const collection = await getInvitesCollection();
  await collection.updateOne(
    { invite_token: inviteToken },
    { 
      $set: { 
        status: 'declined',
        accepted_at: new Date()
      } 
    }
  );
}

/**
 * Check if invite exists between users
 */
export async function inviteExists(
  inviterUserCode: string,
  inviteeEmailHash: string
): Promise<boolean> {
  const collection = await getInvitesCollection();
  const count = await collection.countDocuments({
    inviter_user_code: inviterUserCode,
    invitee_email_hash: inviteeEmailHash,
    status: { $in: ['pending', 'accepted'] }
  });
  return count > 0;
}

/**
 * Delete invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  const collection = await getInvitesCollection();
  await collection.deleteOne({ _id: new ObjectId(inviteId) });
}

/**
 * Clean up expired invites (older than 30 days)
 */
export async function cleanupExpiredInvites(): Promise<number> {
  const collection = await getInvitesCollection();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  const result = await collection.deleteMany({
    status: 'pending',
    created_at: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
}
