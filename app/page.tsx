'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/auth/signup-form";
import { LoginForm } from "@/components/auth/login-form";
import { RelativeForm } from "@/components/relatives/relative-form";
import { BloodGroupGrid } from "@/components/family/blood-group-grid";
import { FamilyInviteModalAdvanced } from "@/components/family/family-invite-modal-advanced";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

interface User {
  id: string;
  user_code: string;
  email_verified: boolean;
  public_profile: boolean;
  plan: string;
  location_address?: string;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'signup' | 'login' | 'dashboard' | 'verification'>('landing');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);

  // Function to fetch profile data when dashboard is loaded
  const fetchProfileData = async () => {
    if (profileDataLoaded) {
      return; // Prevent multiple calls
    }
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      return;
    }

    setProfileDataLoaded(true); // Mark as loading to prevent multiple calls

    try {
      const profileResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUser(profileData.user);
      } else if (profileResponse.status === 401) {
        // Token is invalid, clear it and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      // On error, clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setCurrentUser(null);
      setCurrentView('login');
    }
  };

  // Check for existing session on page load
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const accessToken = localStorage.getItem('access_token');
    
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLogin = urlParams.get('login') === 'true';
    const returnUrl = urlParams.get('returnUrl');
    
    if (shouldLogin) {
      setCurrentView('login');
      if (returnUrl) {
        // Store return URL for after login
        localStorage.setItem('returnUrl', returnUrl);
      }
      return;
    }
    
    // Check for valid token (not 'undefined' or 'null' strings)
    if (userData && accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
      // Only set dashboard view if we have a valid token
      // Don't fetch profile data immediately to prevent JWT errors
      setCurrentUser(JSON.parse(userData));
      setCurrentView('dashboard');
    } else {
      // Clean up invalid tokens if they exist
      if (accessToken === 'undefined' || accessToken === 'null') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
      // No valid token, stay on landing page (don't auto-redirect to login)
      setCurrentView('landing');
    }
  }, []);

  // Fetch profile data when dashboard view is rendered
  useEffect(() => {
    if (currentView === 'dashboard' && currentUser && !profileDataLoaded) {
      fetchProfileData();
    }
  }, [currentView]);

  const handleSignupSuccess = (userData: any) => {
    setSuccess('Account created successfully! Please verify your email to complete registration.');
    setCurrentView('verification');
    // Store user data for verification
    localStorage.setItem('pending_verification', JSON.stringify(userData));
  };

  const handleLoginSuccess = async (data: any) => {
    // Store basic user data
    setCurrentUser(data.user);
    setSuccess('Welcome back!');
    
    // Fetch full profile data including location
    try {
      const profileResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCurrentUser(profileData.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
    
    // Check if there's a return URL to redirect to
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      window.location.href = returnUrl;
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    // Call logout API
    fetch('/api/auth/logout', { method: 'POST' });
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    
    setCurrentUser(null);
    setCurrentView('landing');
    setProfileDataLoaded(false); // Reset profile data loading state
    setSuccess('Logged out successfully');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleSuccess = (successMessage: string) => {
    setSuccess(successMessage);
    setTimeout(() => setSuccess(null), 5000);
  };


  if (currentView === 'dashboard' && currentUser) {
    return (
      <div className="min-h-screen bg-black">
        <header className="bg-gray-900 shadow-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-white">Blood Node</h1>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800">
                  Plan: {currentUser.plan}
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800">
                  Code: {currentUser.user_code}
                </Badge>
                <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded">
              {success}
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardTabs
            user={currentUser}
            onError={handleError}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded z-50">
            {success}
          </div>
        )}
        <div>
          <SignupForm 
            onSuccess={handleSignupSuccess} 
            onError={handleError} 
          />
          <div className="text-center mt-4">
            <button 
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              onClick={() => setCurrentView('login')}
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded z-50">
            {success}
          </div>
        )}
        <div>
          <LoginForm 
            onSuccess={handleLoginSuccess} 
            onError={handleError} 
          />
          <div className="text-center mt-4">
            <button 
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              onClick={() => setCurrentView('signup')}
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'verification') {
    const pendingData = localStorage.getItem('pending_verification');
    const userData = pendingData ? JSON.parse(pendingData) : null;

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded z-50">
            {success}
          </div>
        )}
        <div className="max-w-md mx-auto p-6 bg-black rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🩸 Blood Node</h1>
            <h2 className="text-xl text-gray-300">Email Verification Required</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                We've sent a verification email to <strong>{userData?.email}</strong>
              </p>
              <p className="text-sm text-gray-400">
                Please check your email and click the verification link to complete your registration.
              </p>
            </div>

            

            <div className="text-center">
              <button 
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                onClick={() => setCurrentView('login')}
              >
                Already verified? Login
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-900 border border-blue-700 rounded-md">
              <h3 className="font-medium text-blue-400">Account Information:</h3>
              <div className="text-sm text-blue-200 mt-2 space-y-2">
                <p><strong>User Code:</strong> {userData?.userCode}</p>
                <p className="text-xs">Keep your User Code safe - you'll need it to identify your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded z-50">
          {success}
        </div>
      )}
      
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blood Node</h1>
          <p className="text-lg text-white-600 mb-8">
            Secure family blood network with end-to-end encryption
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">🔒 Privacy First</h2>
            <p className="text-gray-600 mb-4">
              All your family data is encrypted end-to-end. We never see your private information.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• AES-256-GCM encryption</li>
              <li>• Browser-only decryption</li>
              <li>• Shamir Secret Sharing recovery</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">🩸 Blood Network</h2>
            <p className="text-gray-600 mb-4">
              Map your family's blood types and donation history securely.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Track blood group compatibility</li>
              <li>• Find nearby donors</li>
              <li>• Consent-based sharing</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">🌐 Global Network</h2>
            <p className="text-gray-600 mb-4">
              Connect with family members worldwide with geolocation privacy.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Coarse geohash location</li>
              <li>• Distance-based search</li>
              <li>• Invite flow with consent</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">🚀 Easy Recovery</h2>
            <p className="text-gray-600 mb-4">
              Multiple recovery options ensure you never lose access.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Server share + user share</li>
              <li>• Optional email recovery</li>
              <li>• Threshold-based reconstruction</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Button size="lg" onClick={() => setCurrentView('signup')}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => setCurrentView('login')}>
            Login
          </Button>
        </div>
      </main>
    </div>
  );
}