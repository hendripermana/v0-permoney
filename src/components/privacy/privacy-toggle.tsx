'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from './privacy-provider';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PrivacyToggle({ 
  variant = 'icon', 
  size = 'md',
  className 
}: PrivacyToggleProps) {
  const { state, togglePrivacyMode } = usePrivacy();

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  const buttonSize = size === 'md' ? 'default' : size;

  if (variant === 'button') {
    return (
      <Button
        onClick={togglePrivacyMode}
        variant={state.isPrivacyMode ? 'default' : 'outline'}
        size={buttonSize}
        className={cn('flex items-center gap-2', className)}
      >
        {state.isPrivacyMode ? (
          <>
            <EyeOff className={iconSize} />
            Privacy On
          </>
        ) : (
          <>
            <Eye className={iconSize} />
            Privacy Off
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={togglePrivacyMode}
      variant="ghost"
      size={buttonSize}
      className={cn(
        'p-2 rounded-full transition-colors',
        state.isPrivacyMode 
          ? 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20' 
          : 'hover:bg-muted',
        className
      )}
      title={state.isPrivacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Mode'}
    >
      {state.isPrivacyMode ? (
        <EyeOff className={iconSize} />
      ) : (
        <Eye className={iconSize} />
      )}
    </Button>
  );
}
