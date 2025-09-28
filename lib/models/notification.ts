import { ObjectId } from 'mongodb';

export interface Notification {
  _id?: ObjectId;
  user_id: ObjectId; // User who receives the notification
  type: 'emergency_alert' | 'donor_response' | 'family_invite' | 'donation_reminder' | 'system';
  title: string;
  message: string;
  
  // Emergency alert specific fields
  emergency_alert_id?: ObjectId; // Reference to emergency alert
  blood_type?: string;
  location_geohash?: string;
  location_address?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  distance_km?: number; // Distance from user's location
  
  // Notification status
  read: boolean;
  read_at?: Date;
  
  // Action data
  action_url?: string; // URL to navigate when notification is clicked
  action_button_text?: string; // Text for action button
  
  // Timestamps
  created_at: Date;
  expires_at?: Date; // When notification expires (optional)
}

export interface NotificationCreateInput {
  user_id: ObjectId;
  type: Notification['type'];
  title: string;
  message: string;
  emergency_alert_id?: ObjectId;
  blood_type?: string;
  location_geohash?: string;
  location_address?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  distance_km?: number;
  action_url?: string;
  action_button_text?: string;
  expires_at?: Date;
}

export interface NotificationResponse {
  success: boolean;
  notifications?: Notification[];
  unread_count?: number;
  error?: string;
}
