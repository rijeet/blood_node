import { ObjectId } from 'mongodb';

export interface Plan {
  _id?: ObjectId;
  plan_id: 'free' | 'paid_block' | 'unlimited';
  relatives_free: number;
  price_id: string; // Stripe price ID
  description: string;
}

export interface RefreshToken {
  _id?: ObjectId;
  token_hash: string; // sha256 hash
  user_id: ObjectId;
  device_id: string; // UUID
  fingerprint_hash: string; // sha256 hash
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}
