#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

async function checkGeohashes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DATABASE);
    const users = db.collection('users');
    
    // Find users with geohashes
    const usersWithGeohash = await users.find({
      location_geohash: { $exists: true, $ne: null },
      blood_group_public: { $exists: true, $ne: null }
    }).limit(10).toArray();
    
    console.log(`Found ${usersWithGeohash.length} users with geohashes:`);
    console.log('=====================================');
    
    usersWithGeohash.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.user_code})`);
      console.log(`   Blood Group: ${user.blood_group_public}`);
      console.log(`   Geohash: ${user.location_geohash}`);
      console.log(`   Address: ${user.location_address || 'No address'}`);
      console.log(`   Public Profile: ${user.public_profile}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkGeohashes();
