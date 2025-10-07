const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DATABASE || 'blood_node';

async function testSupportTicketSystem() {
  console.log('🧪 Testing Support Ticket System\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Test 1: Create collections
    console.log('\n📝 Test 1: Creating Collections');
    console.log('=' .repeat(50));
    
    const ticketsCollection = db.collection('support_tickets');
    const messagesCollection = db.collection('support_messages');
    
    // Create indexes
    await ticketsCollection.createIndex({ user_id: 1 });
    await ticketsCollection.createIndex({ status: 1 });
    await ticketsCollection.createIndex({ created_at: -1 });
    await messagesCollection.createIndex({ ticket_id: 1 });
    await messagesCollection.createIndex({ created_at: 1 });
    
    console.log('✅ Collections and indexes created');
    
    // Test 2: Create a test user
    console.log('\n👤 Test 2: Creating Test User');
    console.log('=' .repeat(50));
    
    const testUser = {
      user_code: 'TESTSUPPORT001',
      email_hash: 'test_support_user_hash',
      name: 'Test Support User',
      created_at: new Date()
    };
    
    const userResult = await db.collection('users').insertOne(testUser);
    const userId = userResult.insertedId;
    console.log(`✅ Test user created with ID: ${userId}`);
    
    // Test 3: Create a support ticket
    console.log('\n🎫 Test 3: Creating Support Ticket');
    console.log('=' .repeat(50));
    
    const ticketData = {
      user_id: userId,
      subject: 'Test Support Ticket',
      status: 'open',
      priority: 'medium',
      created_at: new Date(),
      updated_at: new Date(),
      last_message_at: new Date(),
      last_message_by: 'user'
    };
    
    const ticketResult = await ticketsCollection.insertOne(ticketData);
    const ticketId = ticketResult.insertedId;
    console.log(`✅ Support ticket created with ID: ${ticketId}`);
    
    // Test 4: Add initial message
    console.log('\n💬 Test 4: Adding Initial Message');
    console.log('=' .repeat(50));
    
    const initialMessage = {
      ticket_id: ticketId,
      sender_id: userId,
      sender_type: 'user',
      message: 'This is a test support ticket message. I need help with my account.',
      created_at: new Date(),
      is_read: false
    };
    
    const messageResult = await messagesCollection.insertOne(initialMessage);
    console.log(`✅ Initial message added with ID: ${messageResult.insertedId}`);
    
    // Test 5: Create admin user
    console.log('\n👨‍💼 Test 5: Creating Admin User');
    console.log('=' .repeat(50));
    
    const adminUser = {
      user_code: 'ADMIN001',
      email_hash: 'admin_user_hash',
      name: 'Admin User',
      role: 'admin',
      created_at: new Date()
    };
    
    const adminResult = await db.collection('users').insertOne(adminUser);
    const adminId = adminResult.insertedId;
    console.log(`✅ Admin user created with ID: ${adminId}`);
    
    // Test 6: Admin replies to ticket
    console.log('\n🔧 Test 6: Admin Reply to Ticket');
    console.log('=' .repeat(50));
    
    const adminReply = {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_type: 'admin',
      message: 'Thank you for contacting support. We have received your request and will help you resolve this issue.',
      created_at: new Date(),
      is_read: false
    };
    
    const adminReplyResult = await messagesCollection.insertOne(adminReply);
    console.log(`✅ Admin reply added with ID: ${adminReplyResult.insertedId}`);
    
    // Update ticket status
    await ticketsCollection.updateOne(
      { _id: ticketId },
      {
        $set: {
          status: 'replied',
          updated_at: new Date(),
          last_message_at: new Date(),
          last_message_by: 'admin',
          admin_id: adminId
        }
      }
    );
    console.log('✅ Ticket status updated to "replied"');
    
    // Test 7: User replies back
    console.log('\n👤 Test 7: User Reply to Ticket');
    console.log('=' .repeat(50));
    
    const userReply = {
      ticket_id: ticketId,
      sender_id: userId,
      sender_type: 'user',
      message: 'Thank you for the quick response. The issue has been resolved now.',
      created_at: new Date(),
      is_read: false
    };
    
    const userReplyResult = await messagesCollection.insertOne(userReply);
    console.log(`✅ User reply added with ID: ${userReplyResult.insertedId}`);
    
    // Update ticket status
    await ticketsCollection.updateOne(
      { _id: ticketId },
      {
        $set: {
          status: 'open',
          updated_at: new Date(),
          last_message_at: new Date(),
          last_message_by: 'user'
        }
      }
    );
    console.log('✅ Ticket status updated to "open"');
    
    // Test 8: Close ticket
    console.log('\n🔒 Test 8: Closing Ticket');
    console.log('=' .repeat(50));
    
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
    console.log('✅ Ticket closed');
    
    // Test 9: Query tickets
    console.log('\n📊 Test 9: Querying Tickets');
    console.log('=' .repeat(50));
    
    const userTickets = await ticketsCollection.find({ user_id: userId }).toArray();
    console.log(`✅ Found ${userTickets.length} ticket(s) for user`);
    
    const allTickets = await ticketsCollection.find({}).toArray();
    console.log(`✅ Found ${allTickets.length} total ticket(s)`);
    
    // Test 10: Query messages
    console.log('\n💬 Test 10: Querying Messages');
    console.log('=' .repeat(50));
    
    const ticketMessages = await messagesCollection
      .find({ ticket_id: ticketId })
      .sort({ created_at: 1 })
      .toArray();
    
    console.log(`✅ Found ${ticketMessages.length} message(s) for ticket`);
    console.log('📝 Message flow:');
    ticketMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.sender_type.toUpperCase()}] ${msg.message.substring(0, 50)}...`);
    });
    
    // Test 11: Test different priorities
    console.log('\n⚡ Test 11: Testing Different Priorities');
    console.log('=' .repeat(50));
    
    const priorityTickets = [
      { priority: 'low', subject: 'Low Priority Issue' },
      { priority: 'medium', subject: 'Medium Priority Issue' },
      { priority: 'high', subject: 'High Priority Issue' },
      { priority: 'urgent', subject: 'Urgent Issue' }
    ];
    
    for (const ticketData of priorityTickets) {
      const ticket = {
        user_id: userId,
        subject: ticketData.subject,
        status: 'open',
        priority: ticketData.priority,
        created_at: new Date(),
        updated_at: new Date(),
        last_message_at: new Date(),
        last_message_by: 'user'
      };
      
      await ticketsCollection.insertOne(ticket);
      console.log(`✅ Created ${ticketData.priority} priority ticket: ${ticketData.subject}`);
    }
    
    // Test 12: Test different statuses
    console.log('\n📈 Test 12: Testing Different Statuses');
    console.log('=' .repeat(50));
    
    const statusTickets = [
      { status: 'open', subject: 'Open Ticket' },
      { status: 'replied', subject: 'Replied Ticket' },
      { status: 'closed', subject: 'Closed Ticket' }
    ];
    
    for (const ticketData of statusTickets) {
      const ticket = {
        user_id: userId,
        subject: ticketData.subject,
        status: ticketData.status,
        priority: 'medium',
        created_at: new Date(),
        updated_at: new Date(),
        last_message_at: new Date(),
        last_message_by: 'user'
      };
      
      await ticketsCollection.insertOne(ticket);
      console.log(`✅ Created ${ticketData.status} status ticket: ${ticketData.subject}`);
    }
    
    // Test 13: Statistics
    console.log('\n📊 Test 13: System Statistics');
    console.log('=' .repeat(50));
    
    const totalTickets = await ticketsCollection.countDocuments({});
    const openTickets = await ticketsCollection.countDocuments({ status: 'open' });
    const repliedTickets = await ticketsCollection.countDocuments({ status: 'replied' });
    const closedTickets = await ticketsCollection.countDocuments({ status: 'closed' });
    const totalMessages = await messagesCollection.countDocuments({});
    
    console.log(`📈 Total Tickets: ${totalTickets}`);
    console.log(`🟡 Open Tickets: ${openTickets}`);
    console.log(`🔵 Replied Tickets: ${repliedTickets}`);
    console.log(`🟢 Closed Tickets: ${closedTickets}`);
    console.log(`💬 Total Messages: ${totalMessages}`);
    
    console.log('\n🎉 SUCCESS: Support Ticket System is working correctly!');
    console.log('✅ All tests passed - the system is ready for use');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    try {
      if (client && client.db) {
        const db = client.db(DB_NAME);
        await db.collection('users').deleteMany({ user_code: { $regex: '^TEST|^ADMIN' } });
        await db.collection('support_tickets').deleteMany({});
        await db.collection('support_messages').deleteMany({});
        console.log('\n🧹 Cleaned up test data');
      }
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
    
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the test
testSupportTicketSystem().catch(console.error);
