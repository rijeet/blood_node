'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Heart, 
  Users, 
  Info, 
  CheckCircle,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { notificationStorage, PersistentNotification } from '@/lib/services/notification-storage';
import { formatDistanceToNow } from 'date-fns';

interface PersistentNotificationPanelProps {
  className?: string;
  maxHeight?: string;
}

export function PersistentNotificationPanel({ 
  className = '', 
  maxHeight = 'max-h-96' 
}: PersistentNotificationPanelProps) {
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Clean up expired notifications on mount
    notificationStorage.cleanupExpired();
    
    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      notificationStorage.cleanupExpired();
      loadNotifications();
    }, 60000); // Every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationStorage.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationStorage.getUnreadCount());
  };

  const handleMarkAsRead = (id: string) => {
    notificationStorage.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationStorage.markAllAsRead();
    loadNotifications();
  };

  const handleRemoveNotification = (id: string) => {
    notificationStorage.removeNotification(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    notificationStorage.clearAll();
    loadNotifications();
  };

  const handleActionClick = (notification: PersistentNotification) => {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank');
      } else {
        window.location.href = notification.actionUrl;
      }
    }
    handleMarkAsRead(notification.id);
  };

  const getNotificationIcon = (type: PersistentNotification['type']) => {
    switch (type) {
      case 'emergency_alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'donation_request':
        return <Heart className="w-5 h-5 text-pink-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: PersistentNotification['type']) => {
    switch (type) {
      case 'emergency_alert':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'donation_request':
        return 'border-pink-200 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800';
      case 'system':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-8"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className={`overflow-y-auto ${maxHeight}`}>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'opacity-100' : 'opacity-75'
                      } hover:opacity-100 transition-opacity`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveNotification(notification.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {notification.actionUrl && notification.actionText && (
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActionClick(notification)}
                                className="text-xs h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                {notification.actionText}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
