#!/usr/bin/env node

const ngeohash = require('ngeohash');

// Test the geohash search logic
const searchLat = 23.82;
const searchLng = 90.36;
const searchGeohash = ngeohash.encode(searchLat, searchLng, 5);

console.log(`Search coordinates: ${searchLat}, ${searchLng}`);
console.log(`Search geohash: ${searchGeohash}`);

// Get neighbors for 20km radius
const neighbors = ngeohash.neighbors(searchGeohash);
console.log(`\nNeighbors of search geohash:`);
neighbors.forEach((neighbor, index) => {
  console.log(`  ${index + 1}. ${neighbor}`);
});

// Test specific user coordinates
const testCoords = [
  { name: "Ariful Islam", coords: "23.9208000,90.4604000" },
  { name: "Arif Hossain", coords: "23.7023000,90.3511500" },
  { name: "Nusrat Jahan", coords: "23.7046000,90.3523000" }
];

console.log(`\nTesting specific users:`);
testCoords.forEach(user => {
  const [lat, lng] = user.coords.split(',').map(c => parseFloat(c.trim()));
  const geohash = ngeohash.encode(lat, lng, 5);
  const isInNeighbors = neighbors.includes(geohash);
  console.log(`${user.name}: ${user.coords} -> ${geohash} (in neighbors: ${isInNeighbors})`);
});

// Test distance calculation
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

console.log(`\nDistance calculations:`);
testCoords.forEach(user => {
  const [lat, lng] = user.coords.split(',').map(c => parseFloat(c.trim()));
  const distance = calculateDistance(searchLat, searchLng, lat, lng);
  console.log(`${user.name}: ${distance.toFixed(2)} km from search point`);
});
