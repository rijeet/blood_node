#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const ngeohash = require('ngeohash');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

function encodeGeohash(lat, lng, precision = 5) {
  return ngeohash.encode(lat, lng, precision);
}

async function updateGeohashes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DATABASE);
    const users = db.collection('users');
    
    // Find users with coordinate-style geohashes
    const usersToUpdate = await users.find({
      location_geohash: { $regex: /^\d+\.\d+,\d+\.\d+$/ }
    }).toArray();
    
    console.log(`Found ${usersToUpdate.length} users with coordinate-style geohashes`);
    
    let updated = 0;
    for (const user of usersToUpdate) {
      try {
        const [lat, lng] = user.location_geohash.split(',').map(coord => parseFloat(coord.trim()));
        const geohash = encodeGeohash(lat, lng, 5);
        
        await users.updateOne(
          { _id: user._id },
          { $set: { location_geohash: geohash } }
        );
        
        console.log(`Updated ${user.name || user.user_code}: ${user.location_geohash} -> ${geohash}`);
        updated++;
      } catch (error) {
        console.error(`Error updating user ${user.user_code}:`, error.message);
      }
    }
    
    console.log(`\n✅ Updated ${updated} users with proper geohashes`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateGeohashes();
