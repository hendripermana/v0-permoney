'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function PWAInstallPrompt({ onInstall, onDismiss, className }: PWAInstallPromptProps) {
  const { canInstall, install, isLoading, displayMode } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if can install and not dismissed
    const timer = setTimeout(() => {
      if (canInstall && !isDismissed && displayMode === 'browser') {
        setShowPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [canInstall, isDismissed, displayMode]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt || !canInstall || displayMode !== 'browser') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="permoney-card shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-neon-green flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-black" />
              </div>
              <div>
                <CardTitle className="text-lg">Install Permoney</CardTitle>
                <CardDescription className="text-sm">
                  Get the full app experience
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
          <div className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Works offline</li>
              <li>• Faster loading</li>
              <li>• Native app experience</li>
              <li>• Push notifications</li>
            </ul>
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                disabled={isLoading}
                variant="permoney"
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? 'Installing...' : 'Install App'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
              >
                Not now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version for header or other locations
export function PWAInstallButton({ className }: { className?: string }) {
  const { canInstall, install, isLoading } = usePWA();

  if (!canInstall) return null;

  return (
    <Button
      onClick={install}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isLoading ? 'Installing...' : 'Install'}
    </Button>
  );
}
