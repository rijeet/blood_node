'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AvailableDonor {
  _id: string;
  user_code: string;
  name?: string;
  blood_type: string;
  location_address?: string;
  last_donation_date?: string;
  availability: {
    isAvailable: boolean;
    daysSinceLastDonation: number | null;
    daysUntilAvailable: number | null;
  };
  distance_km?: number;
}

interface DonorSelectionProps {
  emergencyId: string;
  onDonorSelected: (donorId: string) => void;
  onClose: () => void;
}

export function DonorSelection({ emergencyId, onDonorSelected, onClose }: DonorSelectionProps) {
  const [donors, setDonors] = useState<AvailableDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableDonors();
  }, [emergencyId]);

  const fetchAvailableDonors = async () => {
    try {
      const response = await fetch(`/api/emergency/available-donors?emergency_id=${emergencyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonors(data.donors);
      }
    } catch (error) {
      console.error('Failed to fetch available donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDonor = async () => {
    if (!selectedDonorId) return;
    
    setSelecting(true);
    try {
      const response = await fetch('/api/emergency/select-donor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          emergency_id: emergencyId,
          donor_id: selectedDonorId
        })
      });

      if (response.ok) {
        onDonorSelected(selectedDonorId);
      } else {
        alert('Failed to select donor. Please try again.');
      }
    } catch (error) {
      alert('Failed to select donor. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading available donors...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Select a Donor</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Choose from available donors who responded to your emergency alert
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {donors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🩸</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Donors</h3>
              <p className="text-gray-600">
                No donors have responded to your emergency alert yet. Please wait or try expanding your search radius.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {donors.map((donor) => (
                <Card 
                  key={donor._id} 
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedDonorId === donor._id 
                      ? 'ring-2 ring-red-500 bg-red-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDonorId(donor._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {donor.name || `Donor ${donor.user_code}`}
                        </h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {donor.user_code}
                        </Badge>
                        <Badge 
                          variant={donor.availability.isAvailable ? "default" : "secondary"}
                          className={donor.availability.isAvailable ? "bg-green-100 text-green-800" : ""}
                        >
                          {donor.availability.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Blood Type:</span>
                          <span className="ml-2 font-medium text-red-600">{donor.blood_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <span className="ml-2 font-medium">
                            {donor.distance_km ? `${donor.distance_km.toFixed(1)} km` : 'Unknown'}
                          </span>
                        </div>
                        {donor.location_address && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Location:</span>
                            <span className="ml-2 font-medium">{donor.location_address}</span>
                          </div>
                        )}
                        {donor.availability.daysSinceLastDonation !== null && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Last Donation:</span>
                            <span className="ml-2 font-medium">
                              {donor.availability.daysSinceLastDonation} days ago
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <input
                        type="radio"
                        name="selectedDonor"
                        checked={selectedDonorId === donor._id}
                        onChange={() => setSelectedDonorId(donor._id)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {donors.length} available donor{donors.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSelectDonor}
                disabled={!selectedDonorId || selecting}
                className="bg-red-600 hover:bg-red-700"
              >
                {selecting ? 'Selecting...' : 'Select Donor'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
