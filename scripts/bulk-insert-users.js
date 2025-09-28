#!/usr/bin/env node

/**
 * Bulk insert temporary users with email verification set to true
 * This script reads from tempuser2.json and creates users in the database
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;
const EMAIL_HASH_SECRET = process.env.EMAIL_HASH_SECRET || 'default-email-secret';

// Import geohash function directly
const ngeohash = require('ngeohash');

function encodeGeohash(lat, lng, precision = 5) {
  return ngeohash.encode(lat, lng, precision);
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!MONGODB_DATABASE) {
  console.error('❌ MONGODB_DATABASE environment variable is required');
  process.exit(1);
}

// Load user data from tempuser2.json
const userDataPath = path.join(__dirname, '..', '..', 'tempuser2.json');
if (!fs.existsSync(userDataPath)) {
  console.error('❌ tempuser2.json file not found');
  process.exit(1);
}

const tempUsers = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

/**
 * Generate a random 16-character user code
 */
function generateUserCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const values = crypto.randomBytes(16);
  
  for (let i = 0; i < 16; i++) {
    result += chars[values[i] % chars.length];
  }
  
  return result;
}

/**
 * Generate HMAC for email hashing
 */
function hashEmail(email) {
  return crypto
    .createHmac('sha256', EMAIL_HASH_SECRET)
    .update(email.toLowerCase())
    .digest('hex');
}

/**
 * Generate random salt
 */
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate mock ECDH keypair (for development)
 */
function generateMockKeyPair() {
  // Generate mock public key JWK
  const publicKeyJWK = {
    kty: 'EC',
    crv: 'P-256',
    x: crypto.randomBytes(32).toString('base64url'),
    y: crypto.randomBytes(32).toString('base64url')
  };

  // Generate mock private key JWK
  const privateKeyJWK = {
    kty: 'EC',
    crv: 'P-256',
    x: crypto.randomBytes(32).toString('base64url'),
    y: crypto.randomBytes(32).toString('base64url'),
    d: crypto.randomBytes(32).toString('base64url')
  };

  return { publicKeyJWK, privateKeyJWK };
}

/**
 * Generate mock encrypted private key
 */
function generateMockEncryptedPrivateKey() {
  // Mock AES-GCM encrypted private key
  const mockData = {
    iv: crypto.randomBytes(12).toString('base64'),
    ciphertext: crypto.randomBytes(64).toString('base64'),
    tag: crypto.randomBytes(16).toString('base64')
  };
  
  return JSON.stringify(mockData);
}

/**
 * Generate mock SSS server share
 */
function generateMockSSSShare() {
  // Mock SSS share data
  const shareData = {
    index: 1,
    secret: crypto.randomBytes(32).toString('base64'),
    threshold: 2,
    shares: 3
  };
  
  return Buffer.from(JSON.stringify(shareData)).toString('base64');
}

/**
 * Process user data and create database-ready user objects
 */
function processUsers(users) {
  return users.map(user => {
    const { publicKeyJWK, privateKeyJWK } = generateMockKeyPair();
    
    return {
      user_code: generateUserCode(),
      email_hash: hashEmail(user.email),
      email_verified: true, // Set to true as requested
      public_profile: user.public_profile || false,
      blood_group_public: user.blood_group_public || null,
      location_geohash: user.location_geohash ? 
        (() => {
          // Convert coordinates to geohash if it's in "lat,lng" format
          if (typeof user.location_geohash === 'string' && user.location_geohash.includes(',')) {
            const [lat, lng] = user.location_geohash.split(',').map(coord => parseFloat(coord.trim()));
            const geohash = encodeGeohash(lat, lng, 5); // 5-character precision geohash
            console.log(`Converting ${user.location_geohash} -> ${geohash}`);
            return geohash;
          }
          return user.location_geohash;
        })() : null,
      location_address: user.location_address || null,
      name: user.name || null,
      phone: user.phone || null,
      last_donation_date: user.last_donation_date ? new Date(user.last_donation_date) : null,
      plan: 'free',
      plan_expires: null,
      public_key: JSON.stringify(publicKeyJWK),
      encrypted_private_key: generateMockEncryptedPrivateKey(),
      master_salt: generateSalt(),
      sss_server_share: generateMockSSSShare(),
      recovery_email_sent: false,
      created_at: new Date(),
      updated_at: new Date()
    };
  });
}

/**
 * Bulk insert users into database
 */
async function bulkInsertUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DATABASE);
    console.log(`📊 Connected to database: ${MONGODB_DATABASE}`);
    
    // Process user data
    console.log(`\n📝 Processing ${tempUsers.length} users...`);
    const processedUsers = processUsers(tempUsers);
    
    // Insert users in batches
    const batchSize = 50;
    let insertedCount = 0;
    let errorCount = 0;
    
    console.log(`\n💾 Inserting users in batches of ${batchSize}...`);
    
    for (let i = 0; i < processedUsers.length; i += batchSize) {
      const batch = processedUsers.slice(i, i + batchSize);
      
      try {
        const result = await db.collection('users').insertMany(batch, { ordered: false });
        insertedCount += result.insertedCount;
        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${result.insertedCount} users`);
        
        if (result.writeErrors && result.writeErrors.length > 0) {
          console.log(`  ⚠️  ${result.writeErrors.length} errors in this batch (duplicates skipped)`);
          errorCount += result.writeErrors.length;
        }
        
      } catch (error) {
        console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        errorCount += batch.length;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Bulk Insert Summary:');
    console.log(`  ✅ Successfully inserted: ${insertedCount} users`);
    console.log(`  ❌ Errors: ${errorCount} users`);
    console.log(`  📈 Success rate: ${((insertedCount / tempUsers.length) * 100).toFixed(1)}%`);
    
    // Verify some users can be found
    console.log('\n🔍 Verifying insertion...');
    const sampleUsers = await db.collection('users')
      .find({ email_verified: true })
      .limit(5)
      .toArray();
    
    console.log(`  ✅ Found ${sampleUsers.length} verified users in database`);
    
    if (sampleUsers.length > 0) {
      console.log('\n📋 Sample user data:');
      sampleUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.user_code}) - ${user.blood_group_public || 'No blood group'}`);
      });
    }
    
    return {
      success: errorCount === 0,
      inserted: insertedCount,
      errors: errorCount,
      total: tempUsers.length
    };

  } catch (error) {
    console.error('💥 Bulk insert failed:', error);
    return { success: false, inserted: 0, errors: tempUsers.length, total: tempUsers.length };
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the bulk insert
if (require.main === module) {
  bulkInsertUsers()
    .then((results) => {
      if (results.success) {
        console.log('\n🎉 All users inserted successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some users failed to insert, but operation completed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { bulkInsertUsers, processUsers };
