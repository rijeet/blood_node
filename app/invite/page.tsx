'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InviteData {
  id: string;
  inviter_user_code: string;
  inviter_public_key: string;
  relation: string;
  status: string;
  created_at: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }

    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      // First try the new invite system
      let response = await fetch(`/api/invites/${token}`);
      let data = await response.json();

      if (response.ok) {
        setInvite(data.invite);
        return;
      }

      // If not found, try the old verification token system
      response = await fetch(`/api/verification-tokens/${token}`);
      data = await response.json();

      if (response.ok && data.token_type === 'family_invite') {
        // Convert verification token to invite format
        const inviteData = data.invite_data;
        setInvite({
          id: data._id,
          inviter_user_code: inviteData.inviter_name || 'Unknown',
          inviter_public_key: '', // Not available in verification tokens
          relation: inviteData.relation,
          status: 'pending',
          created_at: data.created_at
        });
        return;
      }

      throw new Error(data.error || 'Failed to fetch invite');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dek_wrapped_for_inviter: 'placeholder-dek-wrapped', // This would be generated client-side
          share_fields: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication required - redirect to login
          setActionMessage('You need to be logged in to accept this invitation. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/?login=true&returnUrl=' + encodeURIComponent(window.location.href);
          }, 2000);
          return;
        }
        throw new Error(data.error || 'Failed to accept invite');
      }

      setActionMessage('Invite accepted successfully!');
      setInvite(prev => prev ? { ...prev, status: 'accepted' } : null);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication required - redirect to login
          setActionMessage('You need to be logged in to decline this invitation. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/?login=true&returnUrl=' + encodeURIComponent(window.location.href);
          }, 2000);
          return;
        }
        throw new Error(data.error || 'Failed to decline invite');
      }

      setActionMessage('Invite declined');
      setInvite(prev => prev ? { ...prev, status: 'declined' } : null);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-600 text-6xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Invite Data</h1>
            <p className="text-gray-600 mb-6">Unable to load invite information</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isProcessed = invite.status !== 'pending';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🩸</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Invitation</h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join a blood network family by user{' '}
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {invite.inviter_user_code}
            </span>
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Invitation Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Relation:</strong> {invite.relation}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invite.status}
                </span>
              </p>
              <p><strong>Invited:</strong> {new Date(invite.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {actionMessage && (
            <div className={`p-3 rounded-lg mb-4 ${
              actionMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {actionMessage}
            </div>
          )}

          {!isProcessed ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">🔐 Authentication Required</p>
                <p className="text-sm text-blue-700">
                  To accept or decline this invitation, you need to be logged in to your Blood Node account. 
                  If you don't have an account, you'll need to create one first.
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? 'Accepting...' : 'Accept Invitation'}
                </Button>
                <Button 
                  onClick={handleDecline}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  {actionLoading ? 'Declining...' : 'Decline'}
                </Button>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Don't have an account?{' '}
                  <Link href="/" className="text-red-600 hover:underline font-medium">
                    Sign up here
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <Link href="/?login=true" className="text-red-600 hover:underline font-medium">
                    Log in here
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                This invitation has already been {invite.status}.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invite...</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
