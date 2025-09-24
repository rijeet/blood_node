import { ObjectId } from 'mongodb';

export interface EncryptedBlob {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
  kdf_salt?: string; // optional base64 if per-record KDF used
}

export interface DekWrapped {
  recipient_user_code: string;
  wrapped: string; // base64
  meta: Record<string, unknown>;
}

export interface TimeAvailability {
  from: string; // "09:00"
  to: string; // "18:00"
  tz: string; // "Asia/Dhaka"
}

export interface Relative {
  _id?: ObjectId;
  owner_user_code: string;
  relative_user_code?: string; // undefined if relative not yet registered
  relation: string; // "uncle", "aunt", "cousin", etc.
  visibility: 'private' | 'shared' | 'public';
  encrypted_blob: EncryptedBlob;
  dek_wrapped: DekWrapped[]; // list of DEK wrapped entries to recipients
  last_donation_date?: Date;
  time_availability?: TimeAvailability;
  created_at: Date;
}

export interface RelativeDecrypted {
  name: string;
  email?: string;
  phone?: string;
  exact_location?: {
    lat: number;
    lng: number;
    address: string;
  };
  medical_notes?: string;
  emergency_contact?: string;
  blood_group?: string; // private blood group (different from public)
  fields_shared?: string[]; // which fields are shared with others
}

export interface RelativeCreateInput {
  relative_user_code?: string;
  relation: string;
  visibility: 'private' | 'shared' | 'public';
  encrypted_blob: EncryptedBlob;
  dek_wrapped: DekWrapped[];
  last_donation_date?: Date;
  time_availability?: TimeAvailability;
}
