'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface InviteTokenInputProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function InviteTokenInput({ onSuccess, onError }: InviteTokenInputProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter an invitation token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/invites/accept-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteToken: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(`Successfully joined ${data.connection.inviter_name}'s family as their ${data.connection.relation}!`);
      setToken('');
      onSuccess?.(`Successfully joined ${data.connection.inviter_name}'s family!`);
      
      // Refresh the page to show updated family data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Accept Family Invitation
        </CardTitle>
        <p className="text-sm text-gray-400">
          Enter the invitation code you received via email to join a family network
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Invitation Code</Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter invitation code (e.g., ABC123XYZ)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="font-mono text-center text-lg tracking-wider"
            />
            <p className="text-xs text-gray-500">
              The invitation code was sent to your email when someone invited you to their family network
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading || !token.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting Invitation...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-md">
          <h4 className="font-medium text-blue-300 mb-2">How to get an invitation code:</h4>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
            <li>Ask a family member to invite you through their Blood Node dashboard</li>
            <li>Check your email for the invitation message</li>
            <li>Copy the invitation code from the email</li>
            <li>Paste it above and click "Accept Invitation"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
