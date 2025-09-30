'use client';

import { useState, useEffect } from 'react';
import { offlineQueue, OfflineQueueState, QueuedAction } from '@/lib/offline-queue';
import { useToastActions } from '@/hooks/use-toast';

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineQueueState>(offlineQueue.getState());
  const { showSyncStatus } = useToastActions();

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(setState);
    return unsubscribe;
  }, []);

  // Show toast notifications for sync status
  useEffect(() => {
    if (state.isSyncing) {
      const pendingCount = state.actions.filter(a => a.status === 'pending' || a.status === 'failed').length;
      showSyncStatus('starting', {
        message: `Syncing ${pendingCount} pending actions...`,
      });
    } else if (state.lastSyncAttempt) {
      const hasErrors = state.syncErrors.length > 0;
      if (hasErrors) {
        showSyncStatus('error', {
          message: `Failed to sync ${state.syncErrors.length} actions`,
          onRetry: () => offlineQueue.retryFailedActions(),
        });
      } else {
        const syncedCount = state.actions.filter(a => a.status === 'synced').length;
        if (syncedCount > 0) {
          showSyncStatus('success', {
            message: `Successfully synced ${syncedCount} actions`,
          });
        }
      }
    }
  }, [state.isSyncing, state.lastSyncAttempt, state.syncErrors, showSyncStatus]);

  const addTransaction = (transactionData: any) => {
    return offlineQueue.addAction('CREATE_TRANSACTION', transactionData);
  };

  const updateTransaction = (id: string, transactionData: any) => {
    return offlineQueue.addAction('UPDATE_TRANSACTION', { id, ...transactionData });
  };

  const deleteTransaction = (id: string) => {
    return offlineQueue.addAction('DELETE_TRANSACTION', { id });
  };

  const addAccount = (accountData: any) => {
    return offlineQueue.addAction('CREATE_ACCOUNT', accountData);
  };

  const updateAccount = (id: string, accountData: any) => {
    return offlineQueue.addAction('UPDATE_ACCOUNT', { id, ...accountData });
  };

  const retrySync = () => {
    offlineQueue.retryFailedActions();
  };

  const clearQueue = () => {
    offlineQueue.clearQueue();
  };

  const forceSync = () => {
    offlineQueue.syncQueue();
  };

  return {
    state,
    actions: {
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
    },
    controls: {
      retrySync,
      clearQueue,
      forceSync,
    },
  };
}

// Hook for offline-aware API calls
export function useOfflineAwareApi() {
  const { state } = useOfflineQueue();

  const makeRequest = async <T>(
    request: () => Promise<T>,
    fallbackAction?: {
      type: QueuedAction['type'];
      data: any;
    }
  ): Promise<T | null> => {
    if (state.isOnline) {
      try {
        return await request();
      } catch (error) {
        // If request fails and we have a fallback, queue it
        if (fallbackAction) {
          offlineQueue.addAction(fallbackAction.type, fallbackAction.data);
        }
        throw error;
      }
    } else {
      // We're offline, queue the action if provided
      if (fallbackAction) {
        offlineQueue.addAction(fallbackAction.type, fallbackAction.data);
        return null; // Indicate that the action was queued
      }
      throw new Error('No internet connection and no fallback action provided');
    }
  };

  return {
    makeRequest,
    isOnline: state.isOnline,
  };
}
