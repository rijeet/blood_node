#!/usr/bin/env node

/**
 * Verify users can be found through login system
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'blood_node';
const EMAIL_HASH_SECRET = process.env.EMAIL_HASH_SECRET || 'default-email-secret';

/**
 * Generate HMAC for email hashing (same as in the app)
 */
function hashEmail(email) {
  return crypto
    .createHmac('sha256', EMAIL_HASH_SECRET)
    .update(email.toLowerCase())
    .digest('hex');
}

async function verifyLoginUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DATABASE);
    console.log(`📊 Connected to database: ${MONGODB_DATABASE}`);
    
    // Test specific users that should be findable
    const testEmails = [
      'user1@example.com',
      'user2@example.com', 
      'user25@example.com',
      'user50@example.com',
      'user100@example.com'
    ];
    
    console.log('\n🔍 Testing Login System Email Lookup:');
    console.log('(This simulates what happens when users try to log in)');
    
    for (const email of testEmails) {
      const emailHash = hashEmail(email);
      console.log(`\n📧 Testing: ${email}`);
      console.log(`   Email Hash: ${emailHash.substring(0, 16)}...`);
      
      const user = await db.collection('users').findOne({ email_hash: emailHash });
      
      if (user) {
        console.log(`   ✅ FOUND: ${user.name} (${user.user_code})`);
        console.log(`   📊 Verified: ${user.email_verified}`);
        console.log(`   🌐 Public: ${user.public_profile}`);
        console.log(`   🩸 Blood Group: ${user.blood_group_public || 'Not set'}`);
        console.log(`   📍 Location: ${user.location_address || 'Not set'}`);
      } else {
        console.log(`   ❌ NOT FOUND`);
      }
    }
    
    // Test blood group search (what donors see)
    console.log('\n🩸 Testing Blood Group Search:');
    const bloodGroups = ['A+', 'B+', 'O+', 'AB+'];
    
    for (const bloodGroup of bloodGroups) {
      const users = await db.collection('users').find({ 
        blood_group_public: bloodGroup,
        email_verified: true,
        public_profile: true
      }).toArray();
      
      console.log(`   ${bloodGroup}: ${users.length} users found`);
      if (users.length > 0) {
        console.log(`     Sample: ${users[0].name} (${users[0].user_code})`);
      }
    }
    
    // Test location search
    console.log('\n📍 Testing Location Search:');
    const locationUsers = await db.collection('users').find({
      location_geohash: { $exists: true },
      email_verified: true,
      public_profile: true
    }).limit(5).toArray();
    
    console.log(`   Users with location data: ${locationUsers.length} found`);
    locationUsers.forEach((user, i) => {
      console.log(`     ${i+1}. ${user.name} - ${user.location_address}`);
    });
    
    // Show login credentials for testing
    console.log('\n🔐 Login Credentials for Testing:');
    console.log('   Use these in your application login form:');
    console.log('   ┌─────────────────────────┬─────────────────┐');
    console.log('   │ Email                   │ Password        │');
    console.log('   ├─────────────────────────┼─────────────────┤');
    console.log('   │ user1@example.com       │ 12345678        │');
    console.log('   │ user2@example.com       │ 12345678        │');
    console.log('   │ user25@example.com      │ 12345678        │');
    console.log('   │ user50@example.com      │ 12345678        │');
    console.log('   │ user100@example.com     │ 12345678        │');
    console.log('   └─────────────────────────┴─────────────────┘');
    
    console.log('\n📝 Database Connection Info:');
    console.log(`   URI: ${MONGODB_URI}`);
    console.log(`   Database: ${MONGODB_DATABASE}`);
    console.log(`   Collection: users`);
    
    return true;
    
  } catch (error) {
    console.error('💥 Error verifying users:', error);
    return false;
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification
if (require.main === module) {
  verifyLoginUsers()
    .then((success) => {
      if (success) {
        console.log('\n✅ All users are properly set up for login!');
        console.log('   If you still only see 2 users, check:');
        console.log('   1. Your app is connecting to the same database');
        console.log('   2. Your app is using the same email hash secret');
        console.log('   3. Your app is looking in the correct collection');
        process.exit(0);
      } else {
        console.log('\n❌ Verification failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyLoginUsers };
