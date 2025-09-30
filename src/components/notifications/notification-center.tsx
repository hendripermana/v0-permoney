'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  CreditCard,
  Shield,
  RefreshCw as Sync,
  Calendar
} from 'lucide-react';
import { useNotifications, Notification } from './notification-provider';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  system: Info,
  budget: CreditCard,
  transaction: CreditCard,
  security: Shield,
  sync: Sync,
  reminder: Calendar,
};

const TYPE_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const PRIORITY_COLORS = {
  low: 'text-muted-foreground',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const CategoryIcon = CATEGORY_ICONS[notification.category || 'system'];
  const TypeIcon = TYPE_ICONS[notification.type];
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn(
      'flex gap-3 p-3 rounded-lg border transition-colors',
      notification.read ? 'bg-muted/30' : 'bg-background hover:bg-accent/50'
    )}>
      <div className="flex-shrink-0 mt-0.5">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          notification.type === 'success' && 'bg-green-100 text-green-600',
          notification.type === 'error' && 'bg-red-100 text-red-600',
          notification.type === 'warning' && 'bg-orange-100 text-orange-600',
          notification.type === 'info' && 'bg-blue-100 text-blue-600'
        )}>
          <TypeIcon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                'font-medium text-sm',
                !notification.read && 'text-foreground',
                notification.read && 'text-muted-foreground'
              )}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 bg-neon-green rounded-full" />
              )}
            </div>
            <p className={cn(
              'text-sm mt-1',
              notification.read ? 'text-muted-foreground' : 'text-foreground/80'
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(notification.timestamp)}
              </div>
              
              {notification.category && (
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {notification.category}
                </Badge>
              )}
              
              <Badge 
                variant="outline" 
                className={cn('text-xs', PRIORITY_COLORS[notification.priority])}
              >
                {notification.priority}
              </Badge>
            </div>
            
            {notification.actionUrl && notification.actionLabel && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2 text-xs"
                onClick={() => window.location.href = notification.actionUrl!}
              >
                {notification.actionLabel}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMarkAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(notification.id)}
              title="Remove"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationCenterProps {
  trigger?: React.ReactNode;
}

export function NotificationCenter({ trigger }: NotificationCenterProps) {
  const {
    state,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    togglePanel,
  } = useNotifications();

  const { notifications, unreadCount, isOpen } = state;

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2"
      onClick={togglePanel}
    >
      {unreadCount > 0 ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={togglePanel}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
