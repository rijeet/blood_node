'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Hospital, 
  Send,
  Clock,
  Users,
  Heart,
  Navigation
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { LocationPicker } from '@/components/location/location-picker';
import { notificationStorage } from '@/lib/services/notification-storage';

interface EmergencyAlertProps {
  onAlertSent?: (alert: any) => void;
  className?: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const PATIENT_CONDITIONS = [
  'Operation',
  'Thalassemia', 
  'Accident',
  'Delivery Patient (Maternity Case)'
] as const;
const URGENCY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'medium', label: 'Medium Priority', color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'high', label: 'High Priority', color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'critical', label: 'CRITICAL - Life Threatening', color: 'text-red-800', bg: 'bg-red-100' }
] as const;

export function EmergencyAlert({ onAlertSent, className }: EmergencyAlertProps) {
  const [bloodType, setBloodType] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState('high');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // New emergency form fields
  const [requiredBags, setRequiredBags] = useState<string>('');
  const [hemoglobinLevel, setHemoglobinLevel] = useState<string>('');
  const [donationPlace, setDonationPlace] = useState<string>('');
  const [donationDate, setDonationDate] = useState<string>('');
  const [donationTimeStart, setDonationTimeStart] = useState<string>('');
  const [donationTimeEnd, setDonationTimeEnd] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [patientCondition, setPatientCondition] = useState<string>('');

  // Get user's current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          const data = await response.json();
          
          let address = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          if (data && data.display_name) {
            address = data.display_name;
          }
          
          setLocation({
            lat: lat,
            lng: lng,
            address: address
          });
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          setLocation({
            lat: lat,
            lng: lng,
            address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          });
        }
        
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access to send emergency alerts.';
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

  const sendEmergencyAlert = async () => {
    if (!bloodType || !location) {
      setError('Please select a blood type and location');
      return;
    }

    if (!requiredBags) {
      setError('Please specify the number of blood bags required');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await apiClient.post('/api/emergency/alert', {
          blood_type: bloodType,
          lat: location.lat,
          lng: location.lng,
          urgency_level: urgencyLevel,
          // New emergency fields
          required_bags: parseInt(requiredBags),
          hemoglobin_level: hemoglobinLevel || undefined,
          donation_place: donationPlace || undefined,
          donation_date: donationDate || undefined,
          donation_time_start: donationTimeStart || undefined,
          donation_time_end: donationTimeEnd || undefined,
          contact_info: contactInfo || undefined,
          reference: reference || undefined,
          patient_condition: patientCondition || undefined
        });

      if (data.success) {
        // Store notification persistently
        notificationStorage.addEmergencyAlertNotification(data.alert_id, data.donors_notified);
        
        setSuccess(`Emergency alert sent successfully! ${data.donors_notified} donors notified. Alert ID: ${data.alert_id}. You can manage responses and select donors from the management page.`);
        onAlertSent?.(data);
        // Reset form
        setBloodType('');
        setLocation(null);
        setRequiredBags('');
        setHemoglobinLevel('');
        setDonationPlace('');
        setDonationDate('');
        setDonationTimeStart('');
        setDonationTimeEnd('');
        setContactInfo('');
        setReference('');
        setPatientCondition('');
      } else {
        setError(data.error || 'Failed to send emergency alert');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'low': return '🟡';
      case 'medium': return '🟠';
      case 'high': return '🔴';
      case 'critical': return '🚨';
      default: return '🔴';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Emergency Blood Alert
        </CardTitle>
        <CardDescription>
          Send an urgent alert to nearby blood donors. Use only for genuine emergencies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Patient's Condition Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💁‍♂️ Patient's Information
            </h3>
          </div>

          {/* Blood Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span className="text-red-500">🔴</span>
              <span>Blood Group Required *</span>
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {BLOOD_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={bloodType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBloodType(type)}
                  className={`text-sm font-medium transition-all duration-200 ${
                    bloodType === type 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg transform scale-105' 
                      : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Patient's Condition */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span className="text-red-500">💁‍♂️</span>
              <span>Patient's Condition</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Select a condition or enter custom..."
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                list="patient-conditions"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <datalist id="patient-conditions">
                {PATIENT_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Required Blood Bags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span className="text-red-500">💉</span>
              <span>Required Blood: ___ bag(s) *</span>
            </Label>
            <Input
              type="number"
              min="1"
              max="20"
              placeholder="Enter number of blood bags needed"
              value={requiredBags}
              onChange={(e) => setRequiredBags(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Hemoglobin Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span className="text-red-500">🩸</span>
              <span>Hemoglobin Level</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g., 7.5 g/dL"
              value={hemoglobinLevel}
              onChange={(e) => setHemoglobinLevel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Donation Details Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Hospital className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🏥 Donation Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donation Place */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <span className="text-blue-500">🏢</span>
                <span>Donation Place</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g., General Hospital, Blood Bank"
                value={donationPlace}
                onChange={(e) => setDonationPlace(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Donation Date */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <span className="text-blue-500">📆</span>
                <span>Donation Date</span>
              </Label>
              <Input
                type="date"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Donation Time Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <span className="text-blue-500">⏰</span>
                <span>Donation Time Range</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">From</Label>
                  <Input
                    type="time"
                    value={donationTimeStart}
                    onChange={(e) => setDonationTimeStart(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Start time"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">To</Label>
                  <Input
                    type="time"
                    value={donationTimeEnd}
                    onChange={(e) => setDonationTimeEnd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="End time"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                e.g., 5:00 PM to 6:00 PM
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <span className="text-blue-500">☎️</span>
                <span>Contact</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g., +1-555-123-4567"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <span className="text-blue-500">📖</span>
              <span>Reference</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g., Dr. Smith, Case #12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Urgency Level */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <span className="text-orange-500">⚠️</span>
            <span>Urgency Level *</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {URGENCY_LEVELS.map((level) => (
              <Button
                key={level.value}
                variant={urgencyLevel === level.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUrgencyLevel(level.value)}
                className={`text-sm font-medium transition-all duration-200 ${
                  urgencyLevel === level.value 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg transform scale-105' 
                    : `${level.color} hover:bg-orange-50 hover:border-orange-300`
                }`}
              >
                {getUrgencyIcon(level.value)} {level.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <Label>Emergency Location *</Label>
          
          {/* Automatic Location Detection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {location ? 'Location Ready' : 'Getting Location...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {location ? 
                      (location.address || `Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`) :
                      'Requesting permission to access your location'
                    }
                  </p>
                </div>
              </div>
              
              {locationLoading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Getting location...</span>
                </div>
              )}
              
              {locationError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Retry Location
                </Button>
              )}
            </div>

            {locationError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
              </div>
            )}

            {location && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Location acquired successfully! Emergency alert will be sent from your current location.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Location Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2">OR</span>
              <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Location Manually
              </Label>
              <LocationPicker
                onLocationSelect={(locationData: any) => {
                  setLocation({
                    lat: locationData.lat,
                    lng: locationData.lng,
                    address: locationData.address
                  });
                }}
                initialLocation={location || undefined}
                hideHeader={true}
              />
            </div>
          </div>
        </div>



        {/* Emergency Notice */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Emergency Alert Notice</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• This will send urgent notifications to all emergency donors in the area</li>
                <li>• Only use for genuine medical emergencies requiring immediate blood</li>
                <li>• Donors will be able to respond directly through the app</li>
                <li>• False alerts may result in account restrictions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={sendEmergencyAlert}
          disabled={isSending || !bloodType || !location || locationLoading || !requiredBags}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          <Send className="h-5 w-5 mr-2" />
          {isSending ? 'Sending Alert...' : 
           locationLoading ? 'Getting Location...' :
           !location ? 'Location Required' :
           !requiredBags ? 'Blood Bags Required' :
           'Send Emergency Alert'}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{success}</span>
            </div>
            <Button
              onClick={() => {
                // Extract alert ID from the success message or use the last created alert
                const alertId = success.includes('alert_id') ? 
                  success.match(/alert_id: ([a-f0-9]+)/)?.[1] : 
                  null;
                if (alertId) {
                  window.open(`/emergency/manage/${alertId}`, '_blank');
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Responses
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
