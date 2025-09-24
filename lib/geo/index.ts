// Geolocation utilities for Blood Node

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Encode coordinates to geohash (simplified implementation)
 * In production, use the ngeohash library
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 5): string {
  // This is a simplified mock implementation
  // In production, use: import * as ngeohash from 'ngeohash';
  // return ngeohash.encode(lat, lng, precision);
  
  // Mock implementation for development
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  
  // Simplified encoding (NOT ACCURATE - for demo only)
  const latRange = [-90, 90];
  const lngRange = [-180, 180];
  
  for (let i = 0; i < precision; i++) {
    const latMid = (latRange[0] + latRange[1]) / 2;
    const lngMid = (lngRange[0] + lngRange[1]) / 2;
    
    let index = 0;
    
    if (lng >= lngMid) {
      index |= 1;
      lngRange[0] = lngMid;
    } else {
      lngRange[1] = lngMid;
    }
    
    if (lat >= latMid) {
      index |= 2;
      latRange[0] = latMid;
    } else {
      latRange[1] = latMid;
    }
    
    hash += base32[index + Math.floor(Math.random() * 4)]; // Add some randomness for demo
  }
  
  return hash;
}

/**
 * Decode geohash to approximate coordinates (simplified)
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } {
  // Mock implementation - in production use ngeohash.decode(geohash)
  // This is just for development/demo purposes
  
  // Return approximate center coordinates based on geohash prefix
  const prefixMap: Record<string, { lat: number; lng: number }> = {
    'dr5': { lat: 40.7829, lng: -73.9654 }, // NYC area
    'gbsu': { lat: 51.5074, lng: -0.1278 }, // London area
    '9q8y': { lat: 37.7749, lng: -122.4194 }, // SF area
    'wx4g': { lat: 39.9042, lng: 116.4074 }, // Beijing area
  };
  
  const prefix = geohash.substring(0, 4);
  return prefixMap[prefix] || { lat: 0, lng: 0 };
}

/**
 * Get geohash centroid for distance calculations
 */
export function getGeohashCentroid(geohash: string): { lat: number; lng: number } {
  return decodeGeohash(geohash);
}

/**
 * Get geohashes within a certain radius
 */
export function getGeohashesInRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  precision: number = 5
): string[] {
  // Simplified implementation
  // In production, this would calculate all geohash boxes that intersect with the radius
  
  const center = encodeGeohash(centerLat, centerLng, precision);
  const neighbors: string[] = [center];
  
  // Add some neighboring geohashes (simplified)
  // In production, use proper geohash neighbor calculation
  const variations = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c'];
  
  for (let i = 0; i < 3; i++) {
    const lastChar = center[center.length - 1];
    const baseHash = center.substring(0, center.length - 1);
    
    for (const char of variations) {
      if (char !== lastChar) {
        neighbors.push(baseHash + char);
      }
    }
  }
  
  return neighbors;
}

/**
 * Sort locations by distance from a reference point
 */
export function sortByDistance<T extends { lat: number; lng: number }>(
  referenceLocation: { lat: number; lng: number },
  locations: T[]
): T[] {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(
        referenceLocation.lat,
        referenceLocation.lng,
        location.lat,
        location.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Check if a point is within a certain radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
}
