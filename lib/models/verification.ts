import { ObjectId } from 'mongodb';

export interface VerificationToken {
  _id?: ObjectId;
  email_hash: string;
  token: string;
  token_type: 'email_verification' | 'email_verification_code' | 'password_recovery' | 'password_recovery_code' | 'family_invite';
  expires_at: Date;
  used: boolean;
  
  // For email verification
  user_id?: ObjectId;
  
  // For email verification code
  verification_code_data?: {
    user_id: ObjectId;
    code: string;
  };
  
  // For password recovery
  recovery_data?: {
    user_id: ObjectId;
    old_password_hash?: string; // Optional: to prevent token reuse
  };
  
  // For password recovery code
  recovery_code_data?: {
    user_id: ObjectId;
    code: string;
  };
  
  // For family invites
  invite_data?: {
    inviter_user_id: ObjectId;
    inviter_name: string;
    relation: string;
    permissions: string[];
  };
  
  created_at: Date;
  used_at?: Date;
}

export interface VerificationTokenCreateInput {
  email_hash: string;
  token: string;
  token_type: 'email_verification' | 'email_verification_code' | 'password_recovery' | 'password_recovery_code' | 'family_invite';
  expires_at: Date;
  user_id?: ObjectId;
  verification_code_data?: {
    user_id: ObjectId;
    code: string;
  };
  recovery_data?: {
    user_id: ObjectId;
    old_password_hash?: string;
  };
  recovery_code_data?: {
    user_id: ObjectId;
    code: string;
  };
  invite_data?: {
    inviter_user_id: ObjectId;
    inviter_name: string;
    relation: string;
    permissions: string[];
  };
}

export interface TokenValidationResult {
  valid: boolean;
  token?: VerificationToken;
  error?: string;
}
