'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface Donor {
  user_code: string;
  name?: string;
  blood_group: string;
  location_address?: string;
  last_donation_date?: string;
  availability: {
    isAvailable: boolean;
    daysSinceLastDonation: number | null;
    daysUntilAvailable: number | null;
  };
  donation_count: number;
  distance_km?: number;
}

interface DonorSearchProps {
  onError: (error: string) => void;
}

export function DonorSearch({ onError }: DonorSearchProps) {
  const [searchData, setSearchData] = useState({
    blood_group: '',
    lat: '',
    lng: '',
    only_available: true
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchData(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        }));
        setLocationLoading(false);
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
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Auto-get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.lat || !searchData.lng) {
      onError('Please allow location access to search for donors');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        blood_group: searchData.blood_group,
        lat: searchData.lat,
        lng: searchData.lng,
        radius_km: '20', // Fixed 20km radius
        only_available: searchData.only_available.toString()
      });

      const result = await apiClient.get(`/api/donors/search?${params}`);
      console.log('API Response:', result); // Debug log
      setDonors(result.donors || []);

    } catch (error: any) {
      onError(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (donor: Donor) => {
    if (donor.availability.isAvailable) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Available
        </span>
      );
    } else if (donor.availability.daysUntilAvailable !== null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Available in {donor.availability.daysUntilAvailable} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Never donated
        </span>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Find Blood Donors
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search for compatible blood donors in your area
        </p>
      </div>

      {/* Search Form */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Search Donors</h2>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* Blood Group Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blood Group Needed
            </label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 input-focus"
              value={searchData.blood_group}
              onChange={(e) => setSearchData(prev => ({ ...prev, blood_group: e.target.value }))}
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Location Error Display */}
          {locationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Retry Location
                </Button>
              </div>
            </div>
          )}

          {/* Availability Filter */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <input
              type="checkbox"
              id="only_available"
              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              checked={searchData.only_available}
              onChange={(e) => setSearchData(prev => ({ ...prev, only_available: e.target.checked }))}
            />
            <div className="space-y-1">
              <label htmlFor="only_available" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Only show available donors (120+ days since last donation)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Filter to show only donors who are currently available for donation
              </p>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            type="submit" 
            disabled={loading || !searchData.lat || !searchData.lng || !searchData.blood_group}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-animate"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Donors</span>
              </div>
            )}
          </Button>
        </form>
      </Card>

      {/* Search Results */}
      {searched && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Search Results
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Found <span className="font-semibold text-red-600">{donors.length}</span> compatible donor{donors.length !== 1 ? 's' : ''} within 20km
            </p>
          </div>

          {donors.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.571M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Donors Found
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No compatible donors found in your area within 20km radius.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Try searching for a different blood group or check back later for new donors.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donors.map((donor) => (
                <Card key={donor.user_code} className="p-6 card-hover bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    {/* Donor Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {donor.name || `Donor ${donor.user_code}`}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {donor.user_code}
                        </p>
                      </div>
                      {getAvailabilityBadge(donor)}
                    </div>

                    {/* Blood Group */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Blood Group</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{donor.blood_group}</p>
                      </div>
                    </div>

                    {/* Location */}
                    {donor.location_address && (
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{donor.location_address}</p>
                        </div>
                      </div>
                    )}

                    {/* Donation Info */}
                    {donor.availability.daysSinceLastDonation !== null && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Last Donation</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {donor.availability.daysSinceLastDonation} days ago
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Donation Count - Always show */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          {donor.donation_count !== undefined ? `Donate ${donor.donation_count} time${donor.donation_count !== 1 ? 's' : ''}` : 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* Contact Button */}
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] btn-animate"
                        onClick={() => {
                          // In a real app, this would open a contact modal or send a message
                          alert(`Contact functionality not yet implemented for ${donor.user_code}`);
                        }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Contact Donor</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}