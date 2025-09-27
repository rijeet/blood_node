'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  user_code: string;
  name?: string;
  phone?: string;
  blood_group_public?: string;
  location_address?: string;
  last_donation_date?: string;
  availability: {
    isAvailable: boolean;
    daysSinceLastDonation: number | null;
    daysUntilAvailable: number | null;
  };
  availability_status: {
    status: 'available' | 'unavailable' | 'never_donated';
    message: string;
  };
  plan: string;
  email_verified: boolean;
  public_profile: boolean;
}

interface ProfileFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export function ProfileForm({ onSuccess, onError }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    blood_group_public: '',
    location_address: '',
    last_donation_date: '',
    public_profile: false
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        onError('Not authenticated');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const result = await response.json();
      setProfile(result.user);
      
      // Populate form data
      setFormData({
        name: result.user.name || '',
        phone: result.user.phone || '',
        blood_group_public: result.user.blood_group_public || '',
        location_address: result.user.location_address || '',
        last_donation_date: result.user.last_donation_date ? 
          new Date(result.user.last_donation_date).toISOString().split('T')[0] : '',
        public_profile: result.user.public_profile
      });
    } catch (error: any) {
      onError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        onError('Not authenticated');
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: formData.name || null,
          phone: formData.phone || null,
          blood_group_public: formData.blood_group_public || null,
          location_address: formData.location_address || null,
          last_donation_date: formData.last_donation_date || null
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      const result = await response.json();
      setProfile(result.user);
      onSuccess('Profile updated successfully!');

    } catch (error: any) {
      onError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      
      {profile && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Account Information</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>User Code:</strong> {profile.user_code}</p>
            <p><strong>Plan:</strong> {profile.plan}</p>
            <p><strong>Email Verified:</strong> {profile.email_verified ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}

      {profile && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">Donation Availability</h3>
          <div className="text-sm text-green-700">
            <p className="font-medium">{profile.availability_status.message}</p>
            {profile.availability.daysSinceLastDonation !== null && (
              <p>Days since last donation: {profile.availability.daysSinceLastDonation}</p>
            )}
            {profile.availability.daysUntilAvailable !== null && profile.availability.daysUntilAvailable > 0 && (
              <p>Days until available: {profile.availability.daysUntilAvailable}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full p-2 border rounded-md"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blood Group (Public)</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.blood_group_public}
              onChange={(e) => setFormData(prev => ({ ...prev, blood_group_public: e.target.value }))}
            >
              <option value="">Keep Private</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Public blood group helps others find compatible donors</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Donation Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={formData.last_donation_date}
              onChange={(e) => setFormData(prev => ({ ...prev, last_donation_date: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Used to calculate availability (120-day rule)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={formData.location_address}
            onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
            placeholder="City, State, Country"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="public_profile"
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.public_profile}
            onChange={(e) => setFormData(prev => ({ ...prev, public_profile: e.target.checked }))}
          />
          <label htmlFor="public_profile" className="text-sm">
            Make my profile public for family search
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
}
