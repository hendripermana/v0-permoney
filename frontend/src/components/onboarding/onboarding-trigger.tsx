'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useOnboarding } from './onboarding-provider';
import { OnboardingStep } from '@/types/onboarding';

interface OnboardingTriggerProps {
  steps: OnboardingStep[];
  variant?: 'button' | 'help' | 'floating';
  children?: React.ReactNode;
  className?: string;
}

export function OnboardingTrigger({ 
  steps, 
  variant = 'button', 
  children,
  className 
}: OnboardingTriggerProps) {
  const { startOnboarding, state } = useOnboarding();

  const handleStart = () => {
    startOnboarding(steps);
  };

  if (variant === 'floating') {
    return (
      <Button
        onClick={handleStart}
        className={`fixed bottom-6 right-6 z-30 rounded-full w-14 h-14 shadow-lg ${className}`}
        variant="permoney"
        size="sm"
        disabled={state.isActive}
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    );
  }

  if (variant === 'help') {
    return (
      <Button
        onClick={handleStart}
        variant="ghost"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
        disabled={state.isActive}
      >
        <HelpCircle className="h-4 w-4" />
        {children || 'Help'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleStart}
      variant="outline"
      className={`flex items-center gap-2 ${className}`}
      disabled={state.isActive}
    >
      <Play className="h-4 w-4" />
      {children || 'Start Tour'}
    </Button>
  );
}
