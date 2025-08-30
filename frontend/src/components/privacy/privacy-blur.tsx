'use client';

import React from 'react';
import { usePrivacy } from './privacy-provider';
import { cn } from '@/lib/utils';

interface PrivacyBlurProps {
  children: React.ReactNode;
  type?: 'balance' | 'transaction' | 'sensitive';
  className?: string;
  fallback?: React.ReactNode;
  alwaysBlur?: boolean;
}

export function PrivacyBlur({ 
  children, 
  type = 'sensitive',
  className,
  fallback,
  alwaysBlur = false,
}: PrivacyBlurProps) {
  const { state } = usePrivacy();

  const shouldBlur = alwaysBlur || (state.isPrivacyMode && (
    (type === 'balance' && state.hideBalances) ||
    (type === 'transaction' && state.hideTransactionAmounts) ||
    (type === 'sensitive' && state.blurSensitiveData)
  ));

  if (shouldBlur) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn('relative', className)}>
        <div className="blur-sm select-none pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground border">
            Hidden
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Specialized components for common use cases
export function BalanceBlur({ children, className, ...props }: Omit<PrivacyBlurProps, 'type'>) {
  return (
    <PrivacyBlur type="balance" className={className} {...props}>
      {children}
    </PrivacyBlur>
  );
}

export function TransactionBlur({ children, className, ...props }: Omit<PrivacyBlurProps, 'type'>) {
  return (
    <PrivacyBlur type="transaction" className={className} {...props}>
      {children}
    </PrivacyBlur>
  );
}

export function SensitiveBlur({ children, className, ...props }: Omit<PrivacyBlurProps, 'type'>) {
  return (
    <PrivacyBlur type="sensitive" className={className} {...props}>
      {children}
    </PrivacyBlur>
  );
}
