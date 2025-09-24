'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LocationMapPicker } from '@/components/ui/location-map-picker';
import { BloodNodeCrypto } from '@/lib/crypto/client';
import { hashEmail } from '@/lib/auth/jwt';

interface SignupFormProps {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    bloodGroup: '',
    location: '',
    locationData: null as { address: string; lat: number; lng: number } | null,
    makePublic: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      onError('Password must be at least 8 characters');
      return;
    }

    if (!formData.locationData) {
      onError('Please select your location on the map');
      return;
    }

    setLoading(true);

    try {
      // Initialize crypto
      const crypto = new BloodNodeCrypto();
      const cryptoData = await crypto.initializeNewUser(formData.password);

      // Hash email
      const emailHash = hashEmail(formData.email);

      // Prepare signup data
      const signupData = {
        email_hash: emailHash,
        public_key: cryptoData.publicKey,
        encrypted_private_key: cryptoData.encryptedPrivateKey,
        master_salt: cryptoData.masterSalt,
        sss_server_share: cryptoData.sssShares[1], // Server gets share index 1
        user_code: cryptoData.userCode,
        blood_group_public: formData.makePublic ? formData.bloodGroup : null,
        location_geohash: formData.locationData ? `${formData.locationData.lat},${formData.locationData.lng}` : null,
        location_address: formData.locationData?.address || null
      };

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      // Store user share offline (in real app, prompt user to download/save)
      const userData = {
        userCode: cryptoData.userCode,
        userShare: cryptoData.sssShares[0], // User gets share index 0
        emailShare: cryptoData.sssShares[2], // Email share index 2
        verificationToken: result.verification_token
      };

      onSuccess(userData);

    } catch (error: any) {
      onError(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-black rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up for Blood Node</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm text-white font-medium mb-1">Password</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label className="block text-sm text-white font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            required
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm text-white font-medium mb-1">Blood Group</label>
          <select
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.bloodGroup}
            onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
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

        <LocationMapPicker
          onLocationSelect={(locationData) => {
            setFormData(prev => ({ 
              ...prev, 
              location: locationData.address,
              locationData: locationData
            }));
          }}
          value={formData.location}
          error={!formData.locationData && formData.location ? 'Please select a location from the map' : undefined}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="makePublic"
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.makePublic}
            onChange={(e) => setFormData(prev => ({ ...prev, makePublic: e.target.checked }))}
          />
          <label htmlFor="makePublic" className="text-sm text-white">
            Make blood group public for search
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium text-yellow-800">Important:</h3>
        <p className="text-sm text-yellow-700 mt-1">
          After signup, you'll receive a recovery share. Please save it securely - 
          it's needed to recover your account if you forget your password.
        </p>
      </div>
    </div>
  );
}
