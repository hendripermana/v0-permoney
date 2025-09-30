'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { OnboardingStep, OnboardingState, OnboardingContextType } from '@/types/onboarding';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    currentStep: null,
    completedSteps: [],
    skippedSteps: [],
    isVisible: false,
  });

  // Load onboarding state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('permoney-onboarding');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  // Save onboarding state to localStorage
  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      localStorage.setItem('permoney-onboarding', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const startOnboarding = useCallback((steps: OnboardingStep[]) => {
    const firstStep = steps[0];
    saveState({
      isActive: true,
      currentStep: firstStep || null,
      completedSteps: [],
      skippedSteps: [],
      isVisible: true,
    });
  }, [saveState]);

  const nextStep = useCallback((steps: OnboardingStep[]) => {
    if (!state.currentStep) return;

    const currentIndex = steps.findIndex(step => step.id === state.currentStep?.id);
    const nextStepIndex = currentIndex + 1;

    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex];
      saveState({
        currentStep: nextStep,
        completedSteps: [...state.completedSteps, state.currentStep.id],
      });
    } else {
      // Onboarding complete
      completeOnboarding();
    }
  }, [state.currentStep, state.completedSteps, saveState]);

  const previousStep = useCallback((steps: OnboardingStep[]) => {
    if (!state.currentStep) return;

    const currentIndex = steps.findIndex(step => step.id === state.currentStep?.id);
    const previousStepIndex = currentIndex - 1;

    if (previousStepIndex >= 0) {
      const previousStep = steps[previousStepIndex];
      const newCompletedSteps = state.completedSteps.filter(id => id !== previousStep.id);
      
      saveState({
        currentStep: previousStep,
        completedSteps: newCompletedSteps,
      });
    }
  }, [state.currentStep, state.completedSteps, saveState]);

  const skipStep = useCallback((steps: OnboardingStep[]) => {
    if (!state.currentStep) return;

    const skippedStepId = state.currentStep.id;
    nextStep(steps);
    
    saveState({
      skippedSteps: [...state.skippedSteps, skippedStepId],
    });
  }, [state.currentStep, state.skippedSteps, nextStep, saveState]);

  const goToStep = useCallback((stepId: string, steps: OnboardingStep[]) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      saveState({
        currentStep: step,
        isVisible: true,
      });
    }
  }, [saveState]);

  const completeOnboarding = useCallback(() => {
    saveState({
      isActive: false,
      currentStep: null,
      isVisible: false,
    });
  }, [saveState]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('permoney-onboarding');
    setState({
      isActive: false,
      currentStep: null,
      completedSteps: [],
      skippedSteps: [],
      isVisible: false,
    });
  }, []);

  const hideOnboarding = useCallback(() => {
    saveState({ isVisible: false });
  }, [saveState]);

  const showOnboarding = useCallback(() => {
    saveState({ isVisible: true });
  }, [saveState]);

  const isStepCompleted = useCallback((stepId: string) => {
    return state.completedSteps.includes(stepId);
  }, [state.completedSteps]);

  const isStepSkipped = useCallback((stepId: string) => {
    return state.skippedSteps.includes(stepId);
  }, [state.skippedSteps]);

  const value: OnboardingContextType = {
    state,
    startOnboarding,
    nextStep,
    previousStep,
    skipStep,
    goToStep,
    completeOnboarding,
    resetOnboarding,
    hideOnboarding,
    showOnboarding,
    isStepCompleted,
    isStepSkipped,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
