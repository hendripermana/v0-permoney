'use client';

import { useState, useEffect, useCallback } from 'react';
import { PWAInstaller, registerServiceWorker, isPWA, getPWADisplayMode } from '@/lib/pwa';

interface UsePWAReturn {
  isInstalled: boolean;
  canInstall: boolean;
  isLoading: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
  install: () => Promise<boolean>;
  isUpdateAvailable: boolean;
  refreshApp: () => void;
}

export function usePWA(): UsePWAReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'browser' | 'standalone' | 'minimal-ui' | 'fullscreen'>('browser');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installer, setInstaller] = useState<PWAInstaller | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);

    // Register service worker
    registerServiceWorker();

    // Check initial state
    setIsInstalled(isPWA());
    setDisplayMode(getPWADisplayMode());
    setCanInstall(pwaInstaller.canInstall());
    setIsLoading(false);

    // Listen for install prompt changes
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Check display mode changes
    const mediaQueries = [
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: minimal-ui)'),
    ];

    const handleDisplayModeChange = () => {
      setDisplayMode(getPWADisplayMode());
      setIsInstalled(isPWA());
    };

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleDisplayModeChange);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleDisplayModeChange);
      });
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!installer) return false;
    
    setIsLoading(true);
    try {
      const result = await installer.install();
      if (result) {
        setIsInstalled(true);
        setCanInstall(false);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [installer]);

  const refreshApp = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return {
    isInstalled,
    canInstall,
    isLoading,
    displayMode,
    install,
    isUpdateAvailable,
    refreshApp,
  };
}
