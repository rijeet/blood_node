'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * AuthBootstrap
 * - Runs on client mount
 * - Tries to refresh access token using httpOnly refresh cookie
 * - If refresh succeeds and user is on a public/login route, redirect to dashboard
 * - If refresh fails, do nothing (user remains on public/login route)
 *
 * No UI is rendered; this component is invisible.
 */
export default function AuthBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const shouldRedirectToDashboard = (path: string) => {
      // Treat these as public/login routes
      if (!path) return true;
      const p = path.toLowerCase();
      return (
        p === '/'
        || p === '/landing'
        || p.startsWith('/auth')
        || p.includes('login')
        || p.includes('signup')
        || p.includes('verify')
        || p.includes('reset')
      );
    };

    const bootstrap = async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        });

        if (!res.ok) {
          // Ensure stale token is removed so SSR/public routes render correctly
          try { localStorage.removeItem('access_token'); } catch {}
          return; // remain on current (likely public) page
        }

        const data = await res.json();
        if (!cancelled && data?.access_token) {
          try { localStorage.setItem('access_token', data.access_token); } catch {}

          // If we're on a public/login route, send the user to dashboard
          if (shouldRedirectToDashboard(pathname || '')) {
            router.replace('/');
          }
        }
      } catch {
        // Network/other errors: stay put; user will see public/login route
        try { localStorage.removeItem('access_token'); } catch {}
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null; // no UI
}



