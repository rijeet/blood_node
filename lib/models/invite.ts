import { ObjectId } from 'mongodb';

export interface Invite {
  _id?: ObjectId;
  invite_token: string; // opaque token
  inviter_user_code: string;
  inviter_public_key: string; // copy for convenience
  invitee_email_hash: string; // HMAC of invitee email
  relation: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
  accepted_at: Date | null;
}

export interface InviteCreateInput {
  invite_token?: string; // optional, will be generated if not provided
  inviter_user_code: string;
  inviter_public_key: string;
  invitee_email_hash: string;
  relation: string;
}

export interface InviteAcceptInput {
  encrypted_blob?: any; // if creating new relative record
  dek_wrapped_for_inviter: {
    recipient_user_code: string;
    wrapped: string;
    meta: Record<string, any>;
  };
}
