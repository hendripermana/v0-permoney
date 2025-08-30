/**
 * Step Indicator Component
 * Visual progress indicator for multi-step forms
 */

import React from 'react';
import { Check, Circle, Dot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressIndicatorProps } from './types';

export function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  stepTitles = [],
  variant = 'dots',
  showLabels = true,
  className,
}: ProgressIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    index,
    title: stepTitles[index] || `Step ${index + 1}`,
    isCompleted: completedSteps.includes(index),
    isCurrent: index === currentStep,
    isAccessible: index <= currentStep || completedSteps.includes(index),
  }));

  if (variant === 'line') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 z-10',
                    step.isCompleted && 'bg-neon-green text-primary-foreground',
                    step.isCurrent &&
                      !step.isCompleted &&
                      'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !step.isCurrent &&
                      !step.isCompleted &&
                      'bg-muted text-muted-foreground'
                  )}
                >
                  {step.isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.index + 1
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      step.isCompleted ? 'bg-neon-green' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        {showLabels && (
          <div className="flex justify-between mt-2">
            {steps.map(step => (
              <div key={step.index} className="flex-1 text-center">
                <span
                  className={cn(
                    'text-xs transition-colors',
                    step.isCurrent
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn('flex items-center justify-center space-x-4', className)}
      >
        {steps.map((step, index) => (
          <div
            key={step.index}
            className="flex flex-col items-center space-y-2"
          >
            {/* Large Circle */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-200',
                step.isCompleted && 'bg-neon-green text-primary-foreground',
                step.isCurrent &&
                  !step.isCompleted &&
                  'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !step.isCurrent &&
                  !step.isCompleted &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {step.isCompleted ? (
                <Check className="w-6 h-6" />
              ) : (
                step.index + 1
              )}
            </div>

            {/* Label */}
            {showLabels && (
              <span
                className={cn(
                  'text-sm text-center max-w-20',
                  step.isCurrent
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            )}

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-6 left-1/2 w-16 h-0.5 transform translate-x-6">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    step.isCompleted ? 'bg-neon-green' : 'bg-muted'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default: dots variant
  return (
    <div
      className={cn('flex items-center justify-center space-x-2', className)}
    >
      {steps.map((step, index) => (
        <div key={step.index} className="flex items-center">
          {/* Dot */}
          <div
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-200',
              step.isCompleted && 'bg-neon-green',
              step.isCurrent &&
                !step.isCompleted &&
                'bg-primary ring-2 ring-primary/30',
              !step.isCurrent && !step.isCompleted && 'bg-muted'
            )}
          />

          {/* Connecting Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-8 h-0.5 mx-1 transition-all duration-300',
                step.isCompleted ? 'bg-neon-green' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Compact Step Indicator - Minimal version for tight spaces
 */
export function CompactStepIndicator({
  currentStep,
  totalSteps,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-200',
            index <= currentStep ? 'bg-neon-green' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Vertical Step Indicator - For sidebar layouts
 */
export function VerticalStepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  stepTitles = [],
  showLabels = true,
  className,
}: ProgressIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    index,
    title: stepTitles[index] || `Step ${index + 1}`,
    isCompleted: completedSteps.includes(index),
    isCurrent: index === currentStep,
    isAccessible: index <= currentStep || completedSteps.includes(index),
  }));

  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={step.index} className="flex items-start space-x-3">
          {/* Step Circle */}
          <div className="relative">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                step.isCompleted && 'bg-neon-green text-primary-foreground',
                step.isCurrent &&
                  !step.isCompleted &&
                  'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !step.isCurrent &&
                  !step.isCompleted &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {step.isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                step.index + 1
              )}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-8 left-1/2 w-0.5 h-8 transform -translate-x-1/2">
                <div
                  className={cn(
                    'w-full h-full transition-all duration-300',
                    step.isCompleted ? 'bg-neon-green' : 'bg-muted'
                  )}
                />
              </div>
            )}
          </div>

          {/* Step Content */}
          {showLabels && (
            <div className="flex-1 min-w-0 pt-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
