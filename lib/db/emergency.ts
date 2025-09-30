import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { EmergencyAlert, EmergencyAlertCreateInput } from '../models/emergency';
import { encodeGeohash } from '../geo';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'emergency_alerts';

export async function createEmergencyAlert(
  userId: ObjectId,
  alertData: EmergencyAlertCreateInput
): Promise<EmergencyAlert> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  // Convert coordinates to geohash
  const location_geohash = encodeGeohash(alertData.location_lat, alertData.location_lng, 5);

  // Generate unique serial number
  const serial_number = generateSerialNumber();

  // Set expiration time (24 hours from now)
  const expires_at = new Date();
  expires_at.setHours(expires_at.getHours() + 24);

  const emergencyAlert: EmergencyAlert = {
    user_id: userId,
    serial_number,
    blood_type: alertData.blood_type,
    location_geohash,
    location_lat: alertData.location_lat,
    location_lng: alertData.location_lng,
    location_address: alertData.location_address,
    radius_km: alertData.radius_km,
    urgency_level: alertData.urgency_level,
    patient_condition: alertData.patient_condition,
    required_bags: alertData.required_bags,
    hemoglobin_level: alertData.hemoglobin_level,
    donation_place: alertData.donation_place,
    donation_date: alertData.donation_date,
    donation_time: alertData.donation_time,
    contact_info: alertData.contact_info,
    reference: alertData.reference,
    status: 'active',
    donors_notified: 0,
    donors_responded: 0,
    created_at: new Date(),
    updated_at: new Date(),
    expires_at
  };

  const result = await collection.insertOne(emergencyAlert);
  emergencyAlert._id = result.insertedId;

  return emergencyAlert;
}

export async function getEmergencyAlertsByUser(userId: ObjectId): Promise<EmergencyAlert[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  return await collection
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
}

export async function getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  return await collection
    .find({ 
      status: 'active',
      expires_at: { $gt: new Date() }
    })
    .sort({ created_at: -1 })
    .toArray();
}

export async function getEmergencyAlertsByLocation(
  geohashes: string[],
  bloodType?: string
): Promise<EmergencyAlert[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  const query: any = {
    location_geohash: { $in: geohashes },
    status: 'active',
    expires_at: { $gt: new Date() }
  };

  if (bloodType) {
    query.blood_type = bloodType;
  }

  return await collection
    .find(query)
    .sort({ urgency_level: -1, created_at: -1 })
    .toArray();
}

export async function updateEmergencyAlertStatus(
  alertId: ObjectId,
  status: EmergencyAlert['status'],
  donorsNotified?: number,
  donorsResponded?: number,
  selectedDonorId?: ObjectId
): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  const updateData: any = {
    status,
    updated_at: new Date()
  };

  if (donorsNotified !== undefined) {
    updateData.donors_notified = donorsNotified;
  }

  if (donorsResponded !== undefined) {
    updateData.donors_responded = donorsResponded;
  }

  if (selectedDonorId !== undefined) {
    updateData.selected_donor_id = selectedDonorId;
  }

  const result = await collection.updateOne(
    { _id: alertId },
    { $set: updateData }
  );

  return result.modifiedCount > 0;
}

export async function getEmergencyAlertById(alertId: ObjectId): Promise<EmergencyAlert | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  return await collection.findOne({ _id: alertId });
}

export async function expireOldEmergencyAlerts(): Promise<number> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  const result = await collection.updateMany(
    {
      status: 'active',
      expires_at: { $lte: new Date() }
    },
    {
      $set: {
        status: 'expired',
        updated_at: new Date()
      }
    }
  );

  return result.modifiedCount;
}

// Generate unique serial number for emergency alerts
function generateSerialNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EM${timestamp}${random}`;
}

export async function getEmergencyAlertBySerialNumber(serialNumber: string): Promise<EmergencyAlert | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EmergencyAlert>(COLLECTION_NAME);

  return await collection.findOne({ serial_number: serialNumber });
}
