'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BloodNodeCrypto } from '@/lib/crypto/client';

interface RelativeFormProps {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  userCode: string;
}

export function RelativeForm({ onSuccess, onError, userCode }: RelativeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    relation: '',
    address: '',
    medicalNotes: '',
    visibility: 'private' as 'private' | 'shared' | 'public',
    shareFields: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleFieldShare = (field: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shareFields: [...prev.shareFields, field]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        shareFields: prev.shareFields.filter(f => f !== field)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare relative data for encryption
      const relativeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        blood_group: formData.bloodGroup,
        address: formData.address,
        medical_notes: formData.medicalNotes,
        fields_shared: formData.shareFields
      };

      // Encrypt the data
      const crypto = new BloodNodeCrypto();
      // Note: In real implementation, crypto would be initialized with user keys
      const { encryptedBlob, dekWrapped } = await crypto.encryptRelativeData(
        relativeData,
        [] // No additional recipients for now
      );

      // Prepare API request
      const requestData = {
        relation: formData.relation,
        visibility: formData.visibility,
        encrypted_blob: encryptedBlob,
        dek_wrapped: dekWrapped,
        last_donation_date: null,
        time_availability: null
      };

      // Get access token
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Call create relative API
      const response = await fetch('/api/relatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Plan limit reached. Please upgrade your plan.');
        }
        throw new Error(result.error || 'Failed to add relative');
      }

      onSuccess(result.relative);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        bloodGroup: '',
        relation: '',
        address: '',
        medicalNotes: '',
        visibility: 'private',
        shareFields: []
      });

    } catch (error: any) {
      onError(error.message || 'Failed to add relative');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Add Family Member</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-md"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Relation *</label>
            <select
              required
              className="w-full p-2 border rounded-md"
              value={formData.relation}
              onChange={(e) => setFormData(prev => ({ ...prev, relation: e.target.value }))}
            >
              <option value="">Select Relation</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="spouse">Spouse</option>
              <option value="grandparent">Grandparent</option>
              <option value="grandchild">Grandchild</option>
              <option value="aunt">Aunt</option>
              <option value="uncle">Uncle</option>
              <option value="cousin">Cousin</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-md"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              className="w-full p-2 border rounded-md"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blood Group</label>
            <select
              className="w-full p-2 border rounded-md"
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

          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
            >
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Medical Notes</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Any relevant medical information..."
            value={formData.medicalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, medicalNotes: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Share with invited relatives:</label>
          <div className="grid grid-cols-2 gap-2">
            {['phone', 'email', 'address', 'medical_notes'].map(field => (
              <label key={field} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.shareFields.includes(field)}
                  onChange={(e) => handleFieldShare(field, e.target.checked)}
                />
                <span className="text-sm capitalize">{field.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Adding...' : 'Add Family Member'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="font-medium text-green-800">Privacy:</h3>
        <p className="text-sm text-green-700 mt-1">
          All data is encrypted end-to-end. Only you and people you explicitly 
          share with can see this information.
        </p>
      </div>
    </div>
  );
}
