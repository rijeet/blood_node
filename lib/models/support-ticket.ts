import { ObjectId } from 'mongodb';

export interface SupportTicket {
  _id?: ObjectId;
  user_id: ObjectId;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
  last_message_by: 'user' | 'admin';
  admin_id?: ObjectId; // Admin who last replied
}

export interface SupportMessage {
  _id?: ObjectId;
  ticket_id: ObjectId;
  sender_id: ObjectId;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: Date;
  is_read: boolean;
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ReplyToTicketInput {
  message: string;
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
  user_name?: string;
  admin_name?: string;
}

export interface SupportTicketSummary {
  _id: ObjectId;
  subject: string;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
  last_message_by: string;
  message_count: number;
  user_name?: string;
  admin_name?: string;
}
