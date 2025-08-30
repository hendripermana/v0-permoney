/**
 * TransactionForm Component
 * Multi-step form for adding transactions (expenses/income)
 */

import React from 'react';
import { z } from 'zod';
import { MultiStepWizard } from './multi-step-wizard';
import { TransactionFormData, WizardStep } from './types';
import {
  TransactionTypeStep,
  BasicInfoStep,
  AdditionalDetailsStep,
  ReviewStep,
} from './transaction-steps';

// Validation schemas for each step
const transactionTypeSchema = z.object({
  type: z.enum(['expense', 'income'], {
    required_error: 'Please select transaction type',
  }),
});

const basicInfoSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.date(),
});

const detailsSchema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  receipt: z.string().optional(), // File path or base64
});

const reviewSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, {
    message: 'Please confirm the transaction details',
  }),
});

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TransactionFormData>;
  className?: string;
}

export function TransactionForm({
  onSubmit,
  onCancel,
  initialData = {},
  className,
}: TransactionFormProps) {
  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: 'type',
      title: 'Transaction Type',
      description: 'Choose whether this is an expense or income',
      component: TransactionTypeStep,
      validation: transactionTypeSchema,
      canSkip: false,
    },
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter the main transaction details',
      component: BasicInfoStep,
      validation: basicInfoSchema,
      canSkip: false,
    },
    {
      id: 'details',
      title: 'Additional Details',
      description: 'Add notes, tags, and other information',
      component: AdditionalDetailsStep,
      validation: detailsSchema,
      canSkip: true,
    },
    {
      id: 'review',
      title: 'Review & Confirm',
      description: 'Review your transaction before saving',
      component: ReviewStep,
      validation: reviewSchema,
      canSkip: false,
    },
  ];

  return (
    <div className={className}>
      <MultiStepWizard
        steps={steps}
        onStepChange={stepIndex => {
          // Handle step change if needed
        }}
        onComplete={async data => {
          const transactionData: TransactionFormData = {
            type: data.type?.type || 'expense',
            amount: data.basic?.amount || 0,
            description: data.basic?.description || '',
            category: data.basic?.category || '',
            date: data.basic?.date || new Date(),
            notes: data.details?.notes,
            tags: data.details?.tags || [],
            location: data.details?.location,
            receipt: data.details?.receipt,
          };
          await onSubmit(transactionData);
        }}
        onCancel={onCancel}
        autoSave={{
          enabled: true,
          key: 'permoney-transaction-form',
          interval: 10000,
        }}
        className="max-w-2xl mx-auto"
        initialData={initialData}
      />
    </div>
  );
}
