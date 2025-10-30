'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/auth/signup-form";
import { LoginForm } from "@/components/auth/login-form";
import { RelativeForm } from "@/components/relatives/relative-form";
import { BloodGroupGrid } from "@/components/family/blood-group-grid";
import { FamilyInviteModalAdvanced } from "@/components/family/family-invite-modal-advanced";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { PersistentNotificationPanel } from "@/components/notifications/persistent-notification-panel";
import LandingPage from "./landing/page";
import { useDonationModal } from "@/lib/contexts/donation-modal-context";
import ThemeToggle from "@/components/theme/theme-toggle";

interface User {
  id: string;
  user_code: string;
  email_verified: boolean;
  public_profile: boolean;
  plan: string;
  location_address?: string;
}

export default function Home() {
  const { open: openDonation } = useDonationModal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'signup' | 'login' | 'dashboard' | 'verification'>('landing');
  const [showLanding, setShowLanding] = useState(true);
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
    const viewParam = urlParams.get('view');
    const returnUrl = urlParams.get('returnUrl');
    
    if (shouldLogin) {
      setCurrentView('login');
      if (returnUrl) {
        // Store return URL for after login
        localStorage.setItem('returnUrl', returnUrl);
      }
      return;
    }
    
    // Handle view parameter from landing page
    if (viewParam === 'signup' || viewParam === 'login') {
      setCurrentView(viewParam);
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

  useEffect(() => {
    if (currentView === 'dashboard') {
      const shown = typeof window !== 'undefined' ? sessionStorage.getItem('donation_prompt_shown') : '1';
      if (!shown) {
        try { sessionStorage.setItem('donation_prompt_shown', '1'); } catch {}
        openDonation();
      }
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
      <div className="min-h-screen bg-background text-foreground">
        <header className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold">Blood Node</h1>
              <div className="flex items-center space-x-4">
                <PersistentNotificationPanel />
                <ThemeToggle />
                <Button variant="secondary" onClick={() => openDonation()}>Donate</Button>
                <Badge variant="outline">
                  Plan: {currentUser.plan}
                </Badge>
                <Badge variant="outline">
                  Code: {currentUser.user_code}
                </Badge>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-secondary/20 border border-secondary text-foreground px-4 py-3 rounded">
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

        {/* Dashboard Footer */}
        <footer className="bg-card border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-muted-foreground text-sm">
                © 2024 Blood Node. All rights reserved.
              </div>
              <div className="flex space-x-6">
                <Link 
                  href="/support" 
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                >
                  Support
                </Link>
                <Link 
                  href="/privacy" 
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                >
                  Privacy
                </Link>
                <Link 
                  href="/terms" 
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-secondary/20 border border-secondary text-foreground px-4 py-3 rounded z-50">
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
              className="text-primary hover:underline transition-colors"
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-secondary/20 border border-secondary text-foreground px-4 py-3 rounded z-50">
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
              className="text-primary hover:underline transition-colors"
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        {error && (
          <div className="fixed top-4 right-4 bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-secondary/20 border border-secondary text-foreground px-4 py-3 rounded z-50">
            {success}
          </div>
        )}
        <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">🩸 Blood Node</h1>
            <h2 className="text-xl text-muted-foreground">Email Verification Required</h2>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                We've sent a verification email to <strong>{userData?.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link to complete your registration.
              </p>
            </div>

            

            <div className="text-center">
              <button 
                className="text-primary hover:underline transition-colors"
                onClick={() => setCurrentView('login')}
              >
                Already verified? Login
              </button>
            </div>

            <div className="mt-6 p-4 bg-secondary/20 border border-secondary rounded-md">
              <h3 className="font-medium">Account Information:</h3>
              <div className="text-sm mt-2 space-y-2">
                <p><strong>User Code:</strong> {userData?.userCode}</p>
                <p className="text-xs text-muted-foreground">Keep your User Code safe - you'll need it to identify your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page
  return <LandingPage />;
}