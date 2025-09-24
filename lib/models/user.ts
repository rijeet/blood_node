import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  user_code: string; // 16-char public identifier
  email_hash: string; // HMAC_SHA256(email, server_secret)
  email_verified: boolean;
  public_profile: boolean;
  blood_group_public?: string; // "A+", "B-", etc. or undefined if private
  location_geohash?: string; // precision 5 geohash (plaintext)
  plan: 'free' | 'paid_block' | 'unlimited';
  plan_expires?: Date;
  public_key: string; // base64 JWK format
  encrypted_private_key: string; // AES-GCM ciphertext of privateKeyJWK
  master_salt: string; // KDF salt used to derive KEK
  sss_server_share: string; // server SSS share
  recovery_email_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email_hash: string;
  public_key: string;
  encrypted_private_key: string;
  master_salt: string;
  sss_server_share: string;
  user_code: string;
  location_geohash?: string;
  blood_group_public?: string;
}

export interface UserAuthData {
  user_id: string;
  user_code: string;
  email_hash: string;
  public_key: string;
  encrypted_private_key: string;
  master_salt: string;
  plan: string;
}
