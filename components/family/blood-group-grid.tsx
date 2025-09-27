'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Phone, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';

interface FamilyMember {
  id: string;
  user_code: string;
  name: string;
  blood_group: string;
  location: string;
  phone: string;
  relation: string;
  last_donation_date?: string;
  time_availability?: {
    from: string;
    to: string;
    tz: string;
  };
  is_available: boolean;
  created_at: string;
}

interface BloodGroupData {
  blood_group: string;
  members: FamilyMember[];
  count: number;
}

interface BloodGroupGridProps {
  onInviteClick?: () => void;
}

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': 'bg-red-100 border-red-300 text-red-800',
  'A-': 'bg-red-50 border-red-200 text-red-700',
  'B+': 'bg-blue-100 border-blue-300 text-blue-800',
  'B-': 'bg-blue-50 border-blue-200 text-blue-700',
  'AB+': 'bg-purple-100 border-purple-300 text-purple-800',
  'AB-': 'bg-purple-50 border-purple-200 text-purple-700',
  'O+': 'bg-green-100 border-green-300 text-green-800',
  'O-': 'bg-green-50 border-green-200 text-green-700',
};

export function BloodGroupGrid({ onInviteClick }: BloodGroupGridProps) {
  const [bloodGroupData, setBloodGroupData] = useState<BloodGroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/family/blood-groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch family data');
      }

      const data = await response.json();
      setBloodGroupData(data.blood_groups || []);
    } catch (err) {
      console.error('Error fetching family data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAvailability = (availability?: { from: string; to: string; tz: string }) => {
    if (!availability) return 'Not specified';
    return `${availability.from} - ${availability.to} (${availability.tz})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading family data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Family Data</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchFamilyData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Family Blood Network</h2>
          <p className="text-gray-400">View your family members organized by blood group</p>
        </div>
        {onInviteClick && (
          <Button onClick={onInviteClick} size="lg">
            <Users className="h-4 w-4 mr-2" />
            Invite Family Member
          </Button>
        )}
      </div>

      {/* Blood Group Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bloodGroupData.map((group) => (
          <Card 
            key={group.blood_group} 
            className={`${BLOOD_GROUP_COLORS[group.blood_group] || 'bg-gray-100 border-gray-300 text-gray-800'} min-h-[200px]`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{group.blood_group}</span>
                <Badge variant="secondary" className="bg-white/20 text-current">
                  {group.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {group.count === 0 ? (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">No family members</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {group.members.map((member) => (
                    <div key={member.id} className="bg-white/20 rounded-lg p-3 text-sm">
                      <div className="font-medium mb-1">{member.name}</div>
                      <div className="space-y-1 text-xs opacity-90">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="capitalize">{member.relation}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{member.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last donation: {formatDate(member.last_donation_date)}</span>
                        </div>
                        {member.time_availability && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{formatTimeAvailability(member.time_availability)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={member.is_available ? "default" : "secondary"}
                            className={`text-xs ${member.is_available ? 'bg-green-500' : 'bg-yellow-500'}`}
                          >
                            {member.is_available ? 'Available' : 'Recently Donated'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Family Summary</h3>
            <p className="text-gray-400">
              Total family members: {bloodGroupData.reduce((sum, group) => sum + group.count, 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Available for donation: {bloodGroupData.reduce((sum, group) => 
                sum + group.members.filter(m => m.is_available).length, 0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
