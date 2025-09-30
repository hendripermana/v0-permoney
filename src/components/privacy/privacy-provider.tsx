'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PrivacyState {
  isPrivacyMode: boolean;
  blurSensitiveData: boolean;
  hideBalances: boolean;
  hideTransactionAmounts: boolean;
  autoLockTimeout: number; // in minutes, 0 = disabled
  lastActivity: number;
}

interface PrivacyContextType {
  state: PrivacyState;
  togglePrivacyMode: () => void;
  enablePrivacyMode: () => void;
  disablePrivacyMode: () => void;
  updateSettings: (settings: Partial<PrivacyState>) => void;
  resetActivity: () => void;
}

const defaultState: PrivacyState = {
  isPrivacyMode: false,
  blurSensitiveData: true,
  hideBalances: true,
  hideTransactionAmounts: true,
  autoLockTimeout: 5, // 5 minutes default
  lastActivity: Date.now(),
};

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

interface PrivacyProviderProps {
  children: React.ReactNode;
}

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const [state, setState] = useState<PrivacyState>(defaultState);

  // Load privacy settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('permoney-privacy-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setState(prev => ({ ...prev, ...parsed, lastActivity: Date.now() }));
      } catch (error) {
        console.error('Failed to parse privacy settings:', error);
      }
    }
  }, []);

  // Save privacy settings to localStorage
  const saveSettings = useCallback((newState: Partial<PrivacyState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      const { lastActivity, ...settingsToSave } = updated;
      localStorage.setItem('permoney-privacy-settings', JSON.stringify(settingsToSave));
      return updated;
    });
  }, []);

  // Auto-lock functionality
  useEffect(() => {
    if (state.autoLockTimeout === 0) return;

    const checkAutoLock = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - state.lastActivity;
      const timeoutMs = state.autoLockTimeout * 60 * 1000;

      if (timeSinceLastActivity > timeoutMs && !state.isPrivacyMode) {
        enablePrivacyMode();
      }
    };

    const interval = setInterval(checkAutoLock, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [state.autoLockTimeout, state.lastActivity, state.isPrivacyMode]);

  // Track user activity
  useEffect(() => {
    const resetActivity = () => {
      setState(prev => ({ ...prev, lastActivity: Date.now() }));
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
    };
  }, []);

  const togglePrivacyMode = useCallback(() => {
    saveSettings({ 
      isPrivacyMode: !state.isPrivacyMode,
      lastActivity: Date.now(),
    });
  }, [state.isPrivacyMode, saveSettings]);

  const enablePrivacyMode = useCallback(() => {
    saveSettings({ 
      isPrivacyMode: true,
      lastActivity: Date.now(),
    });
  }, [saveSettings]);

  const disablePrivacyMode = useCallback(() => {
    saveSettings({ 
      isPrivacyMode: false,
      lastActivity: Date.now(),
    });
  }, [saveSettings]);

  const updateSettings = useCallback((settings: Partial<PrivacyState>) => {
    saveSettings({ 
      ...settings,
      lastActivity: Date.now(),
    });
  }, [saveSettings]);

  const resetActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: Date.now() }));
  }, []);

  const value: PrivacyContextType = {
    state,
    togglePrivacyMode,
    enablePrivacyMode,
    disablePrivacyMode,
    updateSettings,
    resetActivity,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}
