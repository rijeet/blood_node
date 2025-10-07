import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { SupportTicket, SupportMessage, CreateTicketInput, ReplyToTicketInput, SupportTicketWithMessages, SupportTicketSummary } from '@/lib/models/support-ticket';

const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'blood_node';

/**
 * Get support tickets collection
 */
export async function getSupportTicketsCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<SupportTicket>('support_tickets');
}

/**
 * Get support messages collection
 */
export async function getSupportMessagesCollection() {
  const client = await clientPromise;
  if (!client) {
    throw new Error('Database connection failed');
  }
  return client.db(DB_NAME).collection<SupportMessage>('support_messages');
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(
  userId: ObjectId,
  ticketData: CreateTicketInput
): Promise<SupportTicket> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  const now = new Date();
  
  // Create the ticket
  const ticket: SupportTicket = {
    user_id: userId,
    subject: ticketData.subject,
    status: 'open',
    priority: ticketData.priority || 'medium',
    created_at: now,
    updated_at: now,
    last_message_at: now,
    last_message_by: 'user'
  };
  
  const ticketResult = await ticketsCollection.insertOne(ticket);
  const ticketId = ticketResult.insertedId;
  
  // Create the initial message
  const message: SupportMessage = {
    ticket_id: ticketId,
    sender_id: userId,
    sender_type: 'user',
    message: ticketData.message,
    created_at: now,
    is_read: false
  };
  
  await messagesCollection.insertOne(message);
  
  return { ...ticket, _id: ticketId };
}

/**
 * Get tickets for a specific user
 */
export async function getUserSupportTickets(userId: ObjectId): Promise<SupportTicketSummary[]> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  const tickets = await ticketsCollection
    .find({ user_id: userId })
    .sort({ updated_at: -1 })
    .toArray();
  
  // Get message counts for each ticket
  const ticketSummaries = await Promise.all(
    tickets.map(async (ticket) => {
      const messageCount = await messagesCollection.countDocuments({
        ticket_id: ticket._id!
      });
      
      return {
        _id: ticket._id!,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        last_message_at: ticket.last_message_at,
        last_message_by: ticket.last_message_by,
        message_count: messageCount
      };
    })
  );
  
  return ticketSummaries;
}

/**
 * Get a specific ticket with all messages
 */
export async function getSupportTicketWithMessages(
  ticketId: ObjectId,
  userId?: ObjectId
): Promise<SupportTicketWithMessages | null> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  // Build query - include userId check for user access
  const query: any = { _id: ticketId };
  if (userId) {
    query.user_id = userId;
  }
  
  const ticket = await ticketsCollection.findOne(query);
  if (!ticket) {
    return null;
  }
  
  // Get all messages for this ticket
  const messages = await messagesCollection
    .find({ ticket_id: ticketId })
    .sort({ created_at: 1 })
    .toArray();
  
  return {
    ...ticket,
    messages
  };
}

/**
 * Reply to a support ticket
 */
export async function replyToSupportTicket(
  ticketId: ObjectId,
  senderId: ObjectId,
  senderType: 'user' | 'admin',
  replyData: ReplyToTicketInput
): Promise<SupportMessage> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  const now = new Date();
  
  // Create the message
  const message: SupportMessage = {
    ticket_id: ticketId,
    sender_id: senderId,
    sender_type: senderType,
    message: replyData.message,
    created_at: now,
    is_read: false
  };
  
  const messageResult = await messagesCollection.insertOne(message);
  
  // Update ticket status and timestamps
  const updateData: any = {
    updated_at: now,
    last_message_at: now,
    last_message_by: senderType
  };
  
  if (senderType === 'admin') {
    updateData.status = 'replied';
    updateData.admin_id = senderId;
  } else {
    updateData.status = 'open';
  }
  
  await ticketsCollection.updateOne(
    { _id: ticketId },
    { $set: updateData }
  );
  
  return { ...message, _id: messageResult.insertedId };
}

/**
 * Close a support ticket
 */
export async function closeSupportTicket(
  ticketId: ObjectId,
  adminId: ObjectId
): Promise<void> {
  const ticketsCollection = await getSupportTicketsCollection();
  
  await ticketsCollection.updateOne(
    { _id: ticketId },
    {
      $set: {
        status: 'closed',
        updated_at: new Date(),
        admin_id: adminId
      }
    }
  );
}

/**
 * Get all support tickets (admin only)
 */
export async function getAllSupportTickets(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{ tickets: SupportTicketSummary[]; total: number }> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  // Build query
  const query: any = {};
  if (status) {
    query.status = status;
  }
  
  // Get total count
  const total = await ticketsCollection.countDocuments(query);
  
  // Get paginated tickets
  const tickets = await ticketsCollection
    .find(query)
    .sort({ updated_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  
  // Get message counts and user info
  const ticketSummaries = await Promise.all(
    tickets.map(async (ticket) => {
      const messageCount = await messagesCollection.countDocuments({
        ticket_id: ticket._id!
      });
      
      return {
        _id: ticket._id!,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        last_message_at: ticket.last_message_at,
        last_message_by: ticket.last_message_by,
        message_count: messageCount
      };
    })
  );
  
  return { tickets: ticketSummaries, total };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  ticketId: ObjectId,
  userId: ObjectId
): Promise<void> {
  const messagesCollection = await getSupportMessagesCollection();
  
  await messagesCollection.updateMany(
    {
      ticket_id: ticketId,
      sender_id: { $ne: userId },
      is_read: false
    },
    {
      $set: { is_read: true }
    }
  );
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: ObjectId): Promise<number> {
  const ticketsCollection = await getSupportTicketsCollection();
  const messagesCollection = await getSupportMessagesCollection();
  
  // Get user's tickets
  const userTickets = await ticketsCollection
    .find({ user_id: userId })
    .project({ _id: 1 })
    .toArray();
  
  if (userTickets.length === 0) {
    return 0;
  }
  
  const ticketIds = userTickets.map(ticket => ticket._id!);
  
  // Count unread messages (messages not sent by the user)
  const unreadCount = await messagesCollection.countDocuments({
    ticket_id: { $in: ticketIds },
    sender_id: { $ne: userId },
    is_read: false
  });
  
  return unreadCount;
}
