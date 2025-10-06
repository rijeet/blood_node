// Geolocation utilities for Blood Node
// Using advanced geohash implementation for better performance and accuracy
import {
  encodeGeohash as advancedEncodeGeohash,
  decodeGeohash as advancedDecodeGeohash,
  calculatePrecisionForRadius,
  getGeohashesForRadius as advancedGetGeohashesForRadius,
  generateMongoQuery as advancedGenerateMongoQuery,
  calculateDistance as advancedCalculateDistance,
  getGeohashNeighbors,
  GeohashSearchResult
} from './advanced-geohash';

/**
 * Calculate distance between two points using Haversine formula
 * Now using the advanced implementation
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return advancedCalculateDistance(lat1, lng1, lat2, lng2);
}

/**
 * Encode coordinates to geohash using advanced implementation
 * Default precision is now 6 characters for optimal 10km radius performance
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 6): string {
  return advancedEncodeGeohash(lat, lng, precision);
}

/**
 * Decode geohash to approximate coordinates using advanced implementation
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } {
  const result = advancedDecodeGeohash(geohash);
  return {
    lat: result.latitude[2], // Center latitude
    lng: result.longitude[2] // Center longitude
  };
}

/**
 * Get geohash centroid for distance calculations
 */
export function getGeohashCentroid(geohash: string): { lat: number; lng: number } {
  return decodeGeohash(geohash);
}

/**
 * Get geohashes within a certain radius using advanced grid-based sampling
 * Now uses dynamic precision and optimized grid sampling
 */
export function getGeohashesInRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  precision?: number
): string[] {
  const result = advancedGetGeohashesForRadius(centerLat, centerLng, radiusKm);
  return result.geohashes;
}

/**
 * Get geohashes for radius with full search result information
 */
export function getGeohashesForRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): GeohashSearchResult {
  return advancedGetGeohashesForRadius(centerLat, centerLng, radiusKm);
}

/**
 * Generate MongoDB query for geohash search
 */
export function generateMongoQuery(geohashes: string[]): { location_geohash: { $in: string[] } } {
  return advancedGenerateMongoQuery(geohashes);
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
 * Calculate geohash precision based on radius using advanced algorithm
 */
export function getGeohashPrecisionForRadius(radiusKm: number): number {
  return calculatePrecisionForRadius(radiusKm);
}

/**
 * Get geohash bounds for a given geohash using advanced implementation
 */
export function getGeohashBounds(geohash: string): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const result = advancedDecodeGeohash(geohash);
  return {
    north: result.latitude[1],
    south: result.latitude[0],
    east: result.longitude[1],
    west: result.longitude[0]
  };
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
