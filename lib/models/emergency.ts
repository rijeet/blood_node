import { ObjectId } from 'mongodb';

export interface EmergencyAlert {
  _id?: ObjectId;
  user_id: ObjectId; // Reference to the user who created the alert
  blood_type: string; // Required blood type (A+, B-, etc.)
  location_geohash: string; // 5-character geohash for location
  location_lat: number; // Latitude for precise location
  location_lng: number; // Longitude for precise location
  location_address?: string; // Human-readable address
  radius_km: number; // Search radius in kilometers
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Patient condition details
  patient_condition?: string; // Operation, Thalassemia, Accident, etc.
  required_bags: number; // Number of blood bags needed
  hemoglobin_level?: string; // Patient's hemoglobin level
  
  // Donation details
  donation_place?: string; // Hospital or blood bank name
  donation_date?: string; // When donation is needed
  donation_time?: string; // What time donation is needed
  contact_info?: string; // Contact phone/email
  reference?: string; // Doctor/case reference
  
  // Alert status
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  donors_notified: number; // Number of donors who received the alert
  donors_responded: number; // Number of donors who responded
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  expires_at: Date; // When the alert expires (e.g., 24 hours)
}

export interface EmergencyAlertCreateInput {
  blood_type: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  radius_km: number;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  patient_condition?: string;
  required_bags: number;
  hemoglobin_level?: string;
  donation_place?: string;
  donation_date?: string;
  donation_time?: string;
  contact_info?: string;
  reference?: string;
}

export interface EmergencyAlertResponse {
  success: boolean;
  alert_id?: string;
  donors_notified?: number;
  error?: string;
}
