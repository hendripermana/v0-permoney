'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { OnboardingTooltip } from './onboarding-tooltip';
import { useOnboarding } from './onboarding-provider';
import { OnboardingStep } from '@/types/onboarding';

interface OnboardingOverlayProps {
  steps: OnboardingStep[];
}

export function OnboardingOverlay({ steps }: OnboardingOverlayProps) {
  const {
    state,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
  } = useOnboarding();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Scroll target element into view when step changes
    if (state.currentStep?.target) {
      const targetElement = document.querySelector(state.currentStep.target);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    }
  }, [state.currentStep]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isActive || !state.isVisible) return;

      switch (event.key) {
        case 'Escape':
          completeOnboarding();
          break;
        case 'ArrowRight':
        case 'Enter':
          event.preventDefault();
          nextStep(steps);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          previousStep(steps);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, state.isVisible, nextStep, previousStep, completeOnboarding, steps]);

  if (!mounted || !state.isActive || !state.isVisible || !state.currentStep) {
    return null;
  }

  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep?.id);
  const stepNumber = currentStepIndex + 1;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    // Execute step action if defined
    if (state.currentStep?.action) {
      executeStepAction(state.currentStep.action);
    }
    nextStep(steps);
  };

  const handlePrevious = () => {
    previousStep(steps);
  };

  const handleSkip = () => {
    skipStep(steps);
  };

  const executeStepAction = (action: NonNullable<OnboardingStep['action']>) => {
    switch (action.type) {
      case 'click':
        if (action.target) {
          const element = document.querySelector(action.target) as HTMLElement;
          if (element) {
            setTimeout(() => element.click(), action.delay || 0);
          }
        }
        break;
      case 'input':
        if (action.target && action.value) {
          const element = document.querySelector(action.target) as HTMLInputElement;
          if (element) {
            setTimeout(() => {
              element.focus();
              element.value = action.value || '';
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }, action.delay || 0);
          }
        }
        break;
      case 'navigate':
        if (action.value) {
          setTimeout(() => {
            window.location.href = action.value || '';
          }, action.delay || 0);
        }
        break;
      case 'wait':
        // Just wait for the specified delay
        break;
    }
  };

  return createPortal(
    <OnboardingTooltip
      step={state.currentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      onComplete={completeOnboarding}
      isFirst={isFirst}
      isLast={isLast}
      stepNumber={stepNumber}
      totalSteps={steps.length}
    />,
    document.body
  );
}
