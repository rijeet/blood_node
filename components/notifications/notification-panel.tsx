'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  Heart, 
  MapPin, 
  Clock, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Notification {
  _id: string;
  type: 'emergency_alert' | 'donor_response' | 'family_invite' | 'donation_reminder' | 'system';
  title: string;
  message: string;
  blood_type?: string;
  location_address?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  distance_km?: number;
  action_url?: string;
  action_button_text?: string;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  className?: string;
}

export function NotificationPanel({ className }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/notifications?limit=10&includeRead=true');
      
      if (response.success) {
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/api/notifications/${notificationId}`, {
        action: 'mark_read'
      });
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.post('/api/notifications', {
        action: 'mark_all_read'
      });
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      
      if (response.success) {
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
      default: return '🔔';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency_alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'donor_response': return <Heart className="h-4 w-4 text-green-500" />;
      case 'family_invite': return <Bell className="h-4 w-4 text-blue-500" />;
      case 'donation_reminder': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-white to-gray-50 shadow-2xl border-2 border-gray-200 rounded-2xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 text-lg font-bold rounded-full shadow-lg">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-1">
                Stay updated with nearby emergency alerts and important notifications
              </CardDescription>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No notifications yet</h3>
            <p className="text-lg text-gray-500">You'll see emergency alerts and updates here</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  notification.read 
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' 
                    : 'bg-gradient-to-r from-white to-blue-50 border-blue-300 shadow-lg'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      {getTypeIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className={`text-lg font-bold ${
                        notification.read ? 'text-gray-600' : 'text-gray-800'
                      }`}>
                        {notification.title}
                      </h4>
                      {notification.urgency_level && (
                        <Badge 
                          className={`px-4 py-2 text-sm font-bold rounded-full shadow-lg ${getUrgencyColor(notification.urgency_level)}`}
                        >
                          {getUrgencyIcon(notification.urgency_level)} {notification.urgency_level.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-lg leading-relaxed ${
                      notification.read ? 'text-gray-600' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {(notification.location_address || notification.distance_km) && (
                      <div className="flex items-center gap-2 mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border-2 border-purple-200">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <span className="text-lg font-semibold text-purple-700">
                          {notification.location_address}
                          {notification.distance_km && ` • ${notification.distance_km.toFixed(1)}km away`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-lg font-semibold text-gray-500 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        {notification.action_url && (
                          <Button
                            onClick={() => window.open(notification.action_url, '_blank')}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <ExternalLink className="h-5 w-5 mr-2" />
                            {notification.action_button_text || 'Respond to Alert'}
                          </Button>
                        )}
                        
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification._id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => deleteNotification(notification._id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
