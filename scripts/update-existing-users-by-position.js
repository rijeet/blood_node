#!/usr/bin/env node

/**
 * Update existing users by their serial number (position) with 6-character geohashes
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'blood_node';
const COLLECTION_NAME = 'users';

async function updateExistingUsersByPosition() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all users ordered by creation date (serial number)
    const allUsers = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1, created_at: 1 } }
    ).sort({ created_at: 1 }).toArray();
    
    console.log(`\n📊 Found ${allUsers.length} existing users in database`);
    
    // Define geohash zones by position
    const geohashZones = [
      { range: [1, 10], geohash: 'wh0re5', zone: 'Zone 1' },
      { range: [11, 20], geohash: 'wh2836', zone: 'Zone 2' },
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
    
    // Update users by position
    for (const zone of geohashZones) {
      console.log(`\n📍 Updating ${zone.zone} (Users ${zone.range[0]}-${zone.range[1]}) to: ${zone.geohash}`);
      
      // Get users in this range (0-based index, so subtract 1)
      const startIndex = zone.range[0] - 1;
      const endIndex = zone.range[1];
      const usersInRange = allUsers.slice(startIndex, endIndex);
      
      if (usersInRange.length === 0) {
        console.log(`   ❌ No users found in range ${zone.range[0]}-${zone.range[1]}`);
        continue;
      }
      
      console.log(`   📊 Found ${usersInRange.length} users in range`);
      
      // Show current users
      usersInRange.forEach((user, index) => {
        const position = startIndex + index + 1;
        console.log(`      ${position}. ${user.user_code} → ${user.location_geohash || 'no location'}`);
      });
      
      // Update their location_geohash
      const userIds = usersInRange.map(user => user._id);
      const result = await collection.updateMany(
        { _id: { $in: userIds } },
        { 
          $set: { 
            location_geohash: zone.geohash,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`   ✅ Updated ${result.modifiedCount} users in ${zone.zone}`);
      
      // Verify the updates
      const updatedUsers = await collection.find(
        { _id: { $in: userIds } },
        { projection: { user_code: 1, location_geohash: 1 } }
      ).toArray();
      
      console.log(`   📋 Updated users in ${zone.zone}:`);
      updatedUsers.forEach((user, index) => {
        const position = startIndex + index + 1;
        console.log(`      ${position}. ${user.user_code} → ${user.location_geohash}`);
      });
    }
    
    // Show final summary
    console.log('\n📊 Final Database Summary:');
    const finalUsers = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1 } }
    ).sort({ created_at: 1 }).limit(90).toArray();
    
    // Group by geohash
    const usersByGeohash = {};
    finalUsers.forEach((user, index) => {
      const position = index + 1;
      if (!usersByGeohash[user.location_geohash]) {
        usersByGeohash[user.location_geohash] = [];
      }
      usersByGeohash[user.location_geohash].push({ position, userCode: user.user_code });
    });
    
    console.log('\n🗺️  Users by Geohash Zone:');
    Object.entries(usersByGeohash).forEach(([geohash, users]) => {
      const positions = users.map(u => u.position).sort((a, b) => a - b);
      const userCodes = users.map(u => u.userCode).slice(0, 3);
      console.log(`   ${geohash}: ${users.length} users (Positions: ${positions.slice(0, 5).join(', ')}${positions.length > 5 ? '...' : ''})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateExistingUsersByPosition().catch(console.error);
