'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ProgressiveLoadingOptions {
  delay?: number;
  minLoadingTime?: number;
  showSkeletonAfter?: number;
}

export function useProgressiveLoading(
  isLoading: boolean,
  options: ProgressiveLoadingOptions = {}
) {
  const {
    delay = 0,
    minLoadingTime = 500,
    showSkeletonAfter = 200,
  } = options;

  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isVisible, setIsVisible] = useState(!isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    let skeletonTimeout: NodeJS.Timeout;
    let visibilityTimeout: NodeJS.Timeout;

    if (isLoading) {
      setLoadingStartTime(Date.now());
      setIsVisible(false);

      // Show skeleton after delay
      if (showSkeletonAfter > 0) {
        skeletonTimeout = setTimeout(() => {
          setShowSkeleton(true);
        }, showSkeletonAfter);
      } else {
        setShowSkeleton(true);
      }
    } else {
      // Calculate remaining time to meet minimum loading time
      const elapsedTime = loadingStartTime ? Date.now() - loadingStartTime : 0;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      visibilityTimeout = setTimeout(() => {
        setShowSkeleton(false);
        setIsVisible(true);
        setLoadingStartTime(null);
      }, remainingTime + delay);
    }

    return () => {
      if (skeletonTimeout) clearTimeout(skeletonTimeout);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
    };
  }, [isLoading, delay, minLoadingTime, showSkeletonAfter, loadingStartTime]);

  return {
    showSkeleton: isLoading && showSkeleton,
    showContent: !isLoading && isVisible,
    isTransitioning: isLoading || !isVisible,
  };
}

// Hook for staggered loading of list items
export function useStaggeredLoading<T>(
  items: T[],
  options: { delay?: number; batchSize?: number } = {}
) {
  const { delay = 100, batchSize = 1 } = options;
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < items.length) {
      const timeout = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + batchSize, items.length));
      }, delay);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visibleCount, items.length, delay, batchSize]);

  const reset = useCallback(() => {
    setVisibleCount(0);
  }, []);

  return {
    visibleItems: items.slice(0, visibleCount),
    visibleCount,
    isComplete: visibleCount >= items.length,
    reset,
  };
}

// Hook for managing multiple loading states
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearAll,
    loadingStates,
  };
}

// Hook for loading with timeout
export function useLoadingWithTimeout(
  initialLoading = false,
  timeoutMs = 30000
) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      setHasTimedOut(false);
      timeout = setTimeout(() => {
        setHasTimedOut(true);
        setIsLoading(false);
      }, timeoutMs);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, timeoutMs]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setHasTimedOut(false);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setHasTimedOut(false);
  }, []);

  return {
    isLoading,
    hasTimedOut,
    startLoading,
    stopLoading,
  };
}
