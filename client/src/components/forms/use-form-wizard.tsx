/**
 * useFormWizard Hook
 * Custom hook for managing multi-step form state and navigation
 */

import { useReducer, useCallback, useEffect } from 'react';
import { FormWizardState, FormWizardAction, WizardStep } from './types';

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
          [action.payload.stepId]: {
            ...state.stepData[action.payload.stepId],
            ...action.payload.data,
          },
        },
      };

    case 'SET_STEP_VALID':
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

interface UseFormWizardOptions {
  steps: WizardStep[];
  initialData?: Record<string, any>;
  onStepChange?: (stepIndex: number, stepData: any) => void;
  onComplete?: (allData: Record<string, any>) => void | Promise<void>;
  autoSave?: {
    enabled: boolean;
    key: string;
    interval?: number;
  };
}

export function useFormWizard({
  steps,
  initialData = {},
  onStepChange,
  onComplete,
  autoSave,
}: UseFormWizardOptions) {
  // Initialize state
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
  const canProceed = state.isValid || currentStepConfig?.canSkip;
  const progressPercentage = ((state.currentStep + 1) / state.totalSteps) * 100;

  // Navigation functions
  const goToNextStep = useCallback(() => {
    if (canProceed && !isLastStep) {
      dispatch({ type: 'NEXT_STEP' });
      const newStepIndex = state.currentStep + 1;
      onStepChange?.(newStepIndex, state.stepData[steps[newStepIndex]?.id]);
    }
  }, [
    canProceed,
    isLastStep,
    state.currentStep,
    state.stepData,
    steps,
    onStepChange,
  ]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      dispatch({ type: 'PREVIOUS_STEP' });
      const newStepIndex = state.currentStep - 1;
      onStepChange?.(newStepIndex, state.stepData[steps[newStepIndex]?.id]);
    }
  }, [isFirstStep, state.currentStep, state.stepData, steps, onStepChange]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < state.totalSteps) {
        // Check if step is accessible (completed or current/previous)
        const isAccessible =
          stepIndex <= state.currentStep ||
          state.completedSteps.includes(stepIndex);
        if (isAccessible) {
          dispatch({ type: 'GO_TO_STEP', payload: stepIndex });
          onStepChange?.(stepIndex, state.stepData[steps[stepIndex]?.id]);
        }
      }
    },
    [
      state.currentStep,
      state.completedSteps,
      state.totalSteps,
      state.stepData,
      steps,
      onStepChange,
    ]
  );

  // Data management
  const updateStepData = useCallback((stepId: string, data: any) => {
    dispatch({
      type: 'UPDATE_STEP_DATA',
      payload: { stepId, data },
    });
  }, []);

  const updateCurrentStepData = useCallback(
    (data: any) => {
      updateStepData(currentStepConfig.id, data);
    },
    [currentStepConfig.id, updateStepData]
  );

  const getStepData = useCallback(
    (stepId: string) => {
      return state.stepData[stepId] || {};
    },
    [state.stepData]
  );

  const getCurrentStepData = useCallback(() => {
    return getStepData(currentStepConfig.id);
  }, [currentStepConfig.id, getStepData]);

  const getAllData = useCallback(() => {
    return state.stepData;
  }, [state.stepData]);

  // Validation
  const setStepValid = useCallback(
    (isValid: boolean) => {
      dispatch({
        type: 'SET_STEP_VALID',
        payload: { stepIndex: state.currentStep, isValid },
      });
    },
    [state.currentStep]
  );

  const validateCurrentStep = useCallback(async () => {
    if (currentStepConfig.validation) {
      try {
        const stepData = getCurrentStepData();
        await currentStepConfig.validation.parseAsync(stepData);
        setStepValid(true);
        return true;
      } catch (error) {
        setStepValid(false);
        // Handle validation errors
        if (error instanceof Error) {
          dispatch({
            type: 'SET_ERRORS',
            payload: { [currentStepConfig.id]: [error.message] },
          });
        }
        return false;
      }
    }
    return true;
  }, [currentStepConfig, getCurrentStepData, setStepValid]);

  // Form completion
  const completeWizard = useCallback(async () => {
    if (isLastStep && canProceed) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await onComplete?.(state.stepData);
        // Clear auto-saved data on successful completion
        if (autoSave?.enabled && autoSave.key) {
          localStorage.removeItem(autoSave.key);
        }
      } catch (error) {
        console.error('Form completion error:', error);
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [isLastStep, canProceed, onComplete, state.stepData, autoSave]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET_WIZARD' });
    if (autoSave?.enabled && autoSave.key) {
      localStorage.removeItem(autoSave.key);
    }
  }, [autoSave]);

  // Error management
  const setErrors = useCallback((errors: Record<string, string[]>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'SET_ERRORS', payload: {} });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave?.enabled && autoSave.key) {
      const saveData = () => {
        const dataToSave = {
          currentStep: state.currentStep,
          stepData: state.stepData,
          completedSteps: state.completedSteps,
          timestamp: Date.now(),
        };
        localStorage.setItem(autoSave.key, JSON.stringify(dataToSave));
      };

      const interval = setInterval(saveData, autoSave.interval || 30000); // Default 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoSave, state.currentStep, state.stepData, state.completedSteps]);

  // Restore auto-saved data on mount
  useEffect(() => {
    if (autoSave?.enabled && autoSave.key) {
      const savedData = localStorage.getItem(autoSave.key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Check if data is not too old (24 hours)
          const isDataFresh =
            Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;
          if (isDataFresh && parsedData.stepData) {
            // Restore step data
            Object.entries(parsedData.stepData).forEach(([stepId, data]) => {
              updateStepData(stepId, data);
            });
            // Restore current step if valid
            if (
              parsedData.currentStep >= 0 &&
              parsedData.currentStep < steps.length
            ) {
              dispatch({ type: 'GO_TO_STEP', payload: parsedData.currentStep });
            }
            // Restore completed steps
            if (Array.isArray(parsedData.completedSteps)) {
              parsedData.completedSteps.forEach((stepIndex: number) => {
                if (stepIndex >= 0 && stepIndex < steps.length) {
                  // Mark step as completed
                  dispatch({ type: 'NEXT_STEP' });
                  dispatch({ type: 'PREVIOUS_STEP' });
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to restore auto-saved data:', error);
          localStorage.removeItem(autoSave.key);
        }
      }
    }
  }, [autoSave, steps.length, updateStepData]);

  return {
    // State
    state,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    canProceed,
    progressPercentage,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // Data management
    updateStepData,
    updateCurrentStepData,
    getStepData,
    getCurrentStepData,
    getAllData,

    // Validation
    setStepValid,
    validateCurrentStep,

    // Form completion
    completeWizard,
    resetWizard,

    // Error management
    setErrors,
    clearErrors,
    setLoading,
  };
}
