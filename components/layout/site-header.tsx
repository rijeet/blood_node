'use client';

import Link from 'next/link';
import { Droplets, Globe, Phone, Mail, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/theme-toggle';
import { useDonationModal } from '@/lib/contexts/donation-modal-context';

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open } = useDonationModal();

  return (
    <header className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
      <div className="bg-red-700 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-4">
              <a href="#" className="hover:text-red-200 transition-colors"><Globe className="h-4 w-4" /></a>
              <a href="#" className="hover:text-red-200 transition-colors"><Phone className="h-4 w-4" /></a>
              <a href="#" className="hover:text-red-200 transition-colors"><Mail className="h-4 w-4" /></a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm">Emergency: <span className="font-semibold">SMS to 01625524255</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-white rounded-full p-2">
                <Droplets className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-2xl font-bold">Blood Node</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
              <Link href="/landing#about" className="hover:text-red-200 transition-colors">About Us</Link>
              <Link href="/landing#features" className="hover:text-red-200 transition-colors">Features</Link>
              <Link href="/landing#pricing" className="hover:text-red-200 transition-colors">Pricing</Link>
              <Link href="/landing#blog" className="hover:text-red-200 transition-colors">Blog</Link>
              <Link href="/landing#faq" className="hover:text-red-200 transition-colors">FAQ</Link>
              <button onClick={() => (window.location.href='/?view=signup')} className="hover:text-red-200 transition-colors">Register</button>
              <button onClick={() => (window.location.href='/?view=login')} className="hover:text-red-200 transition-colors">Login</button>
              <Button className="bg-white text-red-600 hover:bg-red-50">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={open}>Donate</Button>
            </nav>

            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden mt-4 pb-4">
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="hover:text-red-200 transition-colors">Home</Link>
                <Link href="/landing#about" className="hover:text-red-200 transition-colors">About Us</Link>
                <Link href="/landing#features" className="hover:text-red-200 transition-colors">Features</Link>
                <Link href="/landing#pricing" className="hover:text-red-200 transition-colors">Pricing</Link>
                <Link href="/landing#blog" className="hover:text-red-200 transition-colors">Blog</Link>
                <Link href="/landing#faq" className="hover:text-red-200 transition-colors">FAQ</Link>
                <button onClick={() => (window.location.href='/?view=signup')} className="hover:text-red-200 transition-colors">Register</button>
                <button onClick={() => (window.location.href='/?view=login')} className="hover:text-red-200 transition-colors">Login</button>
                <div className="pt-2">
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


