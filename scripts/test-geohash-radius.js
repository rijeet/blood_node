#!/usr/bin/env node

const ngeohash = require('ngeohash');

function getGeohashesInRadius(centerLat, centerLng, radiusKm, precision = 5) {
  const center = ngeohash.encode(centerLat, centerLng, precision);
  const neighbors = [center];
  
  // Get all neighbors of the center geohash
  const neighborHashes = ngeohash.neighbors(center);
  neighbors.push(...neighborHashes);
  
  // For larger radius, we need to check more levels of neighbors
  if (radiusKm > 10) {
    const extendedNeighbors = [];
    
    // Level 2: neighbors of neighbors
    for (const neighbor of neighborHashes) {
      try {
        const neighborOfNeighbor = ngeohash.neighbors(neighbor);
        extendedNeighbors.push(...neighborOfNeighbor);
      } catch (error) {
        continue;
      }
    }
    neighbors.push(...extendedNeighbors);
    
    // For 20km+ radius, add level 3 neighbors
    if (radiusKm >= 20) {
      const level3Neighbors = [];
      for (const neighbor of extendedNeighbors) {
        try {
          const neighborOfNeighborOfNeighbor = ngeohash.neighbors(neighbor);
          level3Neighbors.push(...neighborOfNeighborOfNeighbor);
        } catch (error) {
          continue;
        }
      }
      neighbors.push(...level3Neighbors);
    }
  }
  
  return [...new Set(neighbors)]; // Remove duplicates
}

const searchLat = 23.82;
const searchLng = 90.36;
const geohashes = getGeohashesInRadius(searchLat, searchLng, 20, 5);

console.log('Search geohashes for 20km radius:');
console.log('Total geohashes:', geohashes.length);
console.log('Geohashes:', geohashes);

// Check if our test geohashes are included
const testGeohashes = ['wh224', 'wh0nz', 'wh0qb'];
testGeohashes.forEach(gh => {
  console.log(`${gh}: ${geohashes.includes(gh) ? 'FOUND' : 'NOT FOUND'}`);
});
