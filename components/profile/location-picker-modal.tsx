'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MapPin, Search, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import Leaflet CSS - Next.js will handle this properly
import 'leaflet/dist/leaflet.css';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; lat: number; lng: number; details?: any }) => void;
  currentLocation?: string;
  currentLocationData?: { address: string; lat: number; lng: number; details?: any };
}

// Function to truncate address by removing last 2 comma-separated parts
function truncateAddress(address: string): string {
  if (!address || !address.includes(',')) {
    return address;
  }
  
  const parts = address.split(',').map(part => part.trim());
  
  // If we have 3 or more parts, remove the last 2
  if (parts.length >= 3) {
    return parts.slice(0, -2).join(', ');
  }
  
  // If we have 2 parts, remove the last 1
  if (parts.length === 2) {
    return parts[0];
  }
  
  // If we have only 1 part, return as is
  return address;
}

// Function to parse detailed address information from Nominatim response
function parseDetailedAddress(data: any, lat: number, lng: number) {
  const addr = data.address || {};
  const extratags = data.extratags || {};
  const namedetails = data.namedetails || {};
  
  // Extract specific building/road information
  const building = addr.building || extratags.building || namedetails.building;
  const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway;
  const houseNumber = addr.house_number;
  const amenity = addr.amenity || extratags.amenity;
  const shop = addr.shop || extratags.shop;
  const tourism = addr.tourism || extratags.tourism;
  const leisure = addr.leisure || extratags.leisure;
  const office = addr.office || extratags.office;
  const healthcare = addr.healthcare || extratags.healthcare;
  
  // Create detailed location information
  const details = {
    building,
    road,
    houseNumber,
    amenity,
    shop,
    tourism,
    leisure,
    office,
    healthcare,
    type: data.type,
    category: data.category,
    placeType: data.addresstype,
    raw: data
  };
  
  // Build formatted address with priority for specific locations
  let formattedAddress = '';
  
  if (building && houseNumber) {
    formattedAddress = `${building} ${houseNumber}`;
  } else if (building) {
    formattedAddress = building;
  } else if (amenity) {
    formattedAddress = amenity;
  } else if (shop) {
    formattedAddress = shop;
  } else if (tourism) {
    formattedAddress = tourism;
  } else if (leisure) {
    formattedAddress = leisure;
  } else if (office) {
    formattedAddress = office;
  } else if (healthcare) {
    formattedAddress = healthcare;
  } else if (road) {
    formattedAddress = road;
  }
  
  // Add road information if we have a building but no road in the main name
  if (building && road && !formattedAddress.includes(road)) {
    formattedAddress = `${formattedAddress}, ${road}`;
  }
  
  // Add neighborhood/city information
  const neighborhood = addr.neighbourhood || addr.suburb;
  const city = addr.city || addr.town || addr.village;
  const state = addr.state;
  const country = addr.country;
  
  if (neighborhood && !formattedAddress.includes(neighborhood)) {
    formattedAddress = `${formattedAddress}, ${neighborhood}`;
  }
  if (city && !formattedAddress.includes(city)) {
    formattedAddress = `${formattedAddress}, ${city}`;
  }
  if (state && !formattedAddress.includes(state)) {
    formattedAddress = `${formattedAddress}, ${state}`;
  }
  if (country && !formattedAddress.includes(country)) {
    formattedAddress = `${formattedAddress}, ${country}`;
  }
  
  // Fallback to display_name if we don't have a good formatted address
  if (!formattedAddress || formattedAddress.length < 5) {
    formattedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  
  // Truncate address to show only specific portion (skip last 2 comma-separated parts)
  const truncatedAddress = truncateAddress(formattedAddress);
  
  return {
    formatted: truncatedAddress,
    details
  };
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onLocationSelect: (location: { address: string; lat: number; lng: number; details?: any }) => void;
}

function LocationMarker({ position, onLocationSelect }: LocationMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);

  // Custom marker icon
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Fix for default markers in react-leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return markerPosition === null ? null : <Marker position={markerPosition} />;
}

export function LocationPickerModal({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  currentLocation = '',
  currentLocationData 
}: LocationPickerModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentLocation);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    currentLocationData ? [currentLocationData.lat, currentLocationData.lng] : null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    currentLocationData ? [currentLocationData.lat, currentLocationData.lng] : [40.7128, -74.0060]
  );
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Try to get user's location if no current location
    if (!currentLocationData && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log('Geolocation not available:', error);
        }
      );
    }
  }, [currentLocationData]);

  // Handle map click events with enhanced POI detection
  const handleMapClick = useCallback(async (e: any) => {
    const { lat, lng } = e.latlng;
    setIsReverseGeocoding(true);
    
    try {
      // Enhanced reverse geocoding with detailed information
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1&namedetails=1&zoom=18`
      );
      const data = await response.json();
      
      // Parse detailed address information
      const address = parseDetailedAddress(data, lat, lng);
      
      onLocationSelect({
        address: address.formatted,
        lat,
        lng,
        details: address.details
      });
      
      // Update local state
      setSearchQuery(address.formatted);
      setMarkerPosition([lat, lng]);
      
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates if reverse geocoding fails
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onLocationSelect({
        address: fallbackAddress,
        lat,
        lng
      });
      setSearchQuery(fallbackAddress);
      setMarkerPosition([lat, lng]);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [onLocationSelect]);

  // Set up map click handler when map is ready
  useEffect(() => {
    if (mapRef.current && mapRef.current.leafletElement) {
      const map = mapRef.current.leafletElement;
      mapInstanceRef.current = map;
      
      const handleClick = (e: any) => {
        handleMapClick(e);
      };
      
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [handleMapClick]);

  // Enhanced search functionality with detailed POI detection
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&extratags=1&namedetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const position: [number, number] = [lat, lng];
        
        setMarkerPosition(position);
        setMapCenter(position);
        
        // Parse detailed address information
        const address = parseDetailedAddress(result, lat, lng);
        
        // Update parent component with enhanced details
        onLocationSelect({
          address: address.formatted,
          lat,
          lng,
          details: address.details
        });
        
        // Update local state
        setSearchQuery(address.formatted);
        
        // Fly to location if map is available
        if (mapRef.current) {
          mapRef.current.flyTo(position, 15);
        }
      } else {
        alert('Location not found. Please try a different search term or click on the map.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again or click on the map to select a location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleLocationSelect = useCallback((location: { address: string; lat: number; lng: number; details?: any }) => {
    setSearchQuery(location.address);
    setMarkerPosition([location.lat, location.lng]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  const handleConfirm = () => {
    if (markerPosition) {
      onClose();
    } else {
      alert('Please select a location first');
    }
  };

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Select Your Location</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="location-search" className="sr-only">
                Search for location
              </Label>
              <Input
                id="location-search"
                type="text"
                placeholder="Search for your location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Map Container */}
          <div className="w-full h-96 rounded-md border border-gray-300 overflow-hidden relative group">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker 
                position={markerPosition} 
                onLocationSelect={handleLocationSelect}
              />
            </MapContainer>
            
            {/* Click indicator overlay */}
            {!isReverseGeocoding && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                Click to select location
              </div>
            )}
            
            {/* Loading overlay for reverse geocoding */}
            {isReverseGeocoding && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-700">Getting address...</span>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            <p className="mb-1"><strong>How to select your location:</strong></p>
            <p className="mb-1">• Type your address and click "Search"</p>
            <p className="mb-1">• Click anywhere on the map to select that location</p>
            <p className="mb-1">• Click on specific buildings, roads, or landmarks for precise selection</p>
            <p className="mt-2 text-green-600">
              ✅ <strong>100% Free</strong> - No API key or billing required!
            </p>
            <p className="mt-1 text-blue-600">
              🎯 <strong>Enhanced Selection</strong> - Detects buildings, roads, shops, and POIs!
            </p>
          </div>

          {/* Selected Location Display */}
          {markerPosition && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-green-800 font-medium">
                <strong>Selected Location:</strong> {searchQuery}
              </p>
              <p className="text-green-600 text-xs mt-1">
                Coordinates: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!markerPosition}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
