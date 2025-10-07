'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_device: false
  });
  const [verificationData, setVerificationData] = useState({
    verification_token: '',
    verification_code: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'verification'>('login');

  useEffect(() => {
    // Check if already logged in with valid token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      // Verify token is still valid before redirecting
      fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Token is valid, redirect to admin
          router.push('/admin');
        } else {
          // Token is invalid, remove it and stay on login page
          localStorage.removeItem('admin_token');
          setInitialLoading(false);
        }
      })
      .catch(() => {
        // Error occurred, remove token and stay on login page
        localStorage.removeItem('admin_token');
        setInitialLoading(false);
      });
    } else {
      // No token, show login form
      setInitialLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.requires_verification) {
        // Store verification token and move to verification step
        setVerificationData(prev => ({
          ...prev,
          verification_token: data.verification_token
        }));
        setSuccess(data.message);
        setStep('verification');
      } else {
        // Store admin token and redirect (fallback)
        localStorage.setItem('admin_token', data.token);
        router.push('/admin');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store admin token
      localStorage.setItem('admin_token', data.token);
      
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error: any) {
      console.error('Admin verification error:', error);
      setError(error.message || 'Verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setVerificationData(prev => ({
        ...prev,
        verification_token: data.verification_token
      }));
      setSuccess('Verification code sent to your email address');
    } catch (error: any) {
      console.error('Resend code error:', error);
      setError(error.message || 'Failed to resend code');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVerificationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show loading screen during initial token validation
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-lg animate-pulse delay-500"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25 mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Admin Portal
          </h2>
          <p className="text-gray-300 text-lg">
            Secure access to Blood Node dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-white text-center">
              {step === 'login' ? 'Administrator Access' : 'Email Verification'}
            </CardTitle>
            <CardDescription className="text-gray-300 text-center">
              {step === 'login' 
                ? 'Enter your credentials to access the admin dashboard'
                : 'Enter the verification code sent to your email'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 h-12 rounded-xl backdrop-blur-sm"
                      placeholder="admin@bloodnode.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-12 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 h-12 rounded-xl backdrop-blur-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    id="remember_device"
                    name="remember_device"
                    type="checkbox"
                    checked={formData.remember_device}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white/10"
                  />
                  <Label htmlFor="remember_device" className="text-gray-300 text-sm">
                    Remember this device for 7 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="h-5 w-5 text-green-400 mr-3">✓</div>
                      <p className="text-sm text-green-200">{success}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verification_code" className="text-white font-medium">Verification Code</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="verification_code"
                      name="verification_code"
                      type="text"
                      required
                      value={verificationData.verification_code}
                      onChange={handleVerificationInputChange}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 h-12 rounded-xl backdrop-blur-sm text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Enter the 6-digit code sent to {formData.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={verificationLoading || verificationData.verification_code.length !== 6}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {verificationLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Verify & Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendCode}
                      disabled={verificationLoading}
                      className="flex-1 h-10 border-white/20 text-white hover:bg-white/10"
                    >
                      {verificationLoading ? 'Sending...' : 'Resend Code'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('login')}
                      className="flex-1 h-10 border-white/20 text-white hover:bg-white/10"
                    >
                      Back to Login
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">
            Blood Node Admin Dashboard v1.0
          </p>
          <p className="text-xs text-gray-500">
            Secure access for authorized administrators only
          </p>
        </div>
      </div>
    </div>
  );
}
