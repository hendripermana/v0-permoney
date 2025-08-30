'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

interface PWAUpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function PWAUpdateNotification({ onUpdate, onDismiss }: PWAUpdateNotificationProps) {
  const { isUpdateAvailable, refreshApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpdate = () => {
    refreshApp();
    onUpdate?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!isUpdateAvailable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="permoney-card shadow-lg border-neon-green">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-neon-green flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-black" />
              </div>
              <div>
                <CardTitle className="text-lg">Update Available</CardTitle>
                <CardDescription className="text-sm">
                  A new version of Permoney is ready
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={handleUpdate}
              variant="permoney"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Now
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
