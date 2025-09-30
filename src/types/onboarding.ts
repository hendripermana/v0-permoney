export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'input' | 'navigate' | 'wait';
    target?: string;
    value?: string;
    delay?: number;
  };
  optional?: boolean;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
}

export interface OnboardingState {
  isActive: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: string[];
  skippedSteps: string[];
  isVisible: boolean;
}

export interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: (steps: OnboardingStep[]) => void;
  nextStep: (steps: OnboardingStep[]) => void;
  previousStep: (steps: OnboardingStep[]) => void;
  skipStep: (steps: OnboardingStep[]) => void;
  goToStep: (stepId: string, steps: OnboardingStep[]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  hideOnboarding: () => void;
  showOnboarding: () => void;
  isStepCompleted: (stepId: string) => boolean;
  isStepSkipped: (stepId: string) => boolean;
}

export interface OnboardingTooltipProps {
  step: OnboardingStep;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}
