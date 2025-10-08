'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Heart,
  Calendar
} from 'lucide-react';

interface EmergencyAlert {
  _id: string;
  blood_type: string;
  location_address?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  patient_condition?: string;
  required_bags: number;
  status: 'active' | 'in_progress' | 'fulfilled' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
  serial_number?: string;
}

interface EmergencyResponse {
  _id: string;
  responder_user_code: string;
  responder_name: string;
  responder_blood_type: string;
  responder_location: {
    address: string;
    geohash: string;
    coordinates: [number, number];
  };
  response_message?: string;
  status: 'pending' | 'selected' | 'rejected' | 'completed' | 'cancelled';
  can_donate_immediately: boolean;
  available_times?: string[];
  contact_preference: 'phone' | 'email' | 'both';
  created_at: string;
  distance_km?: number;
  responder_profile: {
    name: string;
    email: string;
    phone?: string;
    blood_type: string;
    location_address: string;
    last_donation_date?: string;
    public_profile: boolean;
  };
}

interface ResponseStats {
  total_responses: number;
  pending_responses: number;
  selected_responses: number;
  completed_responses: number;
  rejected_responses: number;
}

export default function ManageEmergencyPage() {
  const params = useParams();
  const alertId = params.id as string;
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [responses, setResponses] = useState<EmergencyResponse[]>([]);
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    fetchEmergencyData();
  }, [alertId]);

  const fetchEmergencyData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch alert details
      const alertResponse = await fetch(`/api/emergency/alert/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!alertResponse.ok) {
        throw new Error('Failed to fetch emergency alert');
      }
      
      const alertData = await alertResponse.json();
      setAlert(alertData.alert);

      // Fetch responses
      console.log('Fetching responses for alert ID:', alertId);
      const responsesResponse = await fetch(`/api/emergency/responses?emergency_alert_id=${alertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Responses response status:', responsesResponse.status);
      if (!responsesResponse.ok) {
        const errorText = await responsesResponse.text();
        console.error('Responses API error:', errorText);
        throw new Error(`Failed to fetch responses: ${responsesResponse.status} ${errorText}`);
      }
      
      const responsesData = await responsesResponse.json();
      console.log('Responses data:', responsesData);
      setResponses(responsesData.responses || []);
      setStats(responsesData.statistics);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResponder = async (responseId: string) => {
    setSelecting(responseId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/emergency/responses/${responseId}/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to select responder');
      }

      const result = await response.json();
      if (result.success) {
        window.alert('Responder selected successfully! All other responses have been cancelled.');
        fetchEmergencyData(); // Refresh data
      }
    } catch (err) {
      window.alert(`Failed to select responder: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setSelecting(null);
    }
  };

  const handleCompleteDonation = async (responseId: string) => {
    setCompleting(responseId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/emergency/responses/${responseId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete donation');
      }

      const result = await response.json();
      if (result.success) {
        window.alert('Donation completed successfully!');
        fetchEmergencyData(); // Refresh data
      }
    } catch (err) {
      window.alert(`Failed to complete donation: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setCompleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'selected': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-200 text-red-900';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-blue-200">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Emergency Management</h2>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Emergency Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {error || 'The emergency alert you are looking for does not exist or you do not have permission to view it.'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-blue-200 mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              🚨 Emergency Response Management
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

        {/* Emergency Details */}
        <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-red-200 rounded-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl">🩸</span>
            </span>
            Emergency Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                🩸 Blood Type Required
              </label>
              <p className="text-3xl font-bold text-red-600">{alert.blood_type}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                📦 Required Bags
              </label>
              <p className="text-3xl font-bold text-orange-600">{alert.required_bags}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                🚨 Urgency Level
              </label>
              <Badge className={`px-4 py-2 text-lg font-bold rounded-full ${getUrgencyColor(alert.urgency_level)}`}>
                {alert.urgency_level.toUpperCase()}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Response Statistics */}
        {stats && (
          <Card className="mb-8 p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-green-200 rounded-2xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-white" />
              </span>
              Response Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total_responses}</p>
                <p className="text-sm font-semibold text-gray-700">Total Responses</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_responses}</p>
                <p className="text-sm font-semibold text-gray-700">Pending</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.selected_responses}</p>
                <p className="text-sm font-semibold text-gray-700">Selected</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.completed_responses}</p>
                <p className="text-sm font-semibold text-gray-700">Completed</p>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 text-center">
                <p className="text-3xl font-bold text-red-600">{stats.rejected_responses}</p>
                <p className="text-sm font-semibold text-gray-700">Rejected</p>
              </div>
            </div>
          </Card>
        )}

        {/* Responses List */}
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200 rounded-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
              <Heart className="h-6 w-6 text-white" />
            </span>
            Responders ({responses.length})
          </h2>
          
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No responses yet</h3>
              <p className="text-lg text-gray-500">Responses will appear here as people respond to your emergency alert.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response) => (
                <div
                  key={response._id}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    response.status === 'selected' 
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-lg' 
                      : response.status === 'completed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-lg'
                      : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {response.responder_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{response.responder_name}</h3>
                        <p className="text-gray-600">User Code: {response.responder_user_code}</p>
                      </div>
                    </div>
                    <Badge className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(response.status)}`}>
                      {response.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 border-2 border-red-200">
                      <p className="text-sm font-semibold text-gray-700">Blood Type</p>
                      <p className="text-lg font-bold text-red-600">{response.responder_blood_type}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border-2 border-green-200">
                      <p className="text-sm font-semibold text-gray-700">Can Donate Now</p>
                      <p className="text-lg font-bold text-green-600">
                        {response.can_donate_immediately ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border-2 border-purple-200">
                      <p className="text-sm font-semibold text-gray-700">Distance</p>
                      <p className="text-lg font-bold text-purple-600">
                        {response.distance_km ? `${response.distance_km.toFixed(1)} km` : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-200 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Location</p>
                    <p className="text-gray-800">{response.responder_location.address}</p>
                  </div>

                  {response.response_message && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Message</p>
                      <p className="text-gray-800">{response.response_message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(response.created_at).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {response.responder_profile.phone || 'Not provided'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {response.responder_profile.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {response.status === 'pending' && (
                        <Button
                          onClick={() => handleSelectResponder(response._id)}
                          disabled={selecting === response._id}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {selecting === response._id ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Selecting...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Select This Responder
                            </div>
                          )}
                        </Button>
                      )}
                      
                      {response.status === 'selected' && (
                        <Button
                          onClick={() => handleCompleteDonation(response._id)}
                          disabled={completing === response._id}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {completing === response._id ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Completing...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Mark as Completed
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
