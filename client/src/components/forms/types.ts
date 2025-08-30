/**
 * Form Types - TypeScript definitions for Smart Forms & Multi-step Wizards
 */

import { ReactNode } from 'react';
import { z } from 'zod';

// Core Form Step Interface
export interface FormStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

// Wizard Step Configuration
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component?: React.ComponentType<any>;
  validation?: z.ZodSchema<any>;
  isOptional?: boolean;
  canSkip?: boolean;
}

// Form Wizard State Management
export interface FormWizardState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepData: Record<string, any>;
  isValid: boolean;
  isLoading: boolean;
  errors: Record<string, string[]>;
}

// Form Wizard Actions
export type FormWizardAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'UPDATE_STEP_DATA'; payload: { stepId: string; data: any } }
  | { type: 'SET_STEP_VALID'; payload: { stepIndex: number; isValid: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: Record<string, string[]> }
  | { type: 'RESET_WIZARD' };

// Progress Indicator Props
export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepTitles?: string[];
  variant?: 'dots' | 'line' | 'circle';
  showLabels?: boolean;
  className?: string;
}

// Auto-save Configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  key: string; // localStorage key
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
}

// Form Validation Hook Return Type
export interface FormValidationReturn {
  errors: Record<string, string[]>;
  isValid: boolean;
  validateField: (field: string, value: any) => boolean;
  validateAll: (data: any) => boolean;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
}

// Transaction Form Data
export interface TransactionFormData {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: Date;
  account?: string;
  tags?: string[];
  notes?: string;
  location?: string;
  receipt?: string; // File path or base64
}

// Account Setup Data
export interface AccountSetupData {
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  bankName: string;
  initialBalance: number;
  currency: string;
  isDefault: boolean;
}

// Budget Creation Data
export interface BudgetCreationData {
  name: string;
  period: 'weekly' | 'monthly' | 'yearly';
  totalAmount: number;
  categories: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  startDate: Date;
  endDate: Date;
}

// Profile Management Data
export interface ProfileManagementData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
  };
  preferences: {
    currency: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    sessionTimeout: number;
  };
}

// Form Component Base Props
export interface BaseFormProps {
  onSubmit?: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  isLoading?: boolean;
  className?: string;
}

// Multi-step Wizard Props
export interface MultiStepWizardProps extends BaseFormProps {
  steps: WizardStep[];
  onStepChange?: (stepIndex: number) => void;
  onComplete?: (allData: any) => void | Promise<void>;
  autoSave?: AutoSaveConfig;
  showProgress?: boolean;
  allowSkipping?: boolean;
  title?: string;
  description?: string;
}

// Form Step Component Props
export interface FormStepComponentProps {
  data: any;
  onChange: (data: any) => void;
  errors: Record<string, string[]>;
  isLoading: boolean;
}

// Validation Schema Types
export const TransactionFormSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
  account: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const AccountSetupSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['checking', 'savings', 'credit', 'investment']),
  bankName: z.string().min(1, 'Bank name is required'),
  initialBalance: z.number().min(0, 'Initial balance cannot be negative'),
  currency: z.string().min(1, 'Currency is required'),
  isDefault: z.boolean(),
});

export const BudgetCreationSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  totalAmount: z.number().positive('Total amount must be positive'),
  categories: z
    .array(
      z.object({
        name: z.string().min(1, 'Category name is required'),
        amount: z.number().positive('Amount must be positive'),
        color: z.string().min(1, 'Color is required'),
      })
    )
    .min(1, 'At least one category is required'),
  startDate: z.date(),
  endDate: z.date(),
});

export type TransactionFormType = z.infer<typeof TransactionFormSchema>;
export type AccountSetupType = z.infer<typeof AccountSetupSchema>;
export type BudgetCreationType = z.infer<typeof BudgetCreationSchema>;
