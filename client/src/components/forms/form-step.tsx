/**
 * Form Step Component
 * Wrapper component for individual steps in multi-step forms
 */

import React, { useEffect } from 'react';
import { PermoneyCard } from '@/components/permoney-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormStepProps } from './types';

export function FormStep({
  title,
  description,
  children,
  isValid = false,
  isOptional = false,
  onValidationChange,
  className,
}: FormStepProps & { className?: string }) {
  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Step Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {isOptional && (
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
              Optional
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      {/* Step Content */}
      <div className="space-y-4">{children}</div>

      {/* Validation Status */}
      {!isValid && !isOptional && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields before proceeding.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Form Step Container - Alternative layout for card-based steps
 */
export function FormStepCard({
  title,
  description,
  children,
  isValid = false,
  isOptional = false,
  onValidationChange,
  className,
}: FormStepProps & { className?: string }) {
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  return (
    <PermoneyCard className={cn('glassmorphism p-6', className)}>
      {/* Card Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {isOptional && (
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
              Optional
            </span>
          )}
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {/* Card Content */}
      <div className="space-y-6">{children}</div>

      {/* Validation Status */}
      {!isValid && !isOptional && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields before proceeding.
          </AlertDescription>
        </Alert>
      )}
    </PermoneyCard>
  );
}

/**
 * Form Section - For grouping related fields within a step
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-base font-medium text-foreground">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Form Field Group - For organizing form fields in a grid
 */
export function FormFieldGroup({
  children,
  columns = 1,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
