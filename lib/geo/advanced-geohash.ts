/**
 * Advanced Geohash Implementation
 * Based on the sophisticated approach from the HTML calculator
 * Optimized for Blood Node emergency alerts and donor search
 */

// Geohash constants
const BITS = [16, 8, 4, 2, 1];
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

const NEIGHBORS = {
  right: { 
    even: "bc01fg45238967deuvhjyznpkmstqrwx",
    odd: "p0r21436x8zb9dcf5h7kjnmqesgutwvy"
  },
  left: { 
    even: "238967debc01fg45kmstqrwxuvhjyznp",
    odd: "14365h7k9dcfesgujnmqp0r2twvyx8zb"
  },
  top: { 
    even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy",
    odd: "bc01fg45238967deuvhjyznpkmstqrwx"
  },
  bottom: { 
    even: "14365h7k9dcfesgujnmqp0r2twvyx8zb",
    odd: "238967debc01fg45kmstqrwxuvhjyznp"
  }
};

const BORDERS = {
  right: { 
    even: "bcfguvyz",
    odd: "prxz"
  },
  left: { 
    even: "0145hjnp",
    odd: "028b"
  },
  top: { 
    even: "prxz",
    odd: "bcfguvyz"
  },
  bottom: { 
    even: "028b",
    odd: "0145hjnp"
  }
};

export interface GeohashResult {
  latitude: [number, number, number];
  longitude: [number, number, number];
}

export interface GeohashSearchResult {
  geohashes: string[];
  precision: number;
  radius: number;
  center: { lat: number; lng: number };
}

/**
 * Refine interval for geohash encoding/decoding
 */
function refineInterval(interval: [number, number, number], cd: number, mask: number): void {
  if (cd & mask) {
    interval[0] = (interval[0] + interval[1]) / 2;
  } else {
    interval[1] = (interval[0] + interval[1]) / 2;
  }
}

/**
 * Calculate adjacent geohash in given direction
 */
export function calculateAdjacent(srcHash: string, direction: 'right' | 'left' | 'top' | 'bottom'): string {
  srcHash = srcHash.toLowerCase();
  const lastChr = srcHash.charAt(srcHash.length - 1);
  const type = (srcHash.length % 2) ? 'odd' : 'even';
  let base = srcHash.substring(0, srcHash.length - 1);
  
  if (BORDERS[direction][type].indexOf(lastChr) !== -1) {
    base = calculateAdjacent(base, direction);
  }
  
  return base + BASE32[NEIGHBORS[direction][type].indexOf(lastChr)];
}

/**
 * Decode geohash to coordinates
 */
export function decodeGeohash(geohash: string): GeohashResult {
  let isEven = true;
  const lat: [number, number, number] = [-90.0, 90.0, 0];
  const lon: [number, number, number] = [-180.0, 180.0, 0];
  let latErr = 90.0;
  let lonErr = 180.0;
  
  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = BASE32.indexOf(c);
    
    for (let j = 0; j < 5; j++) {
      const mask = BITS[j];
      if (isEven) {
        lonErr /= 2;
        refineInterval(lon, cd, mask);
      } else {
        latErr /= 2;
        refineInterval(lat, cd, mask);
      }
      isEven = !isEven;
    }
  }
  
  lat[2] = (lat[0] + lat[1]) / 2;
  lon[2] = (lon[0] + lon[1]) / 2;
  
  return { latitude: lat, longitude: lon };
}

/**
 * Encode coordinates to geohash
 */
export function encodeGeohash(latitude: number, longitude: number, precision: number = 12): string {
  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = "";
  
  const lat: [number, number] = [-90.0, 90.0];
  const lon: [number, number] = [-180.0, 180.0];
  
  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lon[0] + lon[1]) / 2;
      if (longitude > mid) {
        ch |= BITS[bit];
        lon[0] = mid;
      } else {
        lon[1] = mid;
      }
    } else {
      const mid = (lat[0] + lat[1]) / 2;
      if (latitude > mid) {
        ch |= BITS[bit];
        lat[0] = mid;
      } else {
        lat[1] = mid;
      }
    }
    
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  
  return geohash;
}

/**
 * Calculate optimal precision for given radius
 */
export function calculatePrecisionForRadius(radiusKm: number): number {
  // Geohash precision vs approximate radius:
  // 3 chars: ~156km, 4 chars: ~39km, 5 chars: ~4.9km, 6 chars: ~1.2km, 7 chars: ~153m, 8 chars: ~38m
  if (radiusKm >= 100) return 3;
  if (radiusKm >= 30) return 4;
  if (radiusKm >= 5) return 6;  // Optimal for 10km radius
  if (radiusKm >= 1) return 6;
  return 7;
}

/**
 * Get precision radius for display
 */
export function getPrecisionRadius(precision: number): number {
  const radii: { [key: number]: number } = {
    3: 156,
    4: 39,
    5: 4.9,
    6: 1.2,
    7: 0.153,
    8: 0.038
  };
  return radii[precision] || 0.153;
}

/**
 * Generate all geohashes within radius using grid-based sampling
 */
export function generateGeohashesInRadius(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number, 
  precision: number
): string[] {
  const geohashes = new Set<string>();
  
  // Calculate the bounding box for the radius
  const latRange = radiusKm / 111.0; // 1 degree latitude ≈ 111 km
  const lngRange = radiusKm / (111.0 * Math.cos(centerLat * Math.PI / 180));
  
  const minLat = centerLat - latRange;
  const maxLat = centerLat + latRange;
  const minLng = centerLng - lngRange;
  const maxLng = centerLng + lngRange;
  
  // Sample points in a grid pattern for better coverage
  const stepLat = latRange / 10;
  const stepLng = lngRange / 10;
  
  for (let lat = minLat; lat <= maxLat; lat += stepLat) {
    for (let lng = minLng; lng <= maxLng; lng += stepLng) {
      const geohash = encodeGeohash(lat, lng, precision);
      geohashes.add(geohash);
    }
  }
  
  // Add the original geohash at the specified precision
  const originalGeohash = encodeGeohash(centerLat, centerLng, precision);
  geohashes.add(originalGeohash);
  
  return Array.from(geohashes).sort();
}

/**
 * Main function to get geohashes for emergency alerts
 */
export function getGeohashesForRadius(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): GeohashSearchResult {
  const precision = calculatePrecisionForRadius(radiusKm);
  const geohashes = generateGeohashesInRadius(centerLat, centerLng, radiusKm, precision);
  
  return {
    geohashes,
    precision,
    radius: radiusKm,
    center: { lat: centerLat, lng: centerLng }
  };
}

/**
 * Generate MongoDB query for geohash search
 */
export function generateMongoQuery(geohashes: string[]): { location_geohash: { $in: string[] } } {
  return {
    location_geohash: { $in: geohashes }
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all 8 neighbors of a geohash
 */
export function getGeohashNeighbors(geohash: string): string[] {
  const directions: Array<'right' | 'left' | 'top' | 'bottom'> = ['right', 'left', 'top', 'bottom'];
  const neighbors: string[] = [];
  
  for (const direction of directions) {
    neighbors.push(calculateAdjacent(geohash, direction));
  }
  
  // Add corner neighbors
  const right = calculateAdjacent(geohash, 'right');
  const left = calculateAdjacent(geohash, 'left');
  
  neighbors.push(calculateAdjacent(right, 'top'));
  neighbors.push(calculateAdjacent(right, 'bottom'));
  neighbors.push(calculateAdjacent(left, 'top'));
  neighbors.push(calculateAdjacent(left, 'bottom'));
  
  return neighbors;
}
