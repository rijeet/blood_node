#!/usr/bin/env node

/**
 * Calculate distance between two geohashes: wh2836h and wh0r248
 */

const ngeohash = require('ngeohash');

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to decode geohash to coordinates
function decodeGeohash(geohash) {
  return ngeohash.decode(geohash);
}

// Function to get geohash precision info
function getGeohashInfo(geohash) {
  const decoded = decodeGeohash(geohash);
  const precision = geohash.length;
  let precisionKm;
  
  switch(precision) {
    case 3: precisionKm = 78; break;
    case 4: precisionKm = 20; break;
    case 5: precisionKm = 2.4; break;
    case 6: precisionKm = 0.6; break;
    case 7: precisionKm = 0.15; break;
    default: precisionKm = 'unknown';
  }
  
  return {
    geohash,
    precision,
    precisionKm,
    lat: decoded.latitude,
    lng: decoded.longitude
  };
}

// Main calculation
const geohash1 = 'wh2836h';
const geohash2 = 'wh0r248';

console.log('🗺️ Geohash Distance Calculator\n');

// Decode both geohashes
const coord1 = decodeGeohash(geohash1);
const coord2 = decodeGeohash(geohash2);

// Get geohash information
const info1 = getGeohashInfo(geohash1);
const info2 = getGeohashInfo(geohash2);

console.log('📍 Geohash 1:', geohash1);
console.log('   Coordinates:', coord1.latitude.toFixed(6), coord1.longitude.toFixed(6));
console.log('   Precision:', info1.precision, 'characters (~' + info1.precisionKm + 'km)');

console.log('\n📍 Geohash 2:', geohash2);
console.log('   Coordinates:', coord2.latitude.toFixed(6), coord2.longitude.toFixed(6));
console.log('   Precision:', info2.precision, 'characters (~' + info2.precisionKm + 'km)');

// Calculate distance
const distance = calculateDistance(
  coord1.latitude, 
  coord1.longitude, 
  coord2.latitude, 
  coord2.longitude
);

console.log('\n📏 Distance Calculation:');
console.log('   Distance:', distance.toFixed(2), 'kilometers');
console.log('   Distance:', (distance * 0.621371).toFixed(2), 'miles');

// Check if they are neighbors
const neighbors1 = ngeohash.neighbors(geohash1);
const isNeighbor = neighbors1.includes(geohash2);

console.log('\n🔍 Neighbor Analysis:');
console.log('   Are they neighbors?', isNeighbor ? '✅ Yes' : '❌ No');

if (!isNeighbor) {
  // Calculate how many geohash cells apart
  const latDiff = Math.abs(coord1.latitude - coord2.latitude);
  const lngDiff = Math.abs(coord1.longitude - coord2.longitude);
  
  console.log('   Latitude difference:', latDiff.toFixed(6), 'degrees');
  console.log('   Longitude difference:', lngDiff.toFixed(6), 'degrees');
  
  // Estimate geohash cells apart
  const estimatedCells = Math.ceil(distance / info1.precisionKm);
  console.log('   Estimated geohash cells apart:', estimatedCells);
}

console.log('\n🎯 Summary:');
console.log(`   ${geohash1} and ${geohash2} are ${distance.toFixed(2)} km apart`);
console.log(`   This is ${distance < 1 ? 'very close' : distance < 5 ? 'close' : distance < 20 ? 'moderate' : 'far'} distance`);

// Additional analysis for Blood Node context
console.log('\n🩸 Blood Node Emergency Alert Analysis:');
if (distance <= 20) {
  console.log('   ✅ Within 20km emergency alert radius');
  console.log('   ✅ Both locations would be included in emergency alerts');
} else {
  console.log('   ❌ Outside 20km emergency alert radius');
  console.log('   ❌ Would require separate emergency alerts');
}

// Check if they're in the same city/region
const sameRegion = Math.abs(coord1.latitude - coord2.latitude) < 0.1 && 
                   Math.abs(coord1.longitude - coord2.longitude) < 0.1;

console.log(`   ${sameRegion ? '✅' : '❌'} Same geographic region: ${sameRegion ? 'Yes' : 'No'}`);
