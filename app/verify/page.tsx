'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      handleVerification(tokenParam);
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [searchParams]);

  const handleVerification = async (verificationToken: string) => {
    setStatus('loading');
    setMessage('Verifying your email...');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
      } else {
        setStatus('error');
        setMessage(result.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      await handleVerification(token.trim());
    }
  };

  const handleResendVerification = async () => {
    setStatus('loading');
    setMessage('Resending verification email...');

    try {
      // This would need to be implemented - for now just show a message
      setStatus('error');
      setMessage('Resend functionality not yet implemented. Please contact support.');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-black rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🩸 Blood Node</h1>
            <h2 className="text-xl text-gray-300">Email Verification</h2>
          </div>

          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-white mb-2">Verification Successful!</h3>
              <p className="text-gray-300 mb-6">{message}</p>
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h3 className="text-xl font-semibold text-white mb-2">Verification Failed</h3>
              <p className="text-gray-300 mb-6">{message}</p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Resend Verification Email
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {status === 'idle' && !token && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Enter Verification Token</h3>
              <p className="text-gray-300 mb-6">
                Please enter the verification token from your email:
              </p>
              
              <form onSubmit={handleManualVerification} className="space-y-4">
                <div>
                  <label className="block text-sm text-white font-medium mb-1">
                    Verification Token
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full p-3 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter verification token"
                    required
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Verify Email
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-800 border border-gray-600 rounded-md">
            <h4 className="font-medium text-blue-400 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-300">
              If you're having trouble verifying your email, please check:
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the verification link hasn't expired</li>
              <li>• Try copying and pasting the link directly</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
