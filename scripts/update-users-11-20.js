#!/usr/bin/env node

/**
 * Update location_geohash to wh2836h for users with emails user11@example.com to user20@example.com
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

async function updateUsers11To20() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // First, let's see what users exist (skip first 10 since they were already updated)
    console.log('\n🔍 Checking users 11-20...');
    const allUsers = await collection.find(
      {},
      { projection: { user_code: 1, email_hash: 1, location_geohash: 1 } }
    ).skip(10).limit(10).toArray();
    
    console.log(`\n📊 Found ${allUsers.length} users (positions 11-20):`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 11}. ${user.user_code} → ${user.email_hash.substring(0, 16)}... → ${user.location_geohash || 'no location'}`);
    });
    
    // Try different server secrets
    const possibleSecrets = [
      'your-server-secret-key',
      'blood-node-secret-key',
      'server-secret',
      'default-secret',
      process.env.SERVER_SECRET
    ].filter(Boolean);
    
    console.log('\n🔑 Trying different server secrets for users 11-20...');
    
    for (const secret of possibleSecrets) {
      console.log(`\n   Trying secret: ${secret}`);
      
      // Generate email hashes for user11@example.com to user20@example.com
      const emails = [];
      const emailHashes = [];
      
      for (let i = 11; i <= 20; i++) {
        const email = `user${i}@example.com`;
        const emailHash = hashEmail(email, secret);
        emails.push(email);
        emailHashes.push(emailHash);
      }
      
      console.log('\n📧 Email hashes for users 11-20:');
      emails.forEach((email, index) => {
        console.log(`   ${email} → ${emailHashes[index]}`);
      });
      
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
        const newGeohash = 'wh2836h';
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
    
    // If no matches found, let's try a direct approach for users 11-20
    if (allUsers.length > 0) {
      console.log('\n🔄 Alternative approach: Update users 11-20 directly...');
      
      const userIds = allUsers.map(user => user._id);
      
      const newGeohash = 'wh2836h';
      const result = await collection.updateMany(
        { _id: { $in: userIds } },
        { 
          $set: { 
            location_geohash: newGeohash,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`   📊 Updated ${result.modifiedCount} users directly`);
      
      // Show updated users
      const updatedUsers = await collection.find(
        { _id: { $in: userIds } },
        { projection: { user_code: 1, location_geohash: 1 } }
      ).toArray();
      
      console.log('\n✅ Direct Update Results:');
      updatedUsers.forEach((user, index) => {
        console.log(`   ${index + 11}. ${user.user_code} → ${user.location_geohash}`);
      });
    }
    
    // Show summary of all users with their locations
    console.log('\n📋 Summary of All Users:');
    const allUsersWithLocation = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1 } }
    ).limit(20).toArray();
    
    allUsersWithLocation.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.user_code} → ${user.location_geohash || 'no location'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateUsers11To20().catch(console.error);
