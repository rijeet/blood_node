'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationPicker } from '@/components/location/location-picker';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Hospital, 
  Send,
  Clock,
  Users,
  Heart
} from 'lucide-react';

interface EmergencyAlertProps {
  onAlertSent?: (alert: any) => void;
  className?: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const URGENCY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'medium', label: 'Medium Priority', color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'high', label: 'High Priority', color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'critical', label: 'CRITICAL - Life Threatening', color: 'text-red-800', bg: 'bg-red-100' }
] as const;

export function EmergencyAlert({ onAlertSent, className }: EmergencyAlertProps) {
  const [bloodType, setBloodType] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [radius, setRadius] = useState(25);
  const [urgencyLevel, setUrgencyLevel] = useState('high');
  const [hospitalName, setHospitalName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendEmergencyAlert = async () => {
    if (!bloodType || !location) {
      setError('Please select a blood type and location');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          blood_type: bloodType,
          lat: location.lat,
          lng: location.lng,
          radius_km: radius,
          urgency_level: urgencyLevel,
          hospital_name: hospitalName || undefined,
          contact_phone: contactPhone || undefined,
          additional_notes: additionalNotes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Emergency alert sent successfully! ${data.donors_notified} donors notified.`);
        onAlertSent?.(data);
        // Reset form
        setBloodType('');
        setLocation(null);
        setHospitalName('');
        setContactPhone('');
        setAdditionalNotes('');
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
      <CardContent className="space-y-6">
        {/* Blood Type Selection */}
        <div className="space-y-2">
          <Label>Blood Type Required *</Label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((type) => (
              <Button
                key={type}
                variant={bloodType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBloodType(type)}
                className="text-xs"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div className="space-y-2">
          <Label>Urgency Level *</Label>
          <div className="grid grid-cols-2 gap-2">
            {URGENCY_LEVELS.map((level) => (
              <Button
                key={level.value}
                variant={urgencyLevel === level.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUrgencyLevel(level.value)}
                className={`text-xs ${urgencyLevel === level.value ? '' : level.color}`}
              >
                {getUrgencyIcon(level.value)} {level.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-2">
          <Label>Emergency Location *</Label>
          <LocationPicker
            onLocationSelect={setLocation}
            initialLocation={location || undefined}
          />
        </div>

        {/* Search Radius */}
        <div className="space-y-2">
          <Label htmlFor="radius">Alert Radius (km)</Label>
          <Input
            id="radius"
            type="number"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-32"
          />
          <p className="text-xs text-gray-500">
            Larger radius = more donors, but may include those further away
          </p>
        </div>

        {/* Hospital Information */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Hospital className="h-4 w-4" />
            Hospital Information (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital Name</Label>
              <Input
                id="hospital"
                placeholder="e.g., General Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                placeholder="e.g., +1-555-123-4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Information</Label>
          <textarea
            id="notes"
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={3}
            placeholder="Any additional details about the emergency, special requirements, etc."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
          />
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
          disabled={isSending || !bloodType || !location}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending Alert...' : 'Send Emergency Alert'}
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
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">25km</div>
            <div className="text-xs text-gray-600">Default Radius</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">~50</div>
            <div className="text-xs text-gray-600">Emergency Donors</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
