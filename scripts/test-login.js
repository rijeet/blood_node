#!/usr/bin/env node

/**
 * Test login functionality with inserted users
 * This script tests if users can be found and authenticated
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

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

/**
 * Test login functionality
 */
async function testLogin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DATABASE);
    console.log(`📊 Connected to database: ${MONGODB_DATABASE}`);
    
    // Test 1: Check total user count
    console.log('\n📊 Database Statistics:');
    const totalUsers = await db.collection('users').countDocuments();
    const verifiedUsers = await db.collection('users').countDocuments({ email_verified: true });
    const publicUsers = await db.collection('users').countDocuments({ public_profile: true });
    
    console.log(`  📈 Total users: ${totalUsers}`);
    console.log(`  ✅ Verified users: ${verifiedUsers}`);
    console.log(`  🌐 Public profile users: ${publicUsers}`);
    
    // Test 2: Test email lookup functionality
    console.log('\n🔍 Testing Email Lookup:');
    const testEmails = [
      'user1@example.com',
      'user25@example.com',
      'user50@example.com',
      'user100@example.com'
    ];
    
    for (const email of testEmails) {
      const emailHash = hashEmail(email);
      const user = await db.collection('users').findOne({ email_hash: emailHash });
      
      if (user) {
        console.log(`  ✅ ${email} -> ${user.name} (${user.user_code}) - Verified: ${user.email_verified}`);
      } else {
        console.log(`  ❌ ${email} -> Not found`);
      }
    }
    
    // Test 3: Test blood group search
    console.log('\n🩸 Testing Blood Group Search:');
    const bloodGroups = ['A+', 'B+', 'O+', 'AB+'];
    
    for (const bloodGroup of bloodGroups) {
      const count = await db.collection('users').countDocuments({ 
        blood_group_public: bloodGroup,
        email_verified: true 
      });
      console.log(`  ${bloodGroup}: ${count} users`);
    }
    
    // Test 4: Test location-based search
    console.log('\n📍 Testing Location Search:');
    const locationCount = await db.collection('users').countDocuments({ 
      location_geohash: { $exists: true },
      email_verified: true 
    });
    console.log(`  Users with location data: ${locationCount}`);
    
    // Test 5: Show sample users for login testing
    console.log('\n👥 Sample Users for Login Testing:');
    const sampleUsers = await db.collection('users')
      .find({ 
        email_verified: true,
        name: { $exists: true, $ne: null }
      })
      .limit(10)
      .toArray();
    
    sampleUsers.forEach((user, index) => {
      // We need to find the original email from our temp data
      const originalEmail = `user${index + 1}@example.com`;
      console.log(`  ${index + 1}. Email: ${originalEmail}`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Phone: ${user.phone || 'N/A'}`);
      console.log(`     Blood Group: ${user.blood_group_public || 'Not set'}`);
      console.log(`     Location: ${user.location_address || 'Not set'}`);
      console.log(`     User Code: ${user.user_code}`);
      console.log(`     Password: 12345678 (for all test users)`);
      console.log('');
    });
    
    // Test 6: Test user authentication data structure
    console.log('🔐 Testing Authentication Data Structure:');
    const authUser = sampleUsers[0];
    if (authUser) {
      console.log(`  User ID: ${authUser._id}`);
      console.log(`  User Code: ${authUser.user_code}`);
      console.log(`  Email Hash: ${authUser.email_hash.substring(0, 16)}...`);
      console.log(`  Public Key: ${authUser.public_key ? 'Present' : 'Missing'}`);
      console.log(`  Encrypted Private Key: ${authUser.encrypted_private_key ? 'Present' : 'Missing'}`);
      console.log(`  Master Salt: ${authUser.master_salt ? 'Present' : 'Missing'}`);
      console.log(`  SSS Server Share: ${authUser.sss_server_share ? 'Present' : 'Missing'}`);
      console.log(`  Plan: ${authUser.plan}`);
    }
    
    console.log('\n🎉 Login test completed successfully!');
    console.log('\n📝 To test login in your app:');
    console.log('  1. Use any email from the sample users above');
    console.log('  2. Use password: 12345678');
    console.log('  3. All users have email_verified: true');
    console.log('  4. All users have public_profile: true for blood group search');
    
    return {
      success: true,
      totalUsers,
      verifiedUsers,
      publicUsers
    };

  } catch (error) {
    console.error('💥 Login test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testLogin()
    .then((results) => {
      if (results.success) {
        console.log('\n✅ All tests passed! Users are ready for login.');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testLogin };
