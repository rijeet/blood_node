'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  EyeOff, 
  Filter, 
  Search, 
  Bell, 
  Clock,
  MapPin,
  User,
  Activity,
  AlertCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  Users,
  Globe,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trash2,
  Unlock,
  Ban,
  MoreVertical,
  ExternalLink,
  Settings
} from 'lucide-react';

interface AdminAlert {
  _id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: {
    ip_address?: string;
    user_email?: string;
    attempt_count?: number;
    risk_score?: number;
    location?: string;
    timestamp: string;
  };
  is_read: boolean;
  created_at: string;
}

interface AlertStatistics {
  total: number;
  unread: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  recent_24h: number;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getSeverityGradient = (severity: string) => {
  switch (severity) {
    case 'critical': return 'from-red-500 to-red-600';
    case 'high': return 'from-orange-500 to-orange-600';
    case 'medium': return 'from-yellow-500 to-yellow-600';
    case 'low': return 'from-green-500 to-green-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'ip_blacklisted': return <Shield className="h-5 w-5" />;
    case 'multiple_failed_attempts': return <AlertTriangle className="h-5 w-5" />;
    case 'suspicious_activity': return <Activity className="h-5 w-5" />;
    case 'rate_limit_exceeded': return <Zap className="h-5 w-5" />;
    case 'account_locked': return <AlertCircle className="h-5 w-5" />;
    default: return <Bell className="h-5 w-5" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    alert_type: '',
    unread_only: false,
    search: ''
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('admin_token');
      
      if (!adminToken) {
        setError('Admin authentication required');
        return;
      }

      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.alert_type) params.append('alert_type', filters.alert_type);
      if (filters.unread_only) params.append('unread_only', 'true');
      params.append('limit', '100');

      const response = await fetch(`/api/admin/security/alerts?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setError('Admin authentication expired. Please login again.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAlerts(data.data.alerts);
        setStatistics(data.data.statistics);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAlerts = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const markAsRead = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      const adminToken = localStorage.getItem('admin_token');
      
      // Get admin ID from token or use a default
      const adminId = 'admin@bloodnode.com'; // Use email as identifier
      
      const response = await fetch('/api/admin/security/alerts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          alert_id: alertId, 
          admin_id: adminId 
        })
      });

      if (response.ok) {
        setAlerts(prev => 
          prev.map(alert => 
            alert._id === alertId ? { ...alert, is_read: true } : alert
          )
        );
        console.log('✅ Alert marked as read');
      } else {
        const errorData = await response.json();
        console.error('❌ Error marking alert as read:', errorData);
      }
    } catch (err) {
      console.error('Error marking alert as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const addToBlacklist = async (ipAddress: string) => {
    try {
      setActionLoading(ipAddress);
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/security/ip-blacklist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: ipAddress,
          reason: 'manual_admin_action',
          severity: 'high',
          description: 'Manually added by admin from security alerts'
        })
      });

      if (response.ok) {
        console.log('✅ IP added to blacklist');
        // Refresh alerts to show updated status
        await fetchAlerts();
      } else {
        const errorData = await response.json();
        console.error('❌ Error adding IP to blacklist:', errorData);
        alert(`Failed to block IP: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding IP to blacklist:', err);
      alert('Failed to block IP. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const removeFromBlacklist = async (ipAddress: string) => {
    try {
      setActionLoading(ipAddress);
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/security/ip-blacklist?ip_address=${ipAddress}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ IP removed from blacklist');
        // Refresh alerts to show updated status
        await fetchAlerts();
      } else {
        const errorData = await response.json();
        console.error('❌ Error removing IP from blacklist:', errorData);
        alert(`Failed to unblock IP: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error removing IP from blacklist:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      
      // For now, just remove from local state since we don't have a delete endpoint
      // In a real implementation, you would call a DELETE API endpoint
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
      console.log('✅ Alert deleted locally');
      
      // TODO: Implement actual delete API endpoint
      // const adminToken = localStorage.getItem('admin_token');
      // const response = await fetch(`/api/admin/security/alerts/${alertId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${adminToken}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      
    } catch (err) {
      console.error('Error deleting alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        alert.title.toLowerCase().includes(searchTerm) ||
        alert.message.toLowerCase().includes(searchTerm) ||
        alert.details.ip_address?.toLowerCase().includes(searchTerm) ||
        alert.details.user_email?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading security alerts...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching latest security data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-2xl shadow-2xl border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-16 w-16 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">{statistics?.unread || 0}</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                  Security Alerts
                </h1>
                <p className="text-lg text-gray-600 font-medium">Real-time security monitoring and threat detection</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Protected</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={refreshAlerts}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Alerts
              </Button>
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-lg border border-white/30">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6  mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Alerts</p>
                    <p className="text-3xl font-bold">{statistics.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bell className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Unread</p>
                    <p className="text-3xl font-bold">{statistics.unread}</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Critical</p>
                    <p className="text-3xl font-bold">{statistics.by_severity.critical || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Last 24h</p>
                    <p className="text-3xl font-bold">{statistics.recent_24h}</p>
                  </div>
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Filters Section */}
        <Card className="mb-8 bg-gradient-to-r from-white/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-2xl border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Filter & Search</h3>
                <p className="text-sm text-gray-600">Refine your security alerts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Enhanced Search Input */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 group-hover:text-purple-500 transition-colors duration-200" />
                  <Input
                    placeholder="Search alerts..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border-white/40 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-200 text-gray-800 placeholder-gray-500 font-medium"
                  />
                </div>
              </div>

              {/* Enhanced Severity Select */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Severity Level</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-xl border-white/40 rounded-2xl shadow-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-white/90 transition-all duration-200 text-gray-800 font-medium appearance-none cursor-pointer"
                  >
                    <option value="">🔍 All Severities</option>
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-gray-500 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Enhanced Alert Type Select */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Type</label>
                  <select
                    value={filters.alert_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, alert_type: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-xl border-white/40 rounded-2xl shadow-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/90 transition-all duration-200 text-gray-800 font-medium appearance-none cursor-pointer"
                  >
                    <option value="">🔍 All Types</option>
                    <option value="ip_blacklisted">🚫 IP Blacklisted</option>
                    <option value="multiple_failed_attempts">⚠️ Failed Attempts</option>
                    <option value="suspicious_activity">👁️ Suspicious Activity</option>
                    <option value="rate_limit_exceeded">⚡ Rate Limit</option>
                    <option value="account_locked">🔒 Account Locked</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronRight className="h-4 w-4 text-gray-500 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Enhanced Checkbox */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border-white/40 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        id="unread_only"
                        type="checkbox"
                        checked={filters.unread_only}
                        onChange={(e) => setFilters(prev => ({ ...prev, unread_only: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                        filters.unread_only 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 shadow-lg' 
                          : 'border-gray-300 bg-white/50 group-hover:border-purple-400'
                      }`}>
                        {filters.unread_only && (
                          <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Unread Only</span>
                      <p className="text-xs text-gray-600">Show only unread alerts</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {filters.search && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full">
                  Search: "{filters.search}"
                </Badge>
              )}
              {filters.severity && (
                <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1 rounded-full">
                  Severity: {filters.severity}
                </Badge>
              )}
              {filters.alert_type && (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 rounded-full">
                  Type: {filters.alert_type}
                </Badge>
              )}
              {filters.unread_only && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1 rounded-full">
                  Unread Only
                </Badge>
              )}
              {!filters.search && !filters.severity && !filters.alert_type && !filters.unread_only && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-3 py-1 rounded-full">
                  No filters applied
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-6">
          {filteredAlerts.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-xl border-white/30 shadow-2xl">
              <CardContent className="p-16 text-center">
                <div className="relative">
                  <div className="h-20 w-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Bell className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">0</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Security Alerts</h3>
                <p className="text-gray-600 text-lg">Your system is secure! No alerts match your current filters.</p>
                <div className="mt-6">
                  <Button 
                    onClick={refreshAlerts}
                    variant="outline" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card 
                key={alert._id} 
                className={`group bg-white/90 backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                  !alert.is_read ? 'ring-2 ring-blue-500/30 shadow-blue-500/10' : ''
                }`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-6 flex-1">
                      {/* Alert Icon with Enhanced Styling */}
                      <div className={`h-16 w-16 bg-gradient-to-br ${getSeverityGradient(alert.severity)} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header with Enhanced Typography */}
                        <div className="flex items-center space-x-4 mb-4">
                          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {alert.title}
                          </h3>
                          <Badge className={`${getSeverityColor(alert.severity)} text-sm font-bold px-3 py-1 rounded-full shadow-lg`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {!alert.is_read && (
                            <div className="relative">
                              <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 h-3 w-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced Message */}
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">{alert.message}</p>
                        
                        {/* Enhanced Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="flex items-center space-x-3 bg-gray-50/80 rounded-xl p-3 backdrop-blur-sm">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium">TIME</p>
                              <p className="text-sm font-semibold text-gray-800">{formatTimeAgo(alert.created_at)}</p>
                            </div>
                          </div>
                          
                          {alert.details.ip_address && (
                            <div className="flex items-center space-x-3 bg-red-50/80 rounded-xl p-3 backdrop-blur-sm">
                              <Globe className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium">IP ADDRESS</p>
                                <p className="text-sm font-semibold text-gray-800 font-mono">{alert.details.ip_address}</p>
                              </div>
                            </div>
                          )}
                          
                          {alert.details.user_email && (
                            <div className="flex items-center space-x-3 bg-green-50/80 rounded-xl p-3 backdrop-blur-sm">
                              <User className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium">USER</p>
                                <p className="text-sm font-semibold text-gray-800 truncate">{alert.details.user_email}</p>
                              </div>
                            </div>
                          )}
                          
                          {alert.details.attempt_count && (
                            <div className="flex items-center space-x-3 bg-orange-50/80 rounded-xl p-3 backdrop-blur-sm">
                              <Activity className="h-5 w-5 text-orange-500" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium">ATTEMPTS</p>
                                <p className="text-sm font-semibold text-gray-800">{alert.details.attempt_count}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-col space-y-3 ml-6">
                      {!alert.is_read && (
                        <Button
                          onClick={() => markAsRead(alert._id)}
                          disabled={actionLoading === alert._id}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {actionLoading === alert._id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark Read
                        </Button>
                      )}
                      
                      {/* IP Blacklist Actions */}
                      {alert.details.ip_address && (
                        <div className="flex flex-col space-y-2">
                          {alert.alert_type === 'ip_blacklisted' ? (
                            <Button
                              onClick={() => removeFromBlacklist(alert.details.ip_address!)}
                              disabled={actionLoading === alert.details.ip_address}
                              size="sm"
                              variant="outline"
                              className="hover:bg-green-50 hover:text-green-600 hover:border-green-200 border-green-300 text-green-600"
                            >
                              {actionLoading === alert.details.ip_address ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Unlock className="h-4 w-4 mr-2" />
                              )}
                              Unblock IP
                            </Button>
                          ) : (
                            <Button
                              onClick={() => addToBlacklist(alert.details.ip_address!)}
                              disabled={actionLoading === alert.details.ip_address}
                              size="sm"
                              variant="outline"
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-red-300 text-red-600"
                            >
                              {actionLoading === alert.details.ip_address ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4 mr-2" />
                              )}
                              Block IP
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Additional Actions */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => deleteAlert(alert._id)}
                          disabled={actionLoading === alert._id}
                          size="sm"
                          variant="ghost"
                          className="hover:bg-red-50 hover:text-red-600 text-gray-400 hover:text-red-600"
                        >
                          {actionLoading === alert._id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-blue-50 hover:text-blue-600 text-gray-400 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}