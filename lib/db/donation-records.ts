import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { DonationRecord, DonationRecordCreateInput } from '../models/donation-record';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'donation_records';

export async function createDonationRecord(
  recordData: DonationRecordCreateInput
): Promise<DonationRecord> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<DonationRecord>(COLLECTION_NAME);

  const donationRecord: DonationRecord = {
    donor_id: recordData.donor_id,
    donation_date: recordData.donation_date,
    receiver_user_id: recordData.receiver_user_id,
    emergency_alert_id: recordData.emergency_alert_id,
    blood_group: recordData.blood_group,
    bags_donated: recordData.bags_donated,
    donation_place: recordData.donation_place,
    emergency_serial_number: recordData.emergency_serial_number,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(donationRecord);
  donationRecord._id = result.insertedId;

  return donationRecord;
}

export async function getDonationRecordsByUser(userId: ObjectId): Promise<DonationRecord[]> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<DonationRecord>(COLLECTION_NAME);

  return await collection
    .find({ donor_id: userId })
    .sort({ donation_date: -1 })
    .toArray();
}

export async function getDonationRecordCount(userId: ObjectId): Promise<number> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<DonationRecord>(COLLECTION_NAME);

  return await collection.countDocuments({ donor_id: userId });
}

export async function getLastDonationDate(userId: ObjectId): Promise<Date | null> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<DonationRecord>(COLLECTION_NAME);

  const lastRecord = await collection
    .findOne(
      { donor_id: userId },
      { sort: { donation_date: -1 } }
    );

  return lastRecord?.donation_date || null;
}

export async function getDonationRecordsByEmergency(emergencyId: ObjectId): Promise<DonationRecord[]> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<DonationRecord>(COLLECTION_NAME);

  return await collection
    .find({ emergency_alert_id: emergencyId })
    .sort({ donation_date: -1 })
    .toArray();
}

export async function updateUserLastDonationDate(userId: ObjectId, donationDate: Date): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const usersCollection = db.collection('users');

  const result = await usersCollection.updateOne(
    { _id: userId },
    { 
      $set: { 
        last_donation_date: donationDate,
        updated_at: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
}
