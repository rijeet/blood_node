#!/usr/bin/env node

/**
 * Update location_geohash for users with emails user1@example.com to user10@example.com
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

async function updateUserLocations() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get server secret from environment or use default
    const serverSecret = process.env.SERVER_SECRET || 'your-server-secret-key';
    
    // Generate email hashes for user1@example.com to user10@example.com
    const emails = [];
    const emailHashes = [];
    
    for (let i = 1; i <= 10; i++) {
      const email = `user${i}@example.com`;
      const emailHash = hashEmail(email, serverSecret);
      emails.push(email);
      emailHashes.push(emailHash);
    }
    
    console.log('\n📧 Emails to update:');
    emails.forEach((email, index) => {
      console.log(`   ${email} → ${emailHashes[index]}`);
    });
    
    // Update location_geohash for these users
    const newGeohash = 'wh0re5r';
    
    console.log(`\n📍 Updating location_geohash to: ${newGeohash}`);
    
    const result = await collection.updateMany(
      { 
        email_hash: { $in: emailHashes } 
      },
      { 
        $set: { 
          location_geohash: newGeohash,
          updated_at: new Date()
        } 
      }
    );
    
    console.log('\n📊 Update Results:');
    console.log(`   Matched documents: ${result.matchedCount}`);
    console.log(`   Modified documents: ${result.modifiedCount}`);
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Successfully updated user locations!');
      
      // Verify the updates
      console.log('\n🔍 Verifying updates...');
      const updatedUsers = await collection.find(
        { email_hash: { $in: emailHashes } },
        { projection: { user_code: 1, email_hash: 1, location_geohash: 1, updated_at: 1 } }
      ).toArray();
      
      console.log('\n📋 Updated Users:');
      updatedUsers.forEach(user => {
        const emailIndex = emailHashes.indexOf(user.email_hash);
        const email = emailIndex !== -1 ? emails[emailIndex] : 'unknown';
        console.log(`   ${user.user_code} (${email}) → ${user.location_geohash}`);
      });
    } else {
      console.log('\n⚠️ No users were updated. Check if the email hashes match.');
    }
    
  } catch (error) {
    console.error('❌ Error updating user locations:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateUserLocations().catch(console.error);
