'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'system' | 'budget' | 'transaction' | 'security' | 'sync' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export function NotificationProvider({ 
  children, 
  maxNotifications = 50 
}: NotificationProviderProps) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
  });

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('permoney-notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        const notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        const unreadCount = notifications.filter((n: Notification) => !n.read).length;
        setState(prev => ({
          ...prev,
          notifications,
          unreadCount,
        }));
      } catch (error) {
        console.error('Failed to parse saved notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage
  const saveNotifications = useCallback((notifications: Notification[]) => {
    localStorage.setItem('permoney-notifications', JSON.stringify(notifications));
  }, []);

  const addNotification = useCallback((
    notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const notification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setState(prev => {
      const newNotifications = [notification, ...prev.notifications]
        .slice(0, maxNotifications); // Limit total notifications
      
      const unreadCount = newNotifications.filter(n => !n.read).length;
      
      saveNotifications(newNotifications);
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
      };
    });

    // Auto-remove non-persistent notifications after delay
    if (!notification.persistent) {
      const delay = notification.priority === 'urgent' ? 10000 : 
                   notification.priority === 'high' ? 8000 : 
                   notification.priority === 'medium' ? 6000 : 4000;
      
      setTimeout(() => {
        removeNotification(notification.id);
      }, delay);
    }
  }, [maxNotifications, saveNotifications]);

  const markAsRead = useCallback((id: string) => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = newNotifications.filter(n => !n.read).length;
      
      saveNotifications(newNotifications);
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
      };
    });
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setState(prev => {
      const newNotifications = prev.notifications.map(n => ({ ...n, read: true }));
      
      saveNotifications(newNotifications);
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount: 0,
      };
    });
  }, [saveNotifications]);

  const removeNotification = useCallback((id: string) => {
    setState(prev => {
      const newNotifications = prev.notifications.filter(n => n.id !== id);
      const unreadCount = newNotifications.filter(n => !n.read).length;
      
      saveNotifications(newNotifications);
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
      };
    });
  }, [saveNotifications]);

  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }));
    localStorage.removeItem('permoney-notifications');
  }, []);

  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const openPanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value: NotificationContextType = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    togglePanel,
    openPanel,
    closePanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Convenience hooks for different notification types
export function useNotificationActions() {
  const { addNotification } = useNotifications();

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'success',
      priority: 'medium',
      category: 'system',
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'error',
      priority: 'high',
      category: 'system',
      persistent: true,
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'warning',
      priority: 'medium',
      category: 'system',
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'info',
      priority: 'low',
      category: 'system',
      ...options,
    });
  }, [addNotification]);

  const showBudgetAlert = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: 'warning',
      priority: 'high',
      category: 'budget',
      persistent: true,
      ...options,
    });
  }, [addNotification]);

  const showSyncStatus = useCallback((title: string, message: string, success: boolean, options?: Partial<Notification>) => {
    addNotification({
      title,
      message,
      type: success ? 'success' : 'error',
      priority: success ? 'low' : 'medium',
      category: 'sync',
      persistent: !success,
      ...options,
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBudgetAlert,
    showSyncStatus,
  };
}
