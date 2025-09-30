'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyAlert {
  _id: string;
  serial_number: string;
  blood_type: string;
  location_address?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  patient_condition?: string;
  required_bags: number;
  hemoglobin_level?: string;
  donation_place?: string;
  donation_date?: string;
  donation_time?: string;
  contact_info?: string;
  reference?: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  donors_notified: number;
  donors_responded: number;
  created_at: string;
  expires_at: string;
  selected_donor_id?: string;
}

export default function EmergencyDetailsPage() {
  const params = useParams();
  const serialNumber = params.serial as string;
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmergencyAlert();
  }, [serialNumber]);

  const fetchEmergencyAlert = async () => {
    try {
      const response = await fetch(`/api/emergency/alert/serial/${serialNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Emergency alert not found');
      }
      const data = await response.json();
      setAlert(data.alert);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emergency alert');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading emergency details...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The emergency alert you are looking for does not exist.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const urgencyColors = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900'
  };

  const urgencyEmojis = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨'
  };

  const isExpired = new Date(alert.expires_at) < new Date();
  const isFulfilled = alert.status === 'fulfilled';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Emergency Alert Details
          </h1>
          <p className="text-lg text-gray-600">
            Serial Number: <span className="font-mono font-bold text-blue-600">{alert.serial_number}</span>
          </p>
        </div>

        {/* Status Banner */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{urgencyEmojis[alert.urgency_level]}</span>
              <div>
                <Badge className={urgencyColors[alert.urgency_level]}>
                  {alert.urgency_level.toUpperCase()} PRIORITY
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {isExpired ? 'Expired' : isFulfilled ? 'Fulfilled' : 'Active'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Patient Information */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            💁‍♂️ Patient's Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group Required *
              </label>
              <p className="text-lg font-bold text-red-600">{alert.blood_type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Blood
              </label>
              <p className="text-lg font-semibold">{alert.required_bags} bag(s) *</p>
            </div>
            {alert.patient_condition && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient's Condition
                </label>
                <p className="text-gray-900">{alert.patient_condition}</p>
              </div>
            )}
            {alert.hemoglobin_level && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hemoglobin Level
                </label>
                <p className="text-gray-900">{alert.hemoglobin_level}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Donation Details */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🏥 Donation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alert.donation_place && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Donation Place
                </label>
                <p className="text-gray-900">{alert.donation_place}</p>
              </div>
            )}
            {alert.donation_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📆 Donation Date
                </label>
                <p className="text-gray-900">{alert.donation_date}</p>
              </div>
            )}
            {alert.donation_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⏰ Donation Time
                </label>
                <p className="text-gray-900">{alert.donation_time}</p>
              </div>
            )}
            {alert.contact_info && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ☎️ Contact
                </label>
                <p className="text-gray-900">{alert.contact_info}</p>
              </div>
            )}
            {alert.reference && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📖 Reference
                </label>
                <p className="text-gray-900">{alert.reference}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Location Information */}
        {alert.location_address && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              📍 Location
            </h2>
            <p className="text-gray-900">{alert.location_address}</p>
          </Card>
        )}

        {/* Response Statistics */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            📊 Response Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{alert.donors_notified}</p>
              <p className="text-sm text-gray-600">Donors Notified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{alert.donors_responded}</p>
              <p className="text-sm text-gray-600">Donors Responded</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {alert.donors_notified > 0 ? Math.round((alert.donors_responded / alert.donors_notified) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Response Rate</p>
            </div>
          </div>
        </Card>

        {/* Status Message */}
        {(isExpired || isFulfilled) && (
          <Card className="p-6 bg-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {isFulfilled ? '✅' : '⏰'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isFulfilled ? 'Emergency Fulfilled' : 'Emergency Expired'}
              </h2>
              <p className="text-gray-600">
                {isFulfilled 
                  ? 'This emergency has been resolved and a donor has been selected.'
                  : 'This emergency alert has expired and is no longer active.'
                }
              </p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8">
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
