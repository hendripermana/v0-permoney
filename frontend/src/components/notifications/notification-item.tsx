'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2, ExternalLink, AlertCircle, DollarSign, Calendar, Shield, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

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

interface NotificationItemProps {
  notification: Notification;
}

const notificationIcons = {
  BUDGET_EXCEEDED: DollarSign,
  BUDGET_WARNING: DollarSign,
  DEBT_PAYMENT_DUE: Calendar,
  ZAKAT_REMINDER: Calendar,
  PRICE_ALERT: TrendingDown,
  TRANSACTION_CREATED: DollarSign,
  ACCOUNT_BALANCE_LOW: AlertCircle,
  RECURRING_TRANSACTION_FAILED: AlertCircle,
  MONTHLY_REPORT_READY: Calendar,
  SECURITY_ALERT: Shield,
  HOUSEHOLD_INVITATION: Calendar,
  SYSTEM_MAINTENANCE: AlertCircle,
};

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  
  const isUnread = notification.status !== 'READ';
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || AlertCircle;

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    if (isUnread) {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'p-3 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer',
        isUnread ? 'border-l-primary bg-muted/20' : 'border-l-transparent',
        notification.priority === 'URGENT' && 'border-l-red-500',
        notification.priority === 'HIGH' && 'border-l-orange-500',
        notification.priority === 'MEDIUM' && 'border-l-yellow-500',
        notification.priority === 'LOW' && 'border-l-blue-500'
      )}
      onClick={handleAction}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                'text-sm font-medium truncate',
                isUnread && 'font-semibold'
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {notification.priority !== 'LOW' && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', priorityColors[notification.priority])}
                >
                  {notification.priority}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-1">
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleMarkAsRead}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {notification.actionText && notification.actionUrl && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
            >
              {notification.actionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
