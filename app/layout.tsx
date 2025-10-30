import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./fonts";
import AuthBootstrap from "@/components/auth/auth-bootstrap";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { DonationModalProvider } from "@/lib/contexts/donation-modal-context";
import DonationModal from "@/components/donation/donation-modal";
// Removed global security alert providers; alerts are now scoped to the login page only

export const metadata: Metadata = {
  title: "BLOOD NODE",
  description: "A website for managing your blood network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try {
  const storageKey = 'theme';
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
  const root = document.documentElement;
  if (isDark) { root.classList.add('dark'); }
  else { root.classList.remove('dark'); }
} catch (_) {} })();`
          }}
        />
      </head>
      <body>
        {/* Invisible auth bootstrap to keep user signed in across refreshes */}
        <ThemeProvider>
          <DonationModalProvider>
            <AuthBootstrap />
            {children}
            <DonationModal />
          </DonationModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
