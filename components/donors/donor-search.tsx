'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
    radius_km: '50',
    only_available: true
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        onError('Not authenticated');
        return;
      }

      const params = new URLSearchParams({
        blood_group: searchData.blood_group,
        lat: searchData.lat,
        lng: searchData.lng,
        radius_km: searchData.radius_km,
        only_available: searchData.only_available.toString()
      });

      const response = await fetch(`/api/donors/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Search failed');
      }

      const result = await response.json();
      setDonors(result.donors);

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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Find Blood Donors</h2>
      
      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blood Group Needed</label>
            <select
              required
              className="w-full p-2 border rounded-md"
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

          <div>
            <label className="block text-sm font-medium mb-1">Search Radius (km)</label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchData.radius_km}
              onChange={(e) => setSearchData(prev => ({ ...prev, radius_km: e.target.value }))}
            >
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
              <option value="200">200 km</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full p-2 border rounded-md"
              value={searchData.lat}
              onChange={(e) => setSearchData(prev => ({ ...prev, lat: e.target.value }))}
              placeholder="40.7128"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full p-2 border rounded-md"
              value={searchData.lng}
              onChange={(e) => setSearchData(prev => ({ ...prev, lng: e.target.value }))}
              placeholder="-74.0060"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="only_available"
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={searchData.only_available}
            onChange={(e) => setSearchData(prev => ({ ...prev, only_available: e.target.checked }))}
          />
          <label htmlFor="only_available" className="text-sm">
            Only show available donors (120+ days since last donation)
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Searching...' : 'Search Donors'}
        </Button>
      </form>

      {searched && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Found {donors.length} compatible donor{donors.length !== 1 ? 's' : ''}
          </h3>

          {donors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No compatible donors found in your area.</p>
              <p className="text-sm mt-2">Try expanding your search radius or checking different blood groups.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donors.map((donor) => (
                <div key={donor.user_code} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">
                          {donor.name || `Donor ${donor.user_code}`}
                        </h4>
                        {getAvailabilityBadge(donor)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Blood Group:</strong> {donor.blood_group}</p>
                        <p><strong>User Code:</strong> {donor.user_code}</p>
                        {donor.location_address && (
                          <p><strong>Location:</strong> {donor.location_address}</p>
                        )}
                        {donor.last_donation_date && (
                          <p><strong>Last Donation:</strong> {new Date(donor.last_donation_date).toLocaleDateString()}</p>
                        )}
                        {donor.availability.daysSinceLastDonation !== null && (
                          <p><strong>Days Since Last Donation:</strong> {donor.availability.daysSinceLastDonation}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // In a real app, this would open a contact modal or send a message
                          alert(`Contact functionality not yet implemented for ${donor.user_code}`);
                        }}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}