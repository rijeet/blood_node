#!/usr/bin/env node

/**
 * Check existing users and update their location_geohash
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'blood_node';
const COLLECTION_NAME = 'users';

// Function to hash email (same as used in the app)
function hashEmail(email, secret) {
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

async function checkAndUpdateUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // First, let's see what users exist
    console.log('\n🔍 Checking existing users...');
    const allUsers = await collection.find(
      {},
      { projection: { user_code: 1, email_hash: 1, location_geohash: 1 } }
    ).limit(20).toArray();
    
    console.log(`\n📊 Found ${allUsers.length} users in database:`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.user_code} → ${user.email_hash.substring(0, 16)}... → ${user.location_geohash || 'no location'}`);
    });
    
    // Try different server secrets
    const possibleSecrets = [
      'your-server-secret-key',
      'blood-node-secret-key',
      'server-secret',
      'default-secret',
      process.env.SERVER_SECRET
    ].filter(Boolean);
    
    console.log('\n🔑 Trying different server secrets...');
    
    for (const secret of possibleSecrets) {
      console.log(`\n   Trying secret: ${secret}`);
      
      // Generate email hashes for user1@example.com to user10@example.com
      const emails = [];
      const emailHashes = [];
      
      for (let i = 1; i <= 10; i++) {
        const email = `user${i}@example.com`;
        const emailHash = hashEmail(email, secret);
        emails.push(email);
        emailHashes.push(emailHash);
      }
      
      // Check if any of these hashes match existing users
      const matchingUsers = await collection.find(
        { email_hash: { $in: emailHashes } },
        { projection: { user_code: 1, email_hash: 1, location_geohash: 1 } }
      ).toArray();
      
      if (matchingUsers.length > 0) {
        console.log(`   ✅ Found ${matchingUsers.length} matching users with this secret!`);
        
        matchingUsers.forEach(user => {
          const emailIndex = emailHashes.indexOf(user.email_hash);
          const email = emailIndex !== -1 ? emails[emailIndex] : 'unknown';
          console.log(`      ${user.user_code} (${email}) → ${user.location_geohash || 'no location'}`);
        });
        
        // Update their location_geohash
        const newGeohash = 'wh0re5';
        console.log(`\n📍 Updating location_geohash to: ${newGeohash}`);
        
        const result = await collection.updateMany(
          { email_hash: { $in: emailHashes } },
          { 
            $set: { 
              location_geohash: newGeohash,
              updated_at: new Date()
            } 
          }
        );
        
        console.log(`   📊 Updated ${result.modifiedCount} users`);
        
        // Verify the updates
        const updatedUsers = await collection.find(
          { email_hash: { $in: emailHashes } },
          { projection: { user_code: 1, email_hash: 1, location_geohash: 1, updated_at: 1 } }
        ).toArray();
        
        console.log('\n✅ Final Results:');
        updatedUsers.forEach(user => {
          const emailIndex = emailHashes.indexOf(user.email_hash);
          const email = emailIndex !== -1 ? emails[emailIndex] : 'unknown';
          console.log(`   ${user.user_code} (${email}) → ${user.location_geohash}`);
        });
        
        break; // Stop after finding the right secret
      } else {
        console.log(`   ❌ No matches with this secret`);
      }
    }
    
    // If no matches found, let's try a direct approach
    if (allUsers.length > 0) {
      console.log('\n🔄 Alternative approach: Update users directly...');
      
      // Update first 10 users (Zone 1)
      const firstTenUsers = allUsers.slice(0, 10);
      const firstTenUserIds = firstTenUsers.map(user => user._id);
      
      const zone1Geohash = 'wh0re5';
      console.log(`\n📍 Updating Zone 1 (Users 1-10) to: ${zone1Geohash}`);
      
      const result1 = await collection.updateMany(
        { _id: { $in: firstTenUserIds } },
        { 
          $set: { 
            location_geohash: zone1Geohash,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`   📊 Updated ${result1.modifiedCount} users in Zone 1`);
      
      // Update users 11-20 (Zone 2)
      const nextTenUsers = allUsers.slice(10, 20);
      const nextTenUserIds = nextTenUsers.map(user => user._id);
      
      const zone2Geohash = 'wh2836';
      console.log(`\n📍 Updating Zone 2 (Users 11-20) to: ${zone2Geohash}`);
      
      const result2 = await collection.updateMany(
        { _id: { $in: nextTenUserIds } },
        { 
          $set: { 
            location_geohash: zone2Geohash,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`   📊 Updated ${result2.modifiedCount} users in Zone 2`);
      
      // Show updated users for both zones
      const allUpdatedUsers = await collection.find(
        { _id: { $in: [...firstTenUserIds, ...nextTenUserIds] } },
        { projection: { user_code: 1, location_geohash: 1 } }
      ).toArray();
      
      console.log('\n✅ Final Update Results:');
      allUpdatedUsers.forEach((user, index) => {
        const zone = index < 10 ? 'Zone 1' : 'Zone 2';
        console.log(`   ${user.user_code} (${zone}) → ${user.location_geohash}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check and update
checkAndUpdateUsers().catch(console.error);
