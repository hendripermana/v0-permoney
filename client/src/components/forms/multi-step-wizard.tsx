/**
 * Multi-Step Wizard Component
 * Core component for creating sophisticated multi-step forms with validation and progress tracking
 */

import React, { useReducer, useEffect, useCallback } from 'react';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MultiStepWizardProps,
  FormWizardState,
  FormWizardAction,
  WizardStep,
} from './types';

// Wizard State Reducer
function wizardReducer(
  state: FormWizardState,
  action: FormWizardAction
): FormWizardState {
  switch (action.type) {
    case 'NEXT_STEP':
      if (state.currentStep < state.totalSteps - 1) {
        const nextStep = state.currentStep + 1;
        const newCompletedSteps = [...state.completedSteps];
        if (!newCompletedSteps.includes(state.currentStep)) {
          newCompletedSteps.push(state.currentStep);
        }
        return {
          ...state,
          currentStep: nextStep,
          completedSteps: newCompletedSteps,
        };
      }
      return state;

    case 'PREVIOUS_STEP':
      if (state.currentStep > 0) {
        return {
          ...state,
          currentStep: state.currentStep - 1,
        };
      }
      return state;

    case 'GO_TO_STEP':
      if (action.payload >= 0 && action.payload < state.totalSteps) {
        return {
          ...state,
          currentStep: action.payload,
        };
      }
      return state;

    case 'UPDATE_STEP_DATA':
      return {
        ...state,
        stepData: {
          ...state.stepData,
          [action.payload.stepId]: action.payload.data,
        },
      };

    case 'SET_STEP_VALID':
      // Update validation state for current step
      return {
        ...state,
        isValid: action.payload.isValid,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };

    case 'RESET_WIZARD':
      return {
        currentStep: 0,
        totalSteps: state.totalSteps,
        completedSteps: [],
        stepData: {},
        isValid: false,
        isLoading: false,
        errors: {},
      };

    default:
      return state;
  }
}

export function MultiStepWizard({
  steps,
  onStepChange,
  onComplete,
  onCancel,
  autoSave,
  showProgress = true,
  allowSkipping = false,
  title,
  description,
  initialData = {},
  isLoading: externalLoading = false,
  className,
}: MultiStepWizardProps) {
  // Initialize wizard state
  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: 0,
    totalSteps: steps.length,
    completedSteps: [],
    stepData: initialData,
    isValid: false,
    isLoading: false,
    errors: {},
  });

  const currentStepConfig = steps[state.currentStep];
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.totalSteps - 1;
  const canProceed =
    state.isValid || (allowSkipping && currentStepConfig?.canSkip);
  const progressPercentage = ((state.currentStep + 1) / state.totalSteps) * 100;

  // Handle step navigation
  const goToNextStep = useCallback(() => {
    if (canProceed) {
      dispatch({ type: 'NEXT_STEP' });
      onStepChange?.(state.currentStep + 1);
    }
  }, [canProceed, onStepChange, state.currentStep]);

  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
    onStepChange?.(state.currentStep - 1);
  }, [onStepChange, state.currentStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      dispatch({ type: 'GO_TO_STEP', payload: stepIndex });
      onStepChange?.(stepIndex);
    },
    [onStepChange]
  );

  // Handle step data updates
  const updateStepData = useCallback(
    (data: any) => {
      dispatch({
        type: 'UPDATE_STEP_DATA',
        payload: { stepId: currentStepConfig.id, data },
      });
    },
    [currentStepConfig.id]
  );

  // Handle form completion
  const handleComplete = useCallback(async () => {
    if (isLastStep && canProceed) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await onComplete?.(state.stepData);
      } catch (error) {
        console.error('Form completion error:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [isLastStep, canProceed, onComplete, state.stepData]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave?.enabled && autoSave.key) {
      const saveData = () => {
        localStorage.setItem(autoSave.key, JSON.stringify(state.stepData));
        autoSave.onSave?.(state.stepData);
      };

      const interval = setInterval(saveData, autoSave.interval || 30000); // Default 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoSave, state.stepData]);

  // Restore auto-saved data on mount
  useEffect(() => {
    if (autoSave?.enabled && autoSave.key) {
      const savedData = localStorage.getItem(autoSave.key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          dispatch({
            type: 'UPDATE_STEP_DATA',
            payload: { stepId: 'restore', data: parsedData },
          });
          autoSave.onRestore?.(parsedData);
        } catch (error) {
          console.error('Failed to restore auto-saved data:', error);
        }
      }
    }
  }, [autoSave]);

  // Render current step component
  const CurrentStepComponent = currentStepConfig.component;
  const currentStepData = state.stepData[currentStepConfig.id] || {};

  return (
    <PermoneyCard
      className={cn('glassmorphism p-6 slide-up max-w-4xl mx-auto', className)}
    >
      {/* Header */}
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {state.currentStep + 1} of {state.totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const isCompleted = state.completedSteps.includes(index);
              const isCurrent = index === state.currentStep;
              const isAccessible =
                index <= state.currentStep ||
                state.completedSteps.includes(index);

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={cn(
                    'flex flex-col items-center space-y-2 p-2 rounded-lg transition-all duration-200',
                    'hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed',
                    isCurrent && 'bg-accent',
                    isCompleted && 'text-neon-green'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isCompleted && 'bg-neon-green text-primary-foreground',
                      isCurrent &&
                        !isCompleted &&
                        'bg-primary text-primary-foreground',
                      !isCurrent &&
                        !isCompleted &&
                        'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="text-xs text-center max-w-20 truncate">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {currentStepConfig.title}
          </h3>
          {currentStepConfig.description && (
            <p className="text-muted-foreground">
              {currentStepConfig.description}
            </p>
          )}
        </div>

        {CurrentStepComponent ? (
          <CurrentStepComponent
            data={currentStepData}
            onChange={updateStepData}
            errors={state.errors}
            isLoading={state.isLoading || externalLoading}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Step component not configured</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={isFirstStep ? onCancel : goToPreviousStep}
          disabled={state.isLoading || externalLoading}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {isFirstStep ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex items-center gap-2">
          {allowSkipping && currentStepConfig?.canSkip && !state.isValid && (
            <Button
              variant="ghost"
              onClick={goToNextStep}
              disabled={state.isLoading || externalLoading || isLastStep}
            >
              Skip
            </Button>
          )}

          <Button
            onClick={isLastStep ? handleComplete : goToNextStep}
            disabled={!canProceed || state.isLoading || externalLoading}
            className="flex items-center gap-2"
          >
            {state.isLoading || externalLoading ? (
              'Processing...'
            ) : isLastStep ? (
              'Complete'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Auto-save indicator */}
      {autoSave?.enabled && (
        <div className="mt-4 text-center">
          <span className="text-xs text-muted-foreground">
            Changes are automatically saved
          </span>
        </div>
      )}
    </PermoneyCard>
  );
}
