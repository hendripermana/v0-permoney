'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: string;
  readAt?: string;
}

interface NotificationPreferences {
  budgetAlerts: {
    enabled: boolean;
    channels: string[];
    threshold: number;
  };
  debtReminders: {
    enabled: boolean;
    channels: string[];
    daysBefore: number;
  };
  zakatReminders: {
    enabled: boolean;
    channels: string[];
    daysBefore: number;
  };
  priceAlerts: {
    enabled: boolean;
    channels: string[];
    priceDropPercentage: number;
  };
  transactionAlerts: {
    enabled: boolean;
    channels: string[];
    largeAmountThreshold: number;
  };
  monthlyReports: {
    enabled: boolean;
    channels: string[];
    dayOfMonth: number;
  };
  securityAlerts: {
    enabled: boolean;
    channels: string[];
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  subscribeToPush: (subscription: PushSubscription) => Promise<void>;
  unsubscribeFromPush: (endpoint: string) => Promise<void>;
  sendTestNotification: (type: string, channels: string[]) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences),
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  // Push subscription mutations
  const subscribeToPushMutation = useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
            auth: subscription.getKey('auth') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : '',
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to subscribe to push notifications');
      return response.json();
    },
  });

  const unsubscribeFromPushMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ endpoint }),
      });
      if (!response.ok) throw new Error('Failed to unsubscribe from push notifications');
      return response.json();
    },
  });

  // Test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: async ({ type, channels }: { type: string; channels: string[] }) => {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type, channels }),
      });
      if (!response.ok) throw new Error('Failed to send test notification');
      return response.json();
    },
  });

  // Initialize push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const subscription = await registration.pushManager.getSubscription();
          setPushSubscription(subscription);
        } catch (error) {
          console.error('Error getting push subscription:', error);
        }
      });
    }
  }, []);

  // Context value
  const value: NotificationContextType = {
    notifications: notificationsData?.notifications || [],
    unreadCount: unreadData?.count || 0,
    preferences: preferences || null,
    isLoading: notificationsLoading || preferencesLoading,
    markAsRead: useCallback(async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    }, [markAsReadMutation]),
    markAllAsRead: useCallback(async () => {
      await markAllAsReadMutation.mutateAsync();
    }, [markAllAsReadMutation]),
    deleteNotification: useCallback(async (notificationId: string) => {
      await deleteNotificationMutation.mutateAsync(notificationId);
    }, [deleteNotificationMutation]),
    updatePreferences: useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
      await updatePreferencesMutation.mutateAsync(newPreferences);
    }, [updatePreferencesMutation]),
    subscribeToPush: useCallback(async (subscription: PushSubscription) => {
      await subscribeToPushMutation.mutateAsync(subscription);
      setPushSubscription(subscription);
    }, [subscribeToPushMutation]),
    unsubscribeFromPush: useCallback(async (endpoint: string) => {
      await unsubscribeFromPushMutation.mutateAsync(endpoint);
      if (pushSubscription?.endpoint === endpoint) {
        setPushSubscription(null);
      }
    }, [unsubscribeFromPushMutation, pushSubscription]),
    sendTestNotification: useCallback(async (type: string, channels: string[]) => {
      await sendTestNotificationMutation.mutateAsync({ type, channels });
    }, [sendTestNotificationMutation]),
    refreshNotifications: useCallback(() => {
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }, [refetchNotifications, queryClient]),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
