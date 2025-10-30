'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme/theme-toggle';
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
  { href: '/admin/donations', label: 'Donations', icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  };

  return (
    <nav className="bg-background text-foreground shadow-sm border-b">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Blood Node Admin</span>
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
                    className={`flex items-center space-x-2`}
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
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className=""
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
