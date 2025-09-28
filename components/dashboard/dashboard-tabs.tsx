'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DonorSearch } from '@/components/donors/donor-search';
import { EmergencyAlert } from '@/components/emergency/emergency-alert';
import { FamilyInviteModal } from '@/components/family/family-invite-modal';
import { BloodGroupGrid } from '@/components/family/blood-group-grid';
import { InviteTokenInput } from '@/components/family/invite-token-input';
import { ProfileForm } from '@/components/profile/profile-form';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  MapPin, 
  Heart, 
  Shield,
  Activity,
  Mail
} from 'lucide-react';

interface DashboardTabsProps {
  user: {
    id: string;
    user_code: string;
    email_verified: boolean;
    public_profile: boolean;
    plan: string;
    location_address?: string;
  };
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function DashboardTabs({ user, onError, onSuccess }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'emergency' | 'family' | 'profile'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'search', label: 'Find Donors', icon: Search },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'profile', label: 'Profile', icon: Shield }
  ];

  const handleInviteSuccess = (data: any) => {
    onSuccess?.('Family invitation sent successfully!');
    setShowInviteModal(false);
  };

  const handleInviteError = (error: string) => {
    onError?.(error);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Code</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{user.user_code}</div>
                  <p className="text-xs text-muted-foreground">Share with family members</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plan</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{user.plan}</div>
                  <p className="text-xs text-muted-foreground">Current subscription</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <p className="text-xs text-muted-foreground">Email verified</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Location</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.location_address ? (
                      <span className="text-green-600 truncate" title={user.location_address}>
                        {user.location_address.length > 20 
                          ? `${user.location_address.substring(0, 20)}...` 
                          : user.location_address
                        }
                      </span>
                    ) : (
                      <span className="text-gray-500">Not Set</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.location_address ? 'Location configured' : 'Update in settings'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Family Network
                  </CardTitle>
                  <CardDescription>
                    Manage your family connections and blood network
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-4">No family members connected yet</p>
                    <Button 
                      onClick={() => setShowInviteModal(true)}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite Family Member
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('search')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Blood Donors
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('emergency')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Emergency Alert
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('family')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Family
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('profile')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Blood Donors
                </CardTitle>
                <CardDescription>
                  Search for compatible blood donors in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DonorSearch
                  onError={onError || (() => {})}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'emergency':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Blood Alert
                </CardTitle>
                <CardDescription>
                  Send urgent alerts to nearby blood donors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmergencyAlert
                  onAlertSent={(alert) => {
                    console.log('Emergency alert sent:', alert);
                    onSuccess?.(`Emergency alert sent to ${alert.donors_notified} donors`);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            {/* Blood Group Grid */}
            <BloodGroupGrid onInviteClick={() => setShowInviteModal(true)} />
            
            {/* Invite Token Input */}
            <InviteTokenInput 
              onSuccess={onSuccess}
              onError={onError}
            />
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <ProfileForm
              onSuccess={onSuccess || (() => {})}
              onError={onError || (() => {})}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Family Invite Modal */}
      <FamilyInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        onError={handleInviteError}
      />
    </div>
  );
}
