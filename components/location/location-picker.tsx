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
  hideHeader?: boolean;
}

export function LocationPicker({ onLocationSelect, initialLocation, className, hideHeader = false }: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(
    initialLocation || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);


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


  return (
    <Card className={className}>
      {!hideHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
          <CardDescription>
            Choose your location to find nearby blood donors or set your own location
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}


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


        {/* Selected Location Display */}
        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-700">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Location Selected</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {location.address ? (
                <div className="font-medium">{location.address}</div>
              ) : (
                <div>Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
