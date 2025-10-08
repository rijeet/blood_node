'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentPage: 'login' | 'admin' | 'user' | 'home' | 'other';
  showSecurityAlerts: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();

  // Determine current page type
  const getCurrentPage = (): 'login' | 'admin' | 'user' | 'home' | 'other' => {
    // Check if we're on a login page (including home page when not authenticated)
    if (pathname === '/auth/login' || pathname === '/login' || 
        (pathname === '/' && !isAuthenticated)) {
      return 'login';
    }
    if (pathname.startsWith('/admin')) {
      return 'admin';
    }
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
      return 'user';
    }
    if (pathname === '/') {
      return 'home';
    }
    return 'other';
  };

  const currentPage = getCurrentPage();

  // Determine if security alerts should be shown
  const showSecurityAlerts = (() => {
    // Always show on login page
    if (currentPage === 'login') {
      return true;
    }
    
    // Show for admins after login
    if (isAuthenticated && isAdmin && currentPage === 'admin') {
      return true;
    }
    
    // Don't show for regular users on other pages
    return false;
  })();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userEmail = localStorage.getItem('user_email');
        const userRole = localStorage.getItem('user_role');
        
        if (token && userEmail) {
          setIsAuthenticated(true);
          setUserEmail(userEmail);
          setIsAdmin(userRole === 'admin');
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserEmail(null);
        setIsAdmin(false);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isAdmin,
    userEmail,
    currentPage,
    showSecurityAlerts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
