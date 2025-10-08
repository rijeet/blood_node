'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyAlert {
  _id: string;
  blood_type: string;
  location_address?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  patient_condition?: string;
  required_bags: number;
  hemoglobin_level?: string;
  donation_place?: string;
  donation_date?: string;
  donation_time_start?: string;
  donation_time_end?: string;
  contact_info?: string;
  reference?: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
  serial_number?: string;
}

export default function EmergencyRespondPage() {
  const params = useParams();
  const alertId = params.id as string;
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchEmergencyAlert();
  }, [alertId]);

  const fetchEmergencyAlert = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/emergency/alert/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleRespond = async (canHelp: boolean) => {
    if (!alert) return;
    
    setResponding(true);
    try {
      if (canHelp) {
        // Create a response to the emergency
        const response = await fetch('/api/emergency/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            emergency_alert_id: alertId,
            response_message: 'I can help with this emergency',
            can_donate_immediately: true,
            contact_preference: 'both'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to respond to emergency');
        }

        const result = await response.json();
        if (result.success) {
          window.alert('Response submitted successfully! The alert creator will review your response and contact you if selected.');
          // Refresh the alert to show updated status
          fetchEmergencyAlert();
        }
      } else {
        // Just acknowledge that they can't help (no API call needed)
        window.alert('Thank you for your honesty. Your response has been noted.');
      }
    } catch (err) {
      window.alert(`Failed to respond to emergency: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-red-200">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Emergency Alert</h2>
          <p className="text-gray-600">Please wait while we fetch the emergency details...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-red-200 rounded-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-4xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Emergency Alert Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {error || 'The emergency alert you are looking for does not exist or has expired.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-red-200 mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
              🚨 Emergency Blood Donation Request
            </h1>
            {alert.serial_number && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Serial Number:</span> 
                  <span className="font-mono font-bold text-blue-600 ml-2 text-xl">{alert.serial_number}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-red-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">{urgencyEmojis[alert.urgency_level]}</span>
              </div>
              <div>
                <Badge className={`${urgencyColors[alert.urgency_level]} px-6 py-3 text-lg font-bold rounded-full shadow-lg`}>
                  {alert.urgency_level.toUpperCase()} PRIORITY
                </Badge>
                <p className="text-lg text-gray-700 mt-2 font-semibold">
                  Status: <span className={isExpired ? 'text-red-600' : isFulfilled ? 'text-green-600' : 'text-blue-600'}>
                    {isExpired ? 'Expired' : isFulfilled ? 'Fulfilled' : 'Active'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200">
              <p className="text-sm text-gray-600 font-semibold">Created</p>
              <p className="font-bold text-lg text-gray-800">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Patient Information */}
        <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-blue-200 rounded-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl">💁‍♂️</span>
            </span>
            Patient's Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                🩸 Blood Group Required *
              </label>
              <p className="text-3xl font-bold text-red-600">{alert.blood_type}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                📦 Required Blood Bags
              </label>
              <p className="text-3xl font-bold text-orange-600">{alert.required_bags} bag(s) *</p>
            </div>
            {alert.patient_condition && (
              <div className="md:col-span-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  🏥 Patient's Condition
                </label>
                <p className="text-lg text-gray-800">{alert.patient_condition}</p>
              </div>
            )}
            {alert.hemoglobin_level && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  🔬 Hemoglobin Level
                </label>
                <p className="text-xl font-bold text-green-600">{alert.hemoglobin_level}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Donation Details */}
        <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-green-200 rounded-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl">🏥</span>
            </span>
            Hospital & Donation Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alert.donation_place && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  🏥 Hospital Name
                </label>
                <p className="text-xl font-bold text-blue-600">{alert.donation_place}</p>
              </div>
            )}
            {alert.donation_date && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  📆 Donation Date
                </label>
                <p className="text-xl font-bold text-purple-600">{alert.donation_date}</p>
              </div>
            )}
            {alert.donation_time_start && alert.donation_time_end && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  ⏰ Time Required
                </label>
                <p className="text-xl font-bold text-orange-600">
                  {alert.donation_time_start} - {alert.donation_time_end}
                </p>
              </div>
            )}
            {alert.contact_info && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  ☎️ Contact Information
                </label>
                <p className="text-xl font-bold text-green-600">{alert.contact_info}</p>
              </div>
            )}
            {alert.reference && (
              <div className="md:col-span-2 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-200">
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  📖 Reference Details
                </label>
                <p className="text-lg text-gray-800">{alert.reference}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Location Information */}
        {alert.location_address && (
          <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200 rounded-2xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-xl">📍</span>
              </span>
              Location Details
            </h2>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <p className="text-xl font-bold text-purple-600">{alert.location_address}</p>
              <p className="text-lg text-gray-600 mt-2">Coordinates: 23.8200, 90.3600</p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        {!isExpired && !isFulfilled && (
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-red-200 rounded-2xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-8 text-center">
              🚨 Can You Help Save a Life?
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {responding ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    Responding...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    Yes, I Can Help!
                  </div>
                )}
              </Button>
              <Button
                onClick={() => handleRespond(false)}
                disabled={responding}
                className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {responding ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    Responding...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">❌</span>
                    Cannot Help Right Now
                  </div>
                )}
              </Button>
            </div>
            <p className="text-center text-lg text-gray-700 mt-6 font-semibold">
              Your response helps us coordinate the emergency response effectively and save lives.
            </p>
          </Card>
        )}

        {(isExpired || isFulfilled) && (
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-gray-200 rounded-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl">
                  {isFulfilled ? '✅' : '⏰'}
                </span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-4">
                {isFulfilled ? 'Emergency Fulfilled' : 'Emergency Expired'}
              </h2>
              <p className="text-xl text-gray-700 font-semibold">
                {isFulfilled 
                  ? 'This emergency has been resolved. Thank you for your interest in helping.'
                  : 'This emergency alert has expired and is no longer active.'
                }
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
