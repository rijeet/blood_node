#!/usr/bin/env node

const ngeohash = require('ngeohash');

// Test coordinates from tempuser2.json
const testCoords = [
  "23.9208000,90.4604000", // This should be the one you mentioned
  "23.7023000,90.3511500", // Dhanmondi
  "23.7046000,90.3523000", // Gulshan
];

console.log("Testing geohash conversion:");
console.log("==========================");

testCoords.forEach((coord, index) => {
  const [lat, lng] = coord.split(',').map(c => parseFloat(c.trim()));
  const geohash = ngeohash.encode(lat, lng, 5);
  console.log(`${index + 1}. ${coord} -> ${geohash}`);
});

// Test search coordinates
const searchLat = 23.82;
const searchLng = 90.36;
const searchGeohash = ngeohash.encode(searchLat, searchLng, 5);
console.log(`\nSearch coordinates: ${searchLat}, ${searchLng} -> ${searchGeohash}`);

// Test if they're in the same geohash area
const testLat = 23.9208000;
const testLng = 90.4604000;
const testGeohash = ngeohash.encode(testLat, testLng, 5);
console.log(`Test coordinates: ${testLat}, ${testLng} -> ${testGeohash}`);

// Check neighbors
const neighbors = ngeohash.neighbors(searchGeohash);
console.log(`\nNeighbors of search geohash (${searchGeohash}):`);
neighbors.forEach((neighbor, index) => {
  console.log(`  ${index + 1}. ${neighbor}`);
});

console.log(`\nIs test geohash in neighbors? ${neighbors.includes(testGeohash)}`);
