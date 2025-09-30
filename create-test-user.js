const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

function hashEmail(email) {
  const secret = process.env.EMAIL_HASH_SECRET || 'default-email-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex');
}

async function createTestUser() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('blood_node');
    
    const email = 'newtest@example.com';
    const emailHash = hashEmail(email);
    
    console.log('Creating user with:');
    console.log('Email:', email);
    console.log('Email Hash:', emailHash);
    
    const user = {
      _id: new ObjectId(),
      email_hash: emailHash,
      name: 'New Test User',
      user_code: 'TEST1234',
      public_key: 'test-public-key',
      encrypted_private_key: 'test-encrypted-private-key',
      master_salt: 'test-master-salt',
      sss_server_share: 'test-sss-server-share',
      password_hash: 'test-password-hash',
      location_address: 'Test Location',
      blood_group_public: 'O+',
      last_donation_date: new Date(),
      public_profile: true,
      availability: true,
      recovery_email_sent: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    console.log('User created with ID:', result.insertedId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestUser();
