'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Mail, User, Heart, AlertCircle, CheckCircle } from 'lucide-react';

interface FamilyInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const RELATION_TYPES = [
  'parent', 'child', 'sibling', 'spouse', 'grandparent', 'grandchild',
  'aunt', 'uncle', 'cousin', 'nephew', 'niece', 'other'
] as const;

const PERMISSIONS = [
  { id: 'blood_group', label: 'Blood Group', description: 'Share blood type information' },
  { id: 'location', label: 'Location', description: 'Share general location for emergency contact' },
  { id: 'contact', label: 'Contact Info', description: 'Share contact preferences' },
  { id: 'medical', label: 'Medical History', description: 'Share relevant medical information' }
] as const;

export function FamilyInviteModal({ isOpen, onClose, onSuccess, onError }: FamilyInviteModalProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite Family Member
            </CardTitle>
            <CardDescription>
              Send an invitation to join your Blood Node family network
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="family.member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Relation Selection */}
            <div className="space-y-2">
              <Label htmlFor="relation">Relationship *</Label>
              <select
                id="relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                required
                disabled={isLoading}
              >
                <option value="">Select relationship</option>
                {RELATION_TYPES.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>What information can they access?</Label>
              <div className="space-y-2">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                      className="mt-1 rounded"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <label htmlFor={permission.id} className="text-sm font-medium">
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Privacy Notice</p>
                  <p className="text-xs mt-1">
                    The invitation will be sent via email. They can accept or decline the invitation. 
                    You can modify permissions later in your family settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
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
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !email || !relation}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
