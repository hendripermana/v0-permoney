/**
 * Forms Index - Central export point for all form components
 * Smart Forms & Multi-step Wizards Implementation
 */

// Multi-step Wizard Components
export { MultiStepWizard } from './multi-step-wizard.tsx';
export { FormStep } from './form-step.tsx';
export { StepIndicator } from './step-indicator.tsx';
export { FormProgress } from './form-progress.tsx';

// Specialized Forms
export { TransactionForm } from './transaction-form.tsx';
export {
  TransactionTypeStep,
  BasicInfoStep,
  AdditionalDetailsStep,
  ReviewStep,
} from './transaction-steps.tsx';

// Form Utilities and Hooks
export { useFormWizard } from './use-form-wizard.tsx';
export {
  useFormValidation,
  useFieldValidation,
  useAsyncValidation,
} from './use-form-validation.tsx';

// Types
export * from './types.ts';

/**
 * Usage Examples:
 *
 * // Import form components
 * import { MultiStepWizard, TransactionForm, useFormWizard } from '@/components/forms'
 *
 * // Import specific form utilities
 * import { FormProgress, StepIndicator } from '@/components/forms'
 */
