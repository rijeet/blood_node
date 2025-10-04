'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  Activity, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active_today: number;
    new_this_week: number;
    verified: number;
    unverified: number;
  };
  payments: {
    total_revenue: number;
    monthly_revenue: number;
    successful_payments: number;
    failed_payments: number;
    refunds: number;
  };
  activity: {
    total_page_views: number;
    unique_visitors_today: number;
    avg_session_duration: number;
    top_pages: Array<{ page: string; hits: number }>;
  };
  system: {
    total_verification_tokens: number;
    total_refresh_tokens: number;
    emergency_alerts: number;
    family_connections: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching latest analytics data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={fetchDashboardStats} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Blood Node Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Settings className="h-4 w-4" />
              </Button>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  router.push('/admin/login');
                }}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800">Total Users</CardTitle>
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">{formatNumber(stats.users.total)}</div>
              <p className="text-xs text-blue-700">
                {stats.users.verified} verified, {stats.users.unverified} unverified
              </p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-800">Total Revenue</CardTitle>
              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-1">{formatCurrency(stats.payments.total_revenue)}</div>
              <p className="text-xs text-green-700">
                {formatCurrency(stats.payments.monthly_revenue)} this month
              </p>
            </CardContent>
          </Card>

          {/* Page Views */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800">Page Views</CardTitle>
              <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">{formatNumber(stats.activity.total_page_views)}</div>
              <p className="text-xs text-purple-700">
                {stats.activity.unique_visitors_today} unique visitors today
              </p>
            </CardContent>
          </Card>

          {/* Emergency Alerts */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-800">Emergency Alerts</CardTitle>
              <div className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 mb-1">{formatNumber(stats.system.emergency_alerts)}</div>
              <p className="text-xs text-red-700">
                {stats.system.family_connections} family connections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                User Activity
              </CardTitle>
              <CardDescription className="text-gray-600">Recent user engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">Active Today</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{formatNumber(stats.users.active_today)}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-800">New This Week</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">{formatNumber(stats.users.new_this_week)}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Verified Users</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {formatNumber(stats.users.verified)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">Unverified Users</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatNumber(stats.users.unverified)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Analytics */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                Payment Analytics
              </CardTitle>
              <CardDescription className="text-gray-600">Revenue and payment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Successful Payments</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {formatNumber(stats.payments.successful_payments)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Failed Payments</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {formatNumber(stats.payments.failed_payments)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">Refunds</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {formatNumber(stats.payments.refunds)}
                  </Badge>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-900">Monthly Revenue</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(stats.payments.monthly_revenue)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                Top Pages
              </CardTitle>
              <CardDescription className="text-gray-600">Most visited pages this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.activity.top_pages.slice(0, 5).map((page, index) => (
                  <div key={page.page} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">{page.page}</span>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-2">{formatNumber(page.hits)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                System Status
              </CardTitle>
              <CardDescription className="text-gray-600">Token and system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-indigo-800">Verification Tokens</span>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">{formatNumber(stats.system.total_verification_tokens)}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">Refresh Tokens</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{formatNumber(stats.system.total_refresh_tokens)}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Family Connections</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">{formatNumber(stats.system.family_connections)}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Emergency Alerts</span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {formatNumber(stats.system.emergency_alerts)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
