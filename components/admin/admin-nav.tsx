'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Database, 
  Shield, 
  MessageSquare, 
  FileText,
  LogOut,
  Settings
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/database', label: 'Database', icon: Database },
  { href: '/admin/security/alerts', label: 'Security', icon: Shield },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
];

export function AdminNav() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Blood Node Admin</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
