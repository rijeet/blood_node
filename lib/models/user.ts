import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  user_code: string; // 16-char public identifier
  email_hash: string; // HMAC_SHA256(email, server_secret)
  email_verified: boolean;
  public_profile: boolean;
  blood_group_public?: string; // "A+", "B-", etc. or undefined if private
  location_geohash?: string; // precision 5 geohash (plaintext)
  location_address?: string; // human-readable address
  name?: string; // user's display name
  phone?: string; // user's phone number
  last_donation_date?: Date; // last blood donation date for availability calculation
  plan: 'free' | 'paid_block' | 'unlimited';
  plan_expires?: Date;
  public_key: string; // base64 JWK format
  encrypted_private_key: string; // AES-GCM ciphertext of privateKeyJWK
  master_salt: string; // KDF salt used to derive KEK
  sss_server_share: string; // server SSS share
  recovery_shares?: string[]; // recovery shares for account recovery
  recovery_token?: string; // temporary token for password reset
  recovery_token_expires?: Date; // expiry time for recovery token
  reset_token?: string; // temporary token for password reset via email
  reset_token_expires?: Date; // expiry time for reset token
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
  location_address?: string;
  blood_group_public?: string;
  name?: string;
  phone?: string;
  last_donation_date?: Date;
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

/**
 * Calculate if user is available for donation based on last donation date
 * Availability is true if (today - last_donation_date) >= 121 days
 */
export function calculateAvailability(lastDonationDate?: Date): {
  isAvailable: boolean;
  daysSinceLastDonation: number | null;
  daysUntilAvailable: number | null;
} {
  if (!lastDonationDate) {
    return {
      isAvailable: true,
      daysSinceLastDonation: null,
      daysUntilAvailable: null
    };
  }

  const today = new Date();
  const timeDiff = today.getTime() - lastDonationDate.getTime();
  const daysSinceLastDonation = Math.floor(timeDiff / (1000 * 3600 * 24));
  const isAvailable = daysSinceLastDonation >= 121;
  const daysUntilAvailable = isAvailable ? 0 : 121 - daysSinceLastDonation;

  return {
    isAvailable,
    daysSinceLastDonation,
    daysUntilAvailable
  };
}

/**
 * Get availability status with human-readable message
 */
export function getAvailabilityStatus(lastDonationDate?: Date): {
  status: 'available' | 'unavailable' | 'never_donated';
  message: string;
  daysSinceLastDonation: number | null;
  daysUntilAvailable: number | null;
} {
  const availability = calculateAvailability(lastDonationDate);

  if (!lastDonationDate) {
    return {
      status: 'never_donated',
      message: 'Never donated - available for donation',
      daysSinceLastDonation: null,
      daysUntilAvailable: null
    };
  }

  if (availability.isAvailable) {
    return {
      status: 'available',
      message: `Available for donation (${availability.daysSinceLastDonation} days since last donation)`,
      daysSinceLastDonation: availability.daysSinceLastDonation,
      daysUntilAvailable: 0
    };
  } else {
    return {
      status: 'unavailable',
      message: `Not available for ${availability.daysUntilAvailable} more days`,
      daysSinceLastDonation: availability.daysSinceLastDonation,
      daysUntilAvailable: availability.daysUntilAvailable
    };
  }
}
