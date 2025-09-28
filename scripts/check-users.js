#!/usr/bin/env node

/**
 * Check current users in database
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'blood_node';

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DATABASE);
    console.log(`📊 Connected to database: ${MONGODB_DATABASE}`);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\n📊 Database Statistics:');
    console.log(`  📈 Total users: ${users.length}`);
    console.log(`  ✅ Verified users: ${users.filter(u => u.email_verified).length}`);
    console.log(`  🌐 Public profile users: ${users.filter(u => u.public_profile).length}`);
    console.log(`  🔐 Users with crypto data: ${users.filter(u => u.public_key && u.encrypted_private_key).length}`);
    
    // Show all users
    console.log('\n👥 All Users in Database:');
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name || 'No name'} (${user.user_code}) - Verified: ${user.email_verified} - Public: ${user.public_profile}`);
    });
    
    // Check for our test users specifically
    console.log('\n🔍 Checking for test users:');
    const testUserHashes = [
      '7cc488a6a1603a1c8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b', // user1@example.com
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'  // user2@example.com
    ];
    
    for (const hash of testUserHashes) {
      const user = await db.collection('users').findOne({ email_hash: hash });
      if (user) {
        console.log(`  ✅ Found user with hash ${hash.substring(0, 16)}...`);
      } else {
        console.log(`  ❌ User with hash ${hash.substring(0, 16)}... not found`);
      }
    }
    
    // Check collection info
    console.log('\n📋 Collection Info:');
    const collections = await db.listCollections().toArray();
    console.log(`  Collections: ${collections.map(c => c.name).join(', ')}`);
    
    return users;
    
  } catch (error) {
    console.error('💥 Error checking users:', error);
    return [];
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
if (require.main === module) {
  checkUsers()
    .then((users) => {
      console.log(`\n✅ Check completed. Found ${users.length} users.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkUsers };
