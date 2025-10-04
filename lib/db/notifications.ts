import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Notification, NotificationCreateInput } from '../models/notification';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';
const COLLECTION_NAME = 'notifications';

export async function createNotification(
  notificationData: NotificationCreateInput
): Promise<Notification> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const notification: Notification = {
    user_id: notificationData.user_id,
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    emergency_alert_id: notificationData.emergency_alert_id,
    blood_type: notificationData.blood_type,
    location_geohash: notificationData.location_geohash,
    location_address: notificationData.location_address,
    urgency_level: notificationData.urgency_level,
    distance_km: notificationData.distance_km,
    action_url: notificationData.action_url,
    action_button_text: notificationData.action_button_text,
    read: false,
    created_at: new Date(),
    expires_at: notificationData.expires_at
  };

  const result = await collection.insertOne(notification);
  notification._id = result.insertedId;

  return notification;
}

export async function getUserNotifications(
  userId: ObjectId,
  limit: number = 20,
  includeRead: boolean = true
): Promise<Notification[]> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const query: any = {
    user_id: userId,
    $or: [
      { expires_at: { $exists: false } },
      { expires_at: { $gt: new Date() } }
    ]
  };

  if (!includeRead) {
    query.read = false;
  }

  return await collection
    .find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
}

export async function getUnreadNotificationCount(userId: ObjectId): Promise<number> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  return await collection.countDocuments({
    user_id: userId,
    read: false,
    $or: [
      { expires_at: { $exists: false } },
      { expires_at: { $gt: new Date() } }
    ]
  });
}

export async function markNotificationAsRead(notificationId: ObjectId): Promise<boolean> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const result = await collection.updateOne(
    { _id: notificationId },
    {
      $set: {
        read: true,
        read_at: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
}

export async function markAllNotificationsAsRead(userId: ObjectId): Promise<number> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const result = await collection.updateMany(
    {
      user_id: userId,
      read: false
    },
    {
      $set: {
        read: true,
        read_at: new Date()
      }
    }
  );

  return result.modifiedCount;
}

export async function deleteNotification(notificationId: ObjectId): Promise<boolean> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const result = await collection.deleteOne({ _id: notificationId });
  return result.deletedCount > 0;
}

export async function getEmergencyNotificationsByLocation(
  userLocationGeohash: string,
  userBloodType: string,
  radiusKm: number = 50
): Promise<Notification[]> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  // Find emergency notifications within radius
  // For now, we'll use a simple geohash prefix match
  // In a real implementation, you'd want more sophisticated geohash neighbor matching
  const geohashPrefix = userLocationGeohash.substring(0, 3); // First 3 characters for ~50km radius

  return await collection
    .find({
      type: 'emergency_alert',
      location_geohash: { $regex: `^${geohashPrefix}` },
      blood_type: userBloodType,
      read: false,
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gt: new Date() } }
      ]
    })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();
}

export async function createEmergencyNotificationsForUsers(
  emergencyAlertId: ObjectId,
  bloodType: string,
  locationGeohash: string,
  locationAddress: string,
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
  targetUserIds: ObjectId[]
): Promise<number> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const urgencyEmojis = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨'
  };

  const urgencyText = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    critical: 'CRITICAL'
  };

  const notifications = targetUserIds.map(userId => ({
    user_id: userId,
    type: 'emergency_alert' as const,
    title: `${urgencyEmojis[urgencyLevel]} Emergency Blood Alert`,
    message: `${urgencyText[urgencyLevel]} - ${bloodType} blood needed near ${locationAddress}`,
    emergency_alert_id: emergencyAlertId,
    blood_type: bloodType,
    location_geohash: locationGeohash,
    location_address: locationAddress,
    urgency_level: urgencyLevel,
    action_url: `/emergency/respond/${emergencyAlertId}`,
    action_button_text: 'Respond to Alert',
    read: false,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }));

  if (notifications.length === 0) return 0;

  const result = await collection.insertMany(notifications);
  return result.insertedCount;
}

export async function cleanupExpiredNotifications(): Promise<number> {
  const client = await clientPromise;
  if (!client) {
    throw new Error('MongoDB client is not available');
  }
  const db = client.db(DB_NAME);
  const collection = db.collection<Notification>(COLLECTION_NAME);

  const result = await collection.deleteMany({
    expires_at: { $lte: new Date() }
  });

  return result.deletedCount;
}
