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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with nearby emergency alerts and important notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see emergency alerts and updates here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      {notification.urgency_level && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getUrgencyColor(notification.urgency_level)}`}
                        >
                          {getUrgencyIcon(notification.urgency_level)} {notification.urgency_level}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {(notification.location_address || notification.distance_km) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {notification.location_address}
                          {notification.distance_km && ` • ${notification.distance_km.toFixed(1)}km away`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {notification.action_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => window.open(notification.action_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {notification.action_button_text || 'View'}
                          </Button>
                        )}
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => markAsRead(notification._id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-gray-400 hover:text-red-500"
                          onClick={() => deleteNotification(notification._id)}
                        >
                          <X className="h-3 w-3" />
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
