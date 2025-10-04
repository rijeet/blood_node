'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DonationRecordButton } from './donation-record-button';
import { LocationPickerModal } from './location-picker-modal';

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
  loadOnMount?: boolean; // New prop to control when to load profile data
}

export function ProfileForm({ onSuccess, onError, loadOnMount = true }: ProfileFormProps) {
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
  const [locationData, setLocationData] = useState<{ address: string; lat: number; lng: number; details?: any } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Donation record form state
  const [showDonationRecordModal, setShowDonationRecordModal] = useState(false);
  const [donationRecordForm, setDonationRecordForm] = useState({
    donation_date: '',
    blood_group: '',
    bags_donated: 1,
    donation_place: ''
  });
  const [donationRecordSaving, setDonationRecordSaving] = useState(false);
  const previousDonationDate = useRef<string>('');

  // Load profile data only if loadOnMount is true
  useEffect(() => {
    if (loadOnMount) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [loadOnMount]);

  const loadProfile = async () => {
    try {
      const result = await apiClient.get('/api/profile');
      setProfile(result.user);
      
      // Populate form data
      const donationDate = result.user.last_donation_date ? 
        new Date(result.user.last_donation_date).toISOString().split('T')[0] : '';
      
      setFormData({
        name: result.user.name || '',
        phone: result.user.phone || '',
        blood_group_public: result.user.blood_group_public || '',
        location_address: result.user.location_address || '',
        last_donation_date: donationDate,
        public_profile: result.user.public_profile
      });
      
      // Set location data if available
      if (result.user.location_address) {
        setLocationData({
          address: result.user.location_address,
          lat: 0, // Will be updated when user selects new location
          lng: 0  // Will be updated when user selects new location
        });
      }
      
      // Store the initial donation date for comparison
      previousDonationDate.current = donationDate;
      
      // Pre-populate donation record form with current blood group
      setDonationRecordForm(prev => ({
        ...prev,
        blood_group: result.user.blood_group_public || '',
        donation_date: donationDate
      }));
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
      const result = await apiClient.put('/api/profile', {
        name: formData.name || null,
        phone: formData.phone || null,
        blood_group_public: formData.blood_group_public || null,
        location_address: formData.location_address || null,
        location_geohash: locationData ? `${locationData.lat},${locationData.lng}` : null,
        last_donation_date: formData.last_donation_date || null
      });

      setProfile(result.user);
      onSuccess('Profile updated successfully!');

    } catch (error: any) {
      onError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle donation date change
  const handleDonationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFormData(prev => ({ ...prev, last_donation_date: newDate }));
    
    // Check if the date has changed and is not empty
    if (newDate !== previousDonationDate.current && newDate) {
      // Update the donation record form with the new date
      setDonationRecordForm(prev => ({
        ...prev,
        donation_date: newDate
      }));
      
      // Show the donation record modal
      setShowDonationRecordModal(true);
    }
    
    // Update the previous date reference
    previousDonationDate.current = newDate;
  };

  // Handle donation record form submission
  const handleDonationRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonationRecordSaving(true);

    try {
      const result = await apiClient.post('/api/profile/donation-records', {
        donation_date: donationRecordForm.donation_date,
        blood_group: donationRecordForm.blood_group,
        bags_donated: donationRecordForm.bags_donated,
        donation_place: donationRecordForm.donation_place || null
      });

      // Close the modal and refresh profile
      setShowDonationRecordModal(false);
      await loadProfile();
      onSuccess('Donation record added successfully!');

    } catch (error: any) {
      onError(error.message || 'Failed to add donation record');
    } finally {
      setDonationRecordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-8"></div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          
          {/* Form skeleton */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your blood donation profile and availability
        </p>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information Card */}
        {profile && (
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Account Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">User Code:</span>
                <Badge variant="outline" className="font-mono text-xs">{profile.user_code}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">Plan:</span>
                <Badge variant="secondary" className="capitalize">{profile.plan}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">Email Verified:</span>
                <Badge variant={profile.email_verified ? "default" : "destructive"}>
                  {profile.email_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Donation Availability Card */}
        {profile && (
          <Card className={`p-6 border-2 card-hover ${
            profile.availability.isAvailable 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 pulse-available'
              : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 pulse-unavailable'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                profile.availability.isAvailable 
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <svg className={`w-6 h-6 ${
                  profile.availability.isAvailable 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold ${
                profile.availability.isAvailable 
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-amber-900 dark:text-amber-100'
              }`}>
                Donation Availability
              </h3>
            </div>
            <div className="space-y-3">
              <p className={`font-medium ${
                profile.availability.isAvailable 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                {profile.availability_status.message}
              </p>
              {profile.availability.daysSinceLastDonation !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className={profile.availability.isAvailable ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
                    Days since last donation:
                  </span>
                  <Badge variant="outline">{profile.availability.daysSinceLastDonation}</Badge>
                </div>
              )}
              {profile.availability.daysUntilAvailable !== null && profile.availability.daysUntilAvailable > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-700 dark:text-amber-300">Days until available:</span>
                  <Badge variant="outline">{profile.availability.daysUntilAvailable}</Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Donation Records Card */}
        {profile && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 card-hover">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Donation Records</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Track your blood donation history and see your impact on saving lives.
              </p>
              <div className="flex justify-center">
                <DonationRecordButton userId={profile.id} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Profile Form */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 input-focus"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 input-focus"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Blood Donation Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Blood Donation Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Blood Group (Public)
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 input-focus"
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Public blood group helps others find compatible donors
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Donation Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 input-focus"
                  value={formData.last_donation_date}
                  onChange={handleDonationDateChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Used to calculate availability (120-day rule)
                </p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Location Information
            </h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={formData.location_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  placeholder="City, State, Country"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-3"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Pick Location
                </Button>
              </div>
              {locationData && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-800">
                    <strong>Selected Location:</strong> {locationData.address}
                  </p>
                  <p className="text-green-600 text-xs">
                    Coordinates: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                  </p>
                  {locationData.details && (
                    <div className="mt-1 text-xs text-green-700">
                      {locationData.details.building && (
                        <p><strong>Building:</strong> {locationData.details.building}</p>
                      )}
                      {locationData.details.road && (
                        <p><strong>Road:</strong> {locationData.details.road}</p>
                      )}
                      {locationData.details.houseNumber && (
                        <p><strong>House Number:</strong> {locationData.details.houseNumber}</p>
                      )}
                      {locationData.details.amenity && (
                        <p><strong>Type:</strong> {locationData.details.amenity}</p>
                      )}
                      {locationData.details.shop && (
                        <p><strong>Shop:</strong> {locationData.details.shop}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Privacy Settings
            </h3>
            <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <input
                type="checkbox"
                id="public_profile"
                className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                checked={formData.public_profile}
                onChange={(e) => setFormData(prev => ({ ...prev, public_profile: e.target.checked }))}
              />
              <div className="space-y-1">
                <label htmlFor="public_profile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make my profile public for family search
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow other users to find and connect with you through family search features
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={saving}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-animate"
            >
              {saving ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Update Profile</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Donation Record Modal */}
      {showDonationRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add Donation Record</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDonationRecordModal(false)}
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Since you updated your last donation date, would you like to add a donation record?
              </p>
            </div>
            
            <form onSubmit={handleDonationRecordSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donation_date">Donation Date</Label>
                  <Input
                    id="donation_date"
                    type="date"
                    value={donationRecordForm.donation_date}
                    onChange={(e) => setDonationRecordForm(prev => ({ ...prev, donation_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <select
                    id="blood_group"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={donationRecordForm.blood_group}
                    onChange={(e) => setDonationRecordForm(prev => ({ ...prev, blood_group: e.target.value }))}
                    required
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bags_donated">Bags Donated</Label>
                  <select
                    id="bags_donated"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={donationRecordForm.bags_donated}
                    onChange={(e) => setDonationRecordForm(prev => ({ ...prev, bags_donated: parseInt(e.target.value) }))}
                    required
                  >
                    <option value={1}>1 Bag</option>
                    <option value={2}>2 Bags</option>
                    <option value={3}>3 Bags</option>
                    <option value={4}>4 Bags</option>
                    <option value={5}>5 Bags</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donation_place">Donation Place (Optional)</Label>
                  <Input
                    id="donation_place"
                    type="text"
                    placeholder="Hospital, Blood Bank, etc."
                    value={donationRecordForm.donation_place}
                    onChange={(e) => setDonationRecordForm(prev => ({ ...prev, donation_place: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDonationRecordModal(false)}
                  disabled={donationRecordSaving}
                >
                  Skip
                </Button>
                <Button
                  type="submit"
                  disabled={donationRecordSaving}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                >
                  {donationRecordSaving ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Record'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={(location) => {
          setLocationData(location);
          setFormData(prev => ({ ...prev, location_address: location.address }));
        }}
        currentLocation={formData.location_address}
        currentLocationData={locationData || undefined}
      />
    </div>
  );
}
