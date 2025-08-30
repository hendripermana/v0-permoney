'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { PWAUpdateNotification } from '@/components/pwa-update-notification';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="pwa-safe-area">
        {children}
      </div>
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </div>
  );
}
