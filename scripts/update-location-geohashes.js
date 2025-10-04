#!/usr/bin/env node

/**
 * Script to update user location_geohash from coordinate strings to proper geohash format
 * 
 * This script will:
 * 1. Find all users with location_geohash in "lat,lng" format
 * 2. Convert them to proper geohash format using ngeohash (precision 7)
 * 3. Update the database with the new geohash values
 */

const { MongoClient } = require('mongodb');
// @ts-expect-error - ngeohash doesn't have type definitions
const ngeohash = require('ngeohash');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-BloodNodeDB:M1o5iRdHgY85g8o6@bloodnodedb.1kpzuyh.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'blood_node';
const COLLECTION_NAME = 'users';

/**
 * Parse coordinate string to lat/lng numbers
 * @param {string} coordString - String in format "lat,lng"
 * @returns {Object} - {lat: number, lng: number} or null if invalid
 */
function parseCoordinates(coordString) {
  if (!coordString || typeof coordString !== 'string') {
    return null;
  }
  
  const parts = coordString.split(',');
  if (parts.length !== 2) {
    return null;
  }
  
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  // Basic validation for valid lat/lng ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  
  return { lat, lng };
}

/**
 * Check if a string is already a geohash (not coordinates)
 * @param {string} str - String to check
 * @returns {boolean} - True if it looks like a geohash
 */
function isGeohash(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  // Geohash should only contain base32 characters (0-9, a-z, excluding i, l, o)
  const geohashPattern = /^[0-9bcdefghjkmnpqrstuvwxyz]+$/i;
  return geohashPattern.test(str) && str.length >= 4;
}

/**
 * Convert coordinates to geohash
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Geohash precision (default 7)
 * @returns {string} - Geohash string
 */
function coordinatesToGeohash(lat, lng, precision = 7) {
  return ngeohash.encode(lat, lng, precision);
}

/**
 * Main function to update location geohashes
 */
async function updateLocationGeohashes() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('📊 Finding users with coordinate-based location_geohash or low-precision geohashes...');
    
    // Find users with location_geohash that looks like coordinates (contains comma) or has geohash with length < 7
    const usersWithCoordinates = await collection.find({
      $or: [
        { location_geohash: { $regex: /^\d+\.?\d*,\d+\.?\d*$/ } }, // coordinate format
        { location_geohash: { $regex: /^[0-9bcdefghjkmnpqrstuvwxyz]{1,6}$/i } } // geohash with 1-6 characters
      ]
    }).toArray();
    
    console.log(`📋 Found ${usersWithCoordinates.length} users with coordinate-based location_geohash or low-precision geohashes`);
    
    if (usersWithCoordinates.length === 0) {
      console.log('✅ No users need updating. All location_geohash fields are already in precision 7 geohash format.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    console.log('\n🔄 Processing users...');
    
    for (const user of usersWithCoordinates) {
      try {
        const currentLocation = user.location_geohash;
        console.log(`\n👤 Processing user ${user.user_code || user._id}:`);
        console.log(`   Current location_geohash: ${currentLocation}`);
        
        let coords;
        
        // Check if it's already a geohash (but low precision)
        if (isGeohash(currentLocation) && currentLocation.length < 7) {
          console.log(`   🔄 Upgrading geohash from precision ${currentLocation.length} to 7`);
          // Decode existing geohash to get coordinates
          const decoded = ngeohash.decode(currentLocation);
          coords = { lat: decoded.latitude, lng: decoded.longitude };
          console.log(`   📍 Decoded coordinates: ${coords.lat}, ${coords.lng}`);
        } else {
          // Parse coordinates from string format
          coords = parseCoordinates(currentLocation);
          if (!coords) {
            console.log(`   ❌ Invalid coordinate format: ${currentLocation}`);
            errorCount++;
            errors.push({
              user_id: user._id,
              user_code: user.user_code,
              error: `Invalid coordinate format: ${currentLocation}`
            });
            continue;
          }
          console.log(`   📍 Parsed coordinates: ${coords.lat}, ${coords.lng}`);
        }
        
        // Convert to precision 7 geohash
        const geohash = coordinatesToGeohash(coords.lat, coords.lng, 7);
        console.log(`   🗺️  New precision 7 geohash: ${geohash}`);
        
        // Update the user
        const result = await collection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              location_geohash: geohash,
              updated_at: new Date()
            }
          }
        );
        
        if (result.modifiedCount === 1) {
          console.log(`   ✅ Updated successfully`);
          successCount++;
        } else {
          console.log(`   ❌ Update failed - no documents modified`);
          errorCount++;
          errors.push({
            user_id: user._id,
            user_code: user.user_code,
            error: 'Update failed - no documents modified'
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing user: ${error.message}`);
        errorCount++;
        errors.push({
          user_id: user._id,
          user_code: user.user_code,
          error: error.message
        });
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. User ${error.user_code || error.user_id}: ${error.error}`);
      });
    }
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const remainingLowPrecisionUsers = await collection.find({
      $or: [
        { location_geohash: { $regex: /^\d+\.?\d*,\d+\.?\d*$/ } }, // coordinate format
        { location_geohash: { $regex: /^[0-9bcdefghjkmnpqrstuvwxyz]{1,6}$/i } } // geohash with 1-6 characters
      ]
    }).toArray();
    
    console.log(`📋 Users still with coordinate format or low-precision geohashes: ${remainingLowPrecisionUsers.length}`);
    
    if (remainingLowPrecisionUsers.length === 0) {
      console.log('🎉 All users successfully updated to precision 7 geohash format!');
    } else {
      console.log('⚠️  Some users still have coordinate format or low-precision geohashes. Check the error details above.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  updateLocationGeohashes()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateLocationGeohashes, parseCoordinates, coordinatesToGeohash };
