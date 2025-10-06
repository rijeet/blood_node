#!/usr/bin/env node

/**
 * Create users 21-90 with specific 6-character geohashes
 */

const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'blood_node';
const COLLECTION_NAME = 'users';

// Function to hash email (same as used in the app)
function hashEmail(email, secret) {
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

// Function to generate user code
function generateUserCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createUsers21To90() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Define geohash zones for users 21-90
    const geohashZones = [
      { range: [21, 30], geohash: 'wh0r8k', zone: 'Zone 3' },
      { range: [31, 40], geohash: 'wh0qcx', zone: 'Zone 4' },
      { range: [41, 50], geohash: 'wh0r0n', zone: 'Zone 5' },
      { range: [51, 60], geohash: 'wh0r3g', zone: 'Zone 6' },
      { range: [61, 70], geohash: 'wh0r0e', zone: 'Zone 7' },
      { range: [71, 80], geohash: 'w5cr1d', zone: 'Zone 8' },
      { range: [81, 90], geohash: 'turcrb', zone: 'Zone 9' }
    ];
    
    console.log('\n📋 Geohash Zones Configuration:');
    geohashZones.forEach(zone => {
      console.log(`   Users ${zone.range[0]}-${zone.range[1]}: ${zone.geohash} (${zone.zone})`);
    });
    
    // Check existing users first
    const existingUsers = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1 } }
    ).limit(100).toArray();
    
    console.log(`\n📊 Found ${existingUsers.length} existing users in database`);
    
    // Create users for each zone
    const usersToCreate = [];
    const secret = 'your-server-secret-key'; // Default secret
    
    for (const zone of geohashZones) {
      console.log(`\n🏗️  Creating users ${zone.range[0]}-${zone.range[1]} for ${zone.zone}...`);
      
      for (let i = zone.range[0]; i <= zone.range[1]; i++) {
        const email = `user${i}@example.com`;
        const emailHash = hashEmail(email, secret);
        const userCode = generateUserCode();
        
        const user = {
          _id: new ObjectId(),
          user_code: userCode,
          email_hash: emailHash,
          first_name: `User${i}`,
          last_name: 'Test',
          blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)],
          phone: `+8801${Math.floor(Math.random() * 90000000) + 10000000}`,
          location_address: `Test Location ${i}, Dhaka, Bangladesh`,
          location_geohash: zone.geohash,
          location_lat: 0, // Will be calculated from geohash
          location_lng: 0, // Will be calculated from geohash
          public_profile: true,
          is_available: true,
          last_donation_date: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        usersToCreate.push(user);
        console.log(`   ${i}. ${userCode} → ${email} → ${zone.geohash}`);
      }
    }
    
    console.log(`\n📝 Total users to create: ${usersToCreate.length}`);
    
    // Insert users into database
    if (usersToCreate.length > 0) {
      console.log('\n💾 Inserting users into database...');
      const result = await collection.insertMany(usersToCreate);
      console.log(`✅ Successfully created ${result.insertedCount} users`);
      
      // Verify the creation
      console.log('\n🔍 Verifying created users...');
      const createdUsers = await collection.find(
        { _id: { $in: usersToCreate.map(u => u._id) } },
        { projection: { user_code: 1, location_geohash: 1 } }
      ).toArray();
      
      console.log('\n📋 Created Users Summary:');
      createdUsers.forEach((user, index) => {
        const userNumber = index + 21;
        const zone = geohashZones.find(z => userNumber >= z.range[0] && userNumber <= z.range[1]);
        console.log(`   ${userNumber}. ${user.user_code} → ${user.location_geohash} (${zone?.zone || 'Unknown'})`);
      });
    }
    
    // Show final summary of all users
    console.log('\n📊 Final Database Summary:');
    const allUsers = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1 } }
    ).limit(100).toArray();
    
    // Group by geohash
    const usersByGeohash = {};
    allUsers.forEach(user => {
      if (!usersByGeohash[user.location_geohash]) {
        usersByGeohash[user.location_geohash] = [];
      }
      usersByGeohash[user.location_geohash].push(user.user_code);
    });
    
    console.log('\n🗺️  Users by Geohash Zone:');
    Object.entries(usersByGeohash).forEach(([geohash, userCodes]) => {
      console.log(`   ${geohash}: ${userCodes.length} users (${userCodes.slice(0, 3).join(', ')}${userCodes.length > 3 ? '...' : ''})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the creation
createUsers21To90().catch(console.error);
