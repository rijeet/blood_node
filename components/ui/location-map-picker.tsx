'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
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

// Note: useMapEvents is a hook and cannot be dynamically imported
// We'll handle map events differently

interface LocationMapPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  value?: string;
  error?: string;
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
}

// Component to handle map clicks and set markers
function LocationMarker({ position, onLocationSelect }: LocationMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);

  // Custom marker icon
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      
      // Fix for default markers in react-leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  // Update marker position when position prop changes
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return markerPosition === null ? null : <Marker position={markerPosition} />;
}

// Note: Map click functionality temporarily disabled due to TypeScript compilation issues
// Users can still search for locations using the search input

export function LocationMapPicker({ onLocationSelect, value, error }: LocationMapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const mapRef = useRef<any>(null);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log('Geolocation not available:', error);
          // Keep default location
        }
      );
    }
  }, []);

  // Search functionality using Nominatim (OpenStreetMap's geocoding service)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const position: [number, number] = [lat, lng];
        
        setMarkerPosition(position);
        setMapCenter(position);
        
        // Update parent component
        onLocationSelect({
          address: result.display_name || searchQuery,
          lat,
          lng
        });
        
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

  const handleLocationSelect = useCallback((location: { address: string; lat: number; lng: number }) => {
    setSearchQuery(location.address);
    setMarkerPosition([location.lat, location.lng]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  if (!isClient) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <div className="w-full h-64 bg-gray-800 rounded-md flex items-center justify-center border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-2">Loading Map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">
        Location <span className="text-red-500">*</span>
      </label>
      
      <div className="space-y-3">
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search for your location (e.g., New York, NY)"
            className="flex-1 p-3 border rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Map Container */}
        <div className="w-full h-64 rounded-md border border-gray-300 overflow-hidden">
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
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
          <p className="mb-1"><strong>How to select your location:</strong></p>
          <p className="mb-1">• Type your address and click "Search"</p>
          <p className="text-gray-400">• Map click functionality coming soon</p>
          <p className="mt-2 text-green-600">
            ✅ <strong>100% Free</strong> - No API key or billing required!
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}