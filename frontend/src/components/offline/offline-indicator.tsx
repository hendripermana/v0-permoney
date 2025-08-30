'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  WifiOff, 
  Wifi, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { state, controls } = useOfflineQueue();
  const { isOnline, actions, isSyncing, syncErrors } = state;

  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const failedCount = actions.filter(a => a.status === 'failed').length;
  const totalQueued = pendingCount + failedCount;

  if (isOnline && totalQueued === 0) {
    return null; // Don't show indicator when online with no queued actions
  }

  const formatActionType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative flex items-center gap-2 px-3',
            !isOnline && 'text-orange-600 hover:text-orange-700',
            failedCount > 0 && 'text-red-600 hover:text-red-700'
          )}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          
          {totalQueued > 0 && (
            <Badge 
              variant={failedCount > 0 ? 'destructive' : 'secondary'}
              className="h-5 min-w-[20px] px-1.5 text-xs"
            >
              {totalQueued}
            </Badge>
          )}
          
          {isSyncing && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-600">Offline</span>
                </>
              )}
            </div>
            
            {totalQueued > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={controls.forceSync}
                  disabled={!isOnline || isSyncing}
                  className="h-7"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
                  Sync
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={controls.clearQueue}
                  className="h-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Queue Summary */}
          {totalQueued > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Queued Actions</h4>
                <div className="flex items-center gap-4 text-sm">
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span>{pendingCount} pending</span>
                    </div>
                  )}
                  {failedCount > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span>{failedCount} failed</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600">Sync Errors</h4>
                <div className="space-y-1">
                  {syncErrors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {syncErrors.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{syncErrors.length - 3} more errors
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={controls.retrySync}
                  className="w-full h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Failed Actions
                </Button>
              </div>
            </>
          )}

          {/* Action List */}
          {actions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Actions</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {actions.slice(0, 10).map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {action.status === 'pending' && (
                            <Clock className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          )}
                          {action.status === 'syncing' && (
                            <Loader2 className="h-3 w-3 text-neon-green animate-spin flex-shrink-0" />
                          )}
                          {action.status === 'synced' && (
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          )}
                          {action.status === 'failed' && (
                            <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {formatActionType(action.type)}
                            </div>
                            <div className="text-muted-foreground">
                              {formatTimestamp(action.timestamp)}
                            </div>
                          </div>
                        </div>
                        {action.retryCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {action.retryCount}/{action.maxRetries}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Empty State */}
          {totalQueued === 0 && isOnline && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All actions synced</p>
            </div>
          )}

          {/* Offline Message */}
          {!isOnline && totalQueued === 0 && (
            <div className="text-center py-4">
              <WifiOff className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                You&apos;re offline. Actions will be queued and synced when connection is restored.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
