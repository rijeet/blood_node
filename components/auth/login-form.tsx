'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BloodNodeCrypto } from '@/lib/crypto/client';
import { RecoveryModal } from './recovery-modal';
import { LoginSecurityAlerts } from './login-security-alerts';

interface LoginFormProps {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberDevice: false
  });
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  // Show alert only after a failed login attempt (401) for this email
  const [failedEmail, setFailedEmail] = useState<string | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          remember_device: formData.rememberDevice
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Only trigger user-facing login alert on explicit auth failure (401)
        if (response.status === 401) {
          setFailedEmail(formData.email);
          setShowLoginAlert(true);
        }
        throw new Error(result.error || 'Login failed');
      }

      // Store access token
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('user_data', JSON.stringify(result.user));
      
      // Initialize crypto with user keys
      // Note: In a real app, you'd fetch the encrypted keys and decrypt them
      const crypto = new BloodNodeCrypto();
      
      onSuccess({
        user: result.user,
        accessToken: result.access_token,
        deviceId: result.device_id
      });

      // Successful login should clear any prior alert and failed email
      if (showLoginAlert || failedEmail) {
        setShowLoginAlert(false);
        setFailedEmail(null);
      }

    } catch (error: any) {
      onError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-black rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Login to Blood Node</h2>
      
      {/* User-specific security alert: only after a failed attempt */}
      {showLoginAlert && failedEmail && (
        <LoginSecurityAlerts userEmail={failedEmail} />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm text-white font-medium mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full p-2 border bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberDevice"
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.rememberDevice}
            onChange={(e) => setFormData(prev => ({ ...prev, rememberDevice: e.target.checked }))}
          />
          <label htmlFor="rememberDevice" className="text-sm text-white">
            Remember this device for 30 days
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button 
          type="button"
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          onClick={() => setShowRecoveryModal(true)}
        >
          Forgot your password? Reset via email
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-md">
        <h3 className="font-medium text-blue-400">Privacy Note:</h3>
        <p className="text-sm text-gray-300 mt-1">
          Your password is used locally to decrypt your data. We never store 
          your actual password on our servers.
        </p>
      </div>

      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={(message) => {
          onSuccess({ message });
          setShowRecoveryModal(false);
        }}
        onError={onError}
      />
    </div>
  );
}
