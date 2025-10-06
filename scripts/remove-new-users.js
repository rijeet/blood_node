#!/usr/bin/env node

/**
 * Remove the 70 new users (21-90) that were just created
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'blood_node';
const COLLECTION_NAME = 'users';

async function removeNewUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all users to see what we have
    const allUsers = await collection.find(
      {},
      { projection: { user_code: 1, location_geohash: 1, created_at: 1 } }
    ).sort({ created_at: 1 }).toArray();
    
    console.log(`\n📊 Found ${allUsers.length} total users in database`);
    
    // Find users created recently (the 70 new ones)
    const recentUsers = allUsers.filter(user => {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      return diffMinutes < 10; // Created within last 10 minutes
    });
    
    console.log(`\n🗑️  Found ${recentUsers.length} recently created users to remove`);
    
    if (recentUsers.length > 0) {
      const userIds = recentUsers.map(user => user._id);
      
      console.log('\n📋 Users to be removed:');
      recentUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.user_code} → ${user.location_geohash}`);
      });
      
      // Remove the recent users
      const result = await collection.deleteMany({
        _id: { $in: userIds }
      });
      
      console.log(`\n✅ Removed ${result.deletedCount} users`);
      
      // Show remaining users
      const remainingUsers = await collection.find(
        {},
        { projection: { user_code: 1, location_geohash: 1 } }
      ).limit(20).toArray();
      
      console.log(`\n📊 Remaining users: ${remainingUsers.length}`);
      remainingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.user_code} → ${user.location_geohash}`);
      });
    } else {
      console.log('❌ No recent users found to remove');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the removal
removeNewUsers().catch(console.error);
