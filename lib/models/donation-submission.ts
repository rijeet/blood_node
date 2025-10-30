import { ObjectId } from 'mongodb';

export type DonationMethod = 'bkash' | 'rocket' | 'nagad' | 'bank' | 'paypal';

export interface DonationSubmission {
  _id?: ObjectId;
  user_id?: ObjectId; // optional if logged in
  date: Date;
  amount: number;
  currency: 'BDT' | 'USD';
  method: DonationMethod;
  trx_id?: string;
  agent?: string;
  contact?: string;
  notes?: string;
  created_at: Date;
}

export interface DonationSubmissionCreateInput {
  user_id?: ObjectId;
  date: Date;
  amount: number;
  currency: 'BDT' | 'USD';
  method: DonationMethod;
  trx_id?: string;
  agent?: string;
  contact?: string;
  notes?: string;
}


