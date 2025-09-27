// Geolocation utilities for Blood Node
// @ts-expect-error - ngeohash doesn't have type definitions
import * as ngeohash from 'ngeohash';

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
 * Encode coordinates to geohash using ngeohash library
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 5): string {
  return ngeohash.encode(lat, lng, precision);
}

/**
 * Decode geohash to approximate coordinates using ngeohash library
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } {
  return ngeohash.decode(geohash);
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
  const center = encodeGeohash(centerLat, centerLng, precision);
  const neighbors: string[] = [center];
  
  // Get all neighbors of the center geohash
  const neighborHashes = ngeohash.neighbors(center);
  neighbors.push(...neighborHashes);
  
  // For larger radius, we might need to check neighbors of neighbors
  if (radiusKm > 10) {
    const extendedNeighbors: string[] = [];
    for (const neighbor of neighborHashes) {
      try {
        const neighborOfNeighbor = ngeohash.neighbors(neighbor);
        extendedNeighbors.push(...neighborOfNeighbor);
      } catch (error) {
        // Skip invalid geohashes
        continue;
      }
    }
    neighbors.push(...extendedNeighbors);
  }
  
  // Remove duplicates
  return [...new Set(neighbors)];
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

/**
 * Blood type compatibility matrix
 */
export const BLOOD_TYPE_COMPATIBILITY = {
  'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
  'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+': { canDonateTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
  'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
} as const;

export type BloodType = keyof typeof BLOOD_TYPE_COMPATIBILITY;

/**
 * Check if one blood type can donate to another
 */
export function canDonateTo(donorType: BloodType, recipientType: BloodType): boolean {
  return BLOOD_TYPE_COMPATIBILITY[donorType].canDonateTo.includes(recipientType as any);
}

/**
 * Check if one blood type can receive from another
 */
export function canReceiveFrom(recipientType: BloodType, donorType: BloodType): boolean {
  return BLOOD_TYPE_COMPATIBILITY[recipientType].canReceiveFrom.includes(donorType as any);
}

/**
 * Interface for blood donor location data
 */
export interface BloodDonorLocation {
  user_id: string;
  user_code: string;
  blood_type: BloodType;
  lat: number;
  lng: number;
  geohash: string;
  last_donation?: Date;
  is_available: boolean;
  contact_preference: 'email' | 'phone' | 'app';
  emergency_contact: boolean;
  created_at: Date;
  updated_at: Date;
  distance?: number; // Added for search results
}

/**
 * Find compatible blood donors within radius
 */
export function findCompatibleDonors(
  recipientBloodType: BloodType,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  donors: BloodDonorLocation[]
): BloodDonorLocation[] {
  return donors
    .filter(donor => {
      // Check blood type compatibility
      const isCompatible = canDonateTo(donor.blood_type, recipientBloodType);
      
      // Check if within radius
      const isWithinRange = isWithinRadius(centerLat, centerLng, donor.lat, donor.lng, radiusKm);
      
      // Check if available
      const isAvailable = donor.is_available;
      
      return isCompatible && isWithinRange && isAvailable;
    })
    .map(donor => ({
      ...donor,
      distance: calculateDistance(centerLat, centerLng, donor.lat, donor.lng)
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Find emergency donors (those who have emergency contact enabled)
 */
export function findEmergencyDonors(
  recipientBloodType: BloodType,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  donors: BloodDonorLocation[]
): BloodDonorLocation[] {
  return findCompatibleDonors(recipientBloodType, centerLat, centerLng, radiusKm, donors)
    .filter(donor => donor.emergency_contact);
}

/**
 * Calculate geohash precision based on radius
 */
export function getGeohashPrecisionForRadius(radiusKm: number): number {
  if (radiusKm <= 1) return 7;      // ~150m precision
  if (radiusKm <= 5) return 6;      // ~600m precision
  if (radiusKm <= 20) return 5;     // ~2.4km precision
  if (radiusKm <= 100) return 4;    // ~20km precision
  return 3;                          // ~78km precision
}

/**
 * Get geohash bounds for a given geohash
 */
export function getGeohashBounds(geohash: string): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  return ngeohash.decode_bbox(geohash);
}

/**
 * Check if a location is within geohash bounds
 */
export function isLocationInGeohash(
  lat: number,
  lng: number,
  geohash: string
): boolean {
  const bounds = getGeohashBounds(geohash);
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
}

/**
 * Get all geohashes that intersect with a circle
 */
export function getGeohashesInCircle(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  precision: number = 5
): string[] {
  const geohashes = getGeohashesInRadius(centerLat, centerLng, radiusKm, precision);
  const intersectingGeohashes: string[] = [];
  
  for (const geohash of geohashes) {
    const bounds = getGeohashBounds(geohash);
    
    // Check if any corner of the geohash is within the circle
    const corners = [
      { lat: bounds.north, lng: bounds.east },
      { lat: bounds.north, lng: bounds.west },
      { lat: bounds.south, lng: bounds.east },
      { lat: bounds.south, lng: bounds.west },
      { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 }
    ];
    
    const hasIntersection = corners.some(corner => 
      isWithinRadius(centerLat, centerLng, corner.lat, corner.lng, radiusKm)
    );
    
    if (hasIntersection) {
      intersectingGeohashes.push(geohash);
    }
  }
  
  return intersectingGeohashes;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get driving time estimate (rough calculation)
 */
export function estimateDrivingTime(distanceKm: number): number {
  // Rough estimate: 50km/h average in city, 80km/h on highways
  const averageSpeed = distanceKm < 10 ? 30 : 50; // km/h
  return Math.round((distanceKm / averageSpeed) * 60); // minutes
}
