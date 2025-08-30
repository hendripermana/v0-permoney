'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  WifiOff, 
  RefreshCw, 
  Home, 
  Mail, 
  ExternalLink,
  Info,
  XCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getErrorMessage, getLocalizedErrorMessage, ErrorCode } from '@/lib/error-messages';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'card' | 'alert' | 'inline';
  locale?: 'en' | 'id';
  className?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  variant = 'card',
  locale = 'en',
  className,
  showDetails = false,
}: ErrorDisplayProps) {
  const errorInfo = getLocalizedErrorMessage(error, locale);
  
  const handleContactSupport = () => {
    window.open('mailto:support@permoney.app?subject=Error Report&body=' + 
      encodeURIComponent(`Error: ${error.message || 'Unknown error'}\nTimestamp: ${new Date().toISOString()}`));
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const getIcon = () => {
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return <WifiOff className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getAlertVariant = () => {
    if (error.status >= 500) return 'destructive';
    if (error.status >= 400) return 'default';
    return 'default';
  };

  if (variant === 'alert') {
    return (
      <Alert variant={getAlertVariant()} className={className}>
        {getIcon()}
        <AlertTitle>{errorInfo.title}</AlertTitle>
        <AlertDescription className="mt-2">
          {errorInfo.message}
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {errorInfo.action}
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{errorInfo.message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            {errorInfo.action}
          </Button>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn('permoney-card max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          {getIcon()}
        </div>
        <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
        <CardDescription className="text-base">
          {errorInfo.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDetails && error.message && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2 text-muted-foreground">
              Technical Details
            </summary>
            <div className="bg-muted p-3 rounded-md overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify({
                  message: error.message,
                  status: error.status,
                  timestamp: new Date().toISOString(),
                }, null, 2)}
              </pre>
            </div>
          </details>
        )}
        
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full" variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              {errorInfo.action}
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={handleContactSupport} variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
          
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" className="w-full">
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized error components for common scenarios
interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorDisplay
      error={{ name: 'NetworkError', message: 'Network connection failed' }}
      onRetry={onRetry}
      variant="card"
      className={className}
    />
  );
}

interface ValidationErrorProps {
  errors: Record<string, string>;
  onDismiss?: () => void;
  className?: string;
}

export function ValidationError({ errors, onDismiss, className }: ValidationErrorProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {Object.entries(errors).map(([field, message]) => (
            <li key={field} className="text-sm">
              • <strong>{field}:</strong> {message}
            </li>
          ))}
        </ul>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="mt-3 h-8"
          >
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface SuccessMessageProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

export function SuccessMessage({ 
  title, 
  message, 
  action, 
  onDismiss, 
  className 
}: SuccessMessageProps) {
  return (
    <Alert className={cn('border-green-200 bg-green-50 text-green-800', className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {(action || onDismiss) && (
          <div className="flex items-center gap-2 mt-3">
            {action && (
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="h-8 border-green-300 text-green-700 hover:bg-green-100"
              >
                {action.label}
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 text-green-700 hover:bg-green-100"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
