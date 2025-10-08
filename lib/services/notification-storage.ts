// Notification storage service for persistent notifications
export interface PersistentNotification {
  id: string;
  type: 'emergency_alert' | 'donation_request' | 'system' | 'info';
  title: string;
  message: string;
  alertId?: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  expiresAt?: Date;
  read: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'blood_node_notifications';

export class NotificationStorage {
  private static instance: NotificationStorage;
  
  private constructor() {}
  
  public static getInstance(): NotificationStorage {
    if (!NotificationStorage.instance) {
      NotificationStorage.instance = new NotificationStorage();
    }
    return NotificationStorage.instance;
  }

  // Get all notifications
  public getNotifications(): PersistentNotification[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      return notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
      }));
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Add a new notification
  public addNotification(notification: Omit<PersistentNotification, 'id' | 'createdAt' | 'read'>): string {
    const id = this.generateId();
    const newNotification: PersistentNotification = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false
    };

    const notifications = this.getNotifications();
    notifications.unshift(newNotification); // Add to beginning
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }

    this.saveNotifications(notifications);
    return id;
  }

  // Mark notification as read
  public markAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications(notifications);
    }
  }

  // Mark all notifications as read
  public markAllAsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    this.saveNotifications(notifications);
  }

  // Remove a notification
  public removeNotification(id: string): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    this.saveNotifications(filtered);
  }

  // Clear all notifications
  public clearAll(): void {
    this.saveNotifications([]);
  }

  // Get unread count
  public getUnreadCount(): number {
    const notifications = this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }

  // Clean up expired notifications
  public cleanupExpired(): void {
    const notifications = this.getNotifications();
    const now = new Date();
    const active = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
    
    if (active.length !== notifications.length) {
      this.saveNotifications(active);
    }
  }

  // Add emergency alert notification
  public addEmergencyAlertNotification(alertId: string, donorsNotified: number): string {
    return this.addNotification({
      type: 'emergency_alert',
      title: 'Emergency Alert Sent',
      message: `Emergency alert sent successfully! ${donorsNotified} donors notified. Alert ID: ${alertId}. You can manage responses and select donors from the management page.`,
      alertId,
      actionUrl: `/emergency/manage/${alertId}`,
      actionText: 'Manage Responses',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  // Private methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveNotifications(notifications: PersistentNotification[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationStorage = NotificationStorage.getInstance();
