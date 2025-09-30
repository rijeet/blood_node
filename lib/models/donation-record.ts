import { ObjectId } from 'mongodb';

export interface DonationRecord {
  _id?: ObjectId;
  donor_id: ObjectId; // Reference to the donor
  donation_date: Date; // When the donation was made
  receiver_user_id?: ObjectId; // Optional - if donating to specific person
  emergency_alert_id?: ObjectId; // Optional - if responding to emergency
  blood_group: string; // Blood group donated
  bags_donated: number; // Number of bags donated
  donation_place?: string; // Where the donation was made
  emergency_serial_number?: string; // Serial number of emergency if applicable
  created_at: Date;
  updated_at: Date;
}

export interface DonationRecordCreateInput {
  donor_id: ObjectId;
  donation_date: Date;
  receiver_user_id?: ObjectId;
  emergency_alert_id?: ObjectId;
  blood_group: string;
  bags_donated: number;
  donation_place?: string;
  emergency_serial_number?: string;
}

export interface DonationRecordResponse {
  success: boolean;
  record_id?: string;
  error?: string;
}
