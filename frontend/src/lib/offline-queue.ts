"use client";

export interface QueuedAction {
  id: string;
  type: 'CREATE_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION' | 'CREATE_ACCOUNT' | 'UPDATE_ACCOUNT';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

export interface OfflineQueueState {
  actions: QueuedAction[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt?: Date;
  syncErrors: string[];
}

class OfflineQueue {
  private state: OfflineQueueState = {
    actions: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    syncErrors: [],
  };

  private listeners: Array<(state: OfflineQueueState) => void> = [];
  private syncInterval?: NodeJS.Timeout;
  private storageKey = 'permoney-offline-queue';
  private handleOnline = () => {
    this.updateState({ isOnline: true });
    void this.syncQueue();
  };
  private handleOffline = () => {
    this.updateState({ isOnline: false });
  };
  private handleVisibilityChange = () => {
    if (document.hidden || !this.state.isOnline) {
      return;
    }
    void this.syncQueue();
  };

  constructor() {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    this.loadFromStorage();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private setupEventListeners() {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    // Sync when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private startPeriodicSync() {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.actions.length > 0) {
        this.syncQueue();
      }
    }, 30000);
  }

  private loadFromStorage() {
    if (!this.isBrowserEnvironment() || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure before using
        if (parsed && Array.isArray(parsed.actions)) {
          this.state.actions = parsed.actions
            .filter((action: any) => this.isValidAction(action))
            .map((action: any) => ({
              ...action,
              timestamp: new Date(action.timestamp),
            }));
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage:', error);
      // Clear corrupted data
      localStorage.removeItem(this.storageKey);
    }
  }

  private isValidAction(action: any): boolean {
    return action &&
           typeof action.id === 'string' &&
           typeof action.type === 'string' &&
           action.data &&
           action.timestamp &&
           typeof action.retryCount === 'number' &&
           typeof action.maxRetries === 'number' &&
           ['pending', 'syncing', 'synced', 'failed'].includes(action.status);
  }

  private saveToStorage() {
    if (!this.isBrowserEnvironment() || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        actions: this.state.actions,
      }));
    } catch (error) {
      console.error('Failed to save offline queue to storage:', error);
    }
  }

  private updateState(updates: Partial<OfflineQueueState>) {
    this.state = { ...this.state, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  public subscribe(listener: (state: OfflineQueueState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): OfflineQueueState {
    return { ...this.state };
  }

  public addAction(
    type: QueuedAction['type'],
    data: unknown,
    options: { maxRetries?: number } = {}
  ): string {
    const action: QueuedAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      status: 'pending',
    };

    this.updateState({
      actions: [...this.state.actions, action],
    });

    // Try to sync immediately if online
    if (this.state.isOnline) {
      this.syncQueue();
    }

    return action.id;
  }

  public removeAction(id: string) {
    this.updateState({
      actions: this.state.actions.filter(action => action.id !== id),
    });
  }

  public async syncQueue(): Promise<void> {
    if (this.state.isSyncing || !this.state.isOnline) {
      return;
    }

    const pendingActions = this.state.actions.filter(
      action => action.status === 'pending' || action.status === 'failed'
    );

    if (pendingActions.length === 0) {
      return;
    }

    this.updateState({ 
      isSyncing: true, 
      lastSyncAttempt: new Date(),
      syncErrors: [],
    });

    const syncErrors: string[] = [];

    for (const action of pendingActions) {
      try {
        // Mark as syncing
        this.updateActionStatus(action.id, 'syncing');

        // Attempt to sync the action
        await this.syncAction(action);

        // Mark as synced and remove from queue
        this.removeAction(action.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        syncErrors.push(`${action.type}: ${errorMessage}`);

        // Increment retry count
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
          status: action.retryCount + 1 >= action.maxRetries ? 'failed' as const : 'pending' as const,
          error: errorMessage,
        };

        this.updateAction(updatedAction);
      }
    }

    this.updateState({ 
      isSyncing: false,
      syncErrors,
    });
  }

  private async syncAction(action: QueuedAction): Promise<void> {
    // This would integrate with your actual API
    const apiEndpoint = this.getApiEndpoint(action.type);
    const method = this.getHttpMethod(action.type);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here
          'X-Request-ID': action.id,
        },
        body: JSON.stringify(action.data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private getApiEndpoint(type: QueuedAction['type']): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    
    switch (type) {
      case 'CREATE_TRANSACTION':
        return `${baseUrl}/transactions`;
      case 'UPDATE_TRANSACTION':
        return `${baseUrl}/transactions/${type}`;
      case 'DELETE_TRANSACTION':
        return `${baseUrl}/transactions/${type}`;
      case 'CREATE_ACCOUNT':
        return `${baseUrl}/accounts`;
      case 'UPDATE_ACCOUNT':
        return `${baseUrl}/accounts/${type}`;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private getHttpMethod(type: QueuedAction['type']): string {
    switch (type) {
      case 'CREATE_TRANSACTION':
      case 'CREATE_ACCOUNT':
        return 'POST';
      case 'UPDATE_TRANSACTION':
      case 'UPDATE_ACCOUNT':
        return 'PUT';
      case 'DELETE_TRANSACTION':
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  private updateActionStatus(id: string, status: QueuedAction['status']) {
    const actions = this.state.actions.map(action =>
      action.id === id ? { ...action, status } : action
    );
    this.updateState({ actions });
  }

  private updateAction(updatedAction: QueuedAction) {
    const actions = this.state.actions.map(action =>
      action.id === updatedAction.id ? updatedAction : action
    );
    this.updateState({ actions });
  }

  public retryFailedActions() {
    const actions = this.state.actions.map(action =>
      action.status === 'failed' 
        ? { ...action, status: 'pending' as const, retryCount: 0, error: undefined }
        : action
    );
    this.updateState({ actions });
    
    if (this.state.isOnline) {
      this.syncQueue();
    }
  }

  public clearQueue() {
    this.updateState({ actions: [], syncErrors: [] });
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (!this.isBrowserEnvironment()) {
      return;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();
