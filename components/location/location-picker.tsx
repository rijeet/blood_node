'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Search, AlertCircle } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number; address?: string };
  className?: string;
}

export function LocationPicker({ onLocationSelect, initialLocation, className }: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(
    initialLocation || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setLocation(newLocation);
        onLocationSelect(newLocation);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLocation = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
        setLocation(newLocation);
        onLocationSelect(newLocation);
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      setError('Failed to search for location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual coordinate input
  const handleManualInput = () => {
    const latInput = document.getElementById('lat-input') as HTMLInputElement;
    const lngInput = document.getElementById('lng-input') as HTMLInputElement;
    
    if (latInput && lngInput) {
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lngInput.value);
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const newLocation = { lat, lng };
        setLocation(newLocation);
        onLocationSelect(newLocation);
        setError(null);
      } else {
        setError('Please enter valid coordinates (lat: -90 to 90, lng: -180 to 180)');
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
        <CardDescription>
          Choose your location to find nearby blood donors or set your own location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Current Location Button */}
        <div className="space-y-2">
          <Button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isLoading ? 'Getting Location...' : 'Use Current Location'}
          </Button>
        </div>

        {/* Search Location */}
        <div className="space-y-2">
          <Label htmlFor="search-input">Search for a location</Label>
          <div className="flex gap-2">
            <Input
              id="search-input"
              placeholder="Enter city, address, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button onClick={searchLocation} disabled={isLoading || !searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Manual Coordinates */}
        <div className="space-y-2">
          <Label>Or enter coordinates manually</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lat-input" className="text-xs">Latitude</Label>
              <Input
                id="lat-input"
                type="number"
                step="any"
                placeholder="40.7128"
                min="-90"
                max="90"
              />
            </div>
            <div>
              <Label htmlFor="lng-input" className="text-xs">Longitude</Label>
              <Input
                id="lng-input"
                type="number"
                step="any"
                placeholder="-74.0060"
                min="-180"
                max="180"
              />
            </div>
          </div>
          <Button onClick={handleManualInput} variant="outline" size="sm">
            Set Coordinates
          </Button>
        </div>

        {/* Selected Location Display */}
        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-700">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Location Selected</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              <div>Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
              {location.address && (
                <div className="mt-1 text-xs opacity-75">{location.address}</div>
              )}
            </div>
          </div>
        )}

        {/* Map Toggle */}
        <div className="pt-2 border-t">
          <Button
            onClick={() => setShowMap(!showMap)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          {showMap && (
            <div className="mt-2 h-64 bg-gray-100 rounded-md flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>Map view would be displayed here</p>
                <p className="text-xs">Integration with map library needed</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
