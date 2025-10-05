'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, MapPin, Loader2 } from 'lucide-react';
import { LocationPickerModal } from './location-picker-modal';
import { apiClient } from '@/lib/api-client';
import { decodeGeohash } from '@/lib/geo';

interface LocationUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  currentLocation?: string;
  currentLocationGeohash?: string;
}

export function LocationUpdateModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  currentLocation = '',
  currentLocationGeohash
}: LocationUpdateModalProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [locationData, setLocationData] = useState<{ address: string; lat: number; lng: number; details?: any } | null>(null);

  // Initialize location data from current location
  useEffect(() => {
    if (isOpen && currentLocation) {
      let coordinates = { lat: 0, lng: 0 };
      
      // Decode geohash to get coordinates if available
      if (currentLocationGeohash) {
        try {
          const decoded = decodeGeohash(currentLocationGeohash);
          if (decoded && typeof decoded.lat === 'number' && typeof decoded.lng === 'number') {
            coordinates = decoded;
          }
        } catch (error) {
          console.error('Failed to decode geohash:', error);
        }
      }
      
      setLocationData({
        address: currentLocation,
        lat: coordinates.lat,
        lng: coordinates.lng
      });
    } else if (isOpen && !currentLocation) {
      // Clear location data if no current location
      setLocationData(null);
    }
  }, [isOpen, currentLocation, currentLocationGeohash]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number; details?: any }) => {
    setLocationData(location);
    setShowLocationPicker(false);
  };

  const handleUpdateLocation = async () => {
    if (!locationData) {
      onError('Please select a location');
      return;
    }

    setUpdating(true);
    try {
      await apiClient.put('/api/profile/location', {
        location_address: locationData.address,
        location_geohash: `${locationData.lat},${locationData.lng}`
      });

      onSuccess('Location updated successfully!');
      onClose();
    } catch (error: any) {
      onError(error.message || 'Failed to update location');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Update Location
              </CardTitle>
              <CardDescription>
                Update your location for emergency alerts and family search
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Current Location Display */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Current Location:</h3>
              <p className="text-sm text-gray-600 mb-2">{currentLocation || 'No location set'}</p>
              {currentLocationGeohash && (
                <div className="text-xs text-gray-500">
                  <p>Coordinates: {locationData && locationData.lat !== undefined && locationData.lng !== undefined ? `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}` : 'Loading...'}</p>
                </div>
              )}
            </div>

            {/* New Location Display */}
            {locationData && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">New Location:</h3>
                <p className="text-sm text-gray-600 mb-2">{locationData.address}</p>
                <div className="text-xs text-gray-500">
                  <p>Coordinates: {locationData.lat !== undefined && locationData.lng !== undefined ? `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}` : 'Invalid coordinates'}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationPicker(true)}
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Pick New Location
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateLocation}
                disabled={!locationData || updating}
                className="flex-1"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Location'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation}
        currentLocationData={locationData || undefined}
      />
    </>
  );
}
