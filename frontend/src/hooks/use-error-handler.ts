'use client';

import { useCallback } from 'react';
import { useToastActions } from '@/hooks/use-toast';
import { useNotificationActions } from '@/components/notifications';
import { getErrorMessage, classifyError } from '@/lib/error-messages';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  showNotification?: boolean;
  logError?: boolean;
  onError?: (error: any) => void;
  context?: string;
}

export function useErrorHandler() {
  const { showError, showWarning } = useToastActions();
  const { showError: showErrorNotification } = useNotificationActions();

  const handleError = useCallback((
    error: any, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      showNotification = false,
      logError = true,
      onError,
      context = 'Unknown',
    } = options;

    // Log error for debugging
    if (logError) {
      console.error(`[${context}] Error:`, error);
      
      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry, LogRocket, etc.
        // Sentry.captureException(error, { tags: { context } });
      }
    }

    // Get user-friendly error message
    const errorInfo = getErrorMessage(error);
    const errorCode = classifyError(error);

    // Show toast notification
    if (showToast) {
      if (errorCode === 'OFFLINE_ERROR' || errorCode === 'SYNC_FAILED') {
        showWarning(errorInfo.title, errorInfo.message, {
          duration: 6000,
          action: {
            label: errorInfo.action,
            onClick: () => window.location.reload(),
          },
        });
      } else {
        showError(errorInfo.title, errorInfo.message, {
          persistent: ['SERVER_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'].includes(errorCode),
          retryable: ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SYNC_FAILED'].includes(errorCode),
          onRetry: () => {
            // Trigger retry logic if available
            if (onError) {
              onError(error);
            }
          },
        });
      }
    }

    // Show persistent notification for important errors
    if (showNotification) {
      showErrorNotification(errorInfo.title, errorInfo.message, {
        category: 'system',
        priority: ['SERVER_ERROR', 'UNAUTHORIZED'].includes(errorCode) ? 'high' : 'medium',
        persistent: true,
        actionLabel: errorInfo.action,
        actionUrl: errorCode === 'UNAUTHORIZED' ? '/login' : undefined,
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }

    return errorInfo;
  }, [showError, showWarning, showErrorNotification]);

  // Specialized error handlers
  const handleApiError = useCallback((error: any, context = 'API') => {
    return handleError(error, {
      context,
      showToast: true,
      showNotification: error.status >= 500, // Show notification for server errors
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: any, context = 'Validation') => {
    return handleError(error, {
      context,
      showToast: true,
      showNotification: false, // Don't show notifications for validation errors
    });
  }, [handleError]);

  const handleNetworkError = useCallback((error: any, context = 'Network') => {
    return handleError(error, {
      context,
      showToast: true,
      showNotification: true, // Always show notification for network issues
    });
  }, [handleError]);

  const handleSyncError = useCallback((error: any, context = 'Sync') => {
    return handleError(error, {
      context,
      showToast: true,
      showNotification: true,
    });
  }, [handleError]);

  // Async error wrapper
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, options);
        return null;
      }
    };
  }, [handleError]);

  // React Query error handler
  const createQueryErrorHandler = useCallback((context: string) => {
    return (error: any) => {
      handleApiError(error, context);
    };
  }, [handleApiError]);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    handleNetworkError,
    handleSyncError,
    withErrorHandling,
    createQueryErrorHandler,
  };
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // You could show a toast or notification here
    // But be careful not to spam the user with too many error messages
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(event.error);
    }
  });
}
