'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomSelect } from '@/components/ui/custom-select';
import { X, Mail, User, Heart, AlertCircle, CheckCircle } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FamilyInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const RELATION_TYPES: SelectOption[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'other', label: 'Other' }
];

const PERMISSIONS = [
  { id: 'blood_group', label: 'Blood Group', description: 'Share blood type information' },
  { id: 'location', label: 'Location', description: 'Share general location for emergency contact' },
  { id: 'contact', label: 'Contact Info', description: 'Share contact preferences' },
  { id: 'medical', label: 'Medical History', description: 'Share relevant medical information' }
] as const;

export function FamilyInviteModalAdvanced({ isOpen, onClose, onSuccess, onError }: FamilyInviteModalProps) {
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['blood_group', 'location', 'contact']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !relation) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          email,
          relation,
          permissions
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Invitation sent successfully to ${email}!`);
        onSuccess?.(data);
        
        // Reset form
        setEmail('');
        setRelation('');
        setPermissions(['blood_group', 'location', 'contact']);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to send invitation');
        onError?.(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: string) => {
    setPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-black border-b border-gray-800">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-white" />
              Invite Family Member
            </CardTitle>
            <CardDescription className="text-gray-300">
              Send an invitation to join your Blood Node family network
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="bg-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">
                Email Address *
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="family.member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-sm border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Relation Selection with Custom Select */}
            <div className="space-y-2">
              <Label htmlFor="relation" className="text-sm font-medium text-white">
                Relationship *
              </Label>
              <CustomSelect
                id="relation"
                options={RELATION_TYPES}
                value={relation}
                onChange={setRelation}
                placeholder="Select relationship"
                disabled={isLoading}
                required
                className="w-full"
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white">
                What information can they access?
              </Label>
              <div className="space-y-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors duration-200 bg-gray-900">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                      className="mt-1 w-4 h-4 text-white bg-gray-800 border-gray-600 rounded focus:ring-white focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <label htmlFor={permission.id} className="text-sm font-medium text-white cursor-pointer">
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-white mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white">Privacy Notice</p>
                  <p className="text-xs mt-1 text-gray-400">
                    The invitation will be sent via email. They can accept or decline the invitation. 
                    You can modify permissions later in your family settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white text-black hover:bg-gray-200 border border-white"
                disabled={isLoading || !email || !relation}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
