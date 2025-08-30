/**
 * Form Progress Component
 * Displays overall progress and completion status for multi-step forms
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepTitles?: string[];
  showPercentage?: boolean;
  showStepCount?: boolean;
  showEstimatedTime?: boolean;
  estimatedTimePerStep?: number; // minutes
  className?: string;
}

export function FormProgress({
  currentStep,
  totalSteps,
  completedSteps,
  stepTitles = [],
  showPercentage = true,
  showStepCount = true,
  showEstimatedTime = false,
  estimatedTimePerStep = 2,
  className,
}: FormProgressProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const completedPercentage = (completedSteps.length / totalSteps) * 100;
  const remainingSteps = totalSteps - currentStep - 1;
  const estimatedTimeRemaining = remainingSteps * estimatedTimePerStep;

  const getProgressStatus = () => {
    if (
      currentStep === totalSteps - 1 &&
      completedSteps.includes(currentStep)
    ) {
      return 'completed';
    }
    if (currentStep > 0) {
      return 'in-progress';
    }
    return 'not-started';
  };

  const status = getProgressStatus();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-neon-green" />
          )}
          {status === 'in-progress' && (
            <Clock className="w-5 h-5 text-primary" />
          )}
          {status === 'not-started' && (
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
          )}

          <h3 className="text-lg font-semibold text-foreground">
            {status === 'completed' && 'Form Completed'}
            {status === 'in-progress' && 'Form in Progress'}
            {status === 'not-started' && 'Form Not Started'}
          </h3>
        </div>

        <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
          {status === 'completed' && 'Complete'}
          {status === 'in-progress' && 'In Progress'}
          {status === 'not-started' && 'Pending'}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-3" />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {showStepCount && (
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            )}

            {showPercentage && (
              <span className="font-medium text-foreground">
                {Math.round(progressPercentage)}% Complete
              </span>
            )}
          </div>

          {showEstimatedTime && remainingSteps > 0 && (
            <span className="text-muted-foreground">
              ~{estimatedTimeRemaining} min remaining
            </span>
          )}
        </div>
      </div>

      {/* Step Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-neon-green" />
          <span className="text-muted-foreground">
            Completed: {completedSteps.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            Current: {stepTitles[currentStep] || `Step ${currentStep + 1}`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span className="text-muted-foreground">
            Remaining: {remainingSteps}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Form Progress - Minimal version for headers
 */
export function CompactFormProgress({
  currentStep,
  totalSteps,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  className?: string;
}) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <Progress value={progressPercentage} className="flex-1 h-2" />
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  );
}

/**
 * Circular Progress - Alternative visual representation
 */
export function CircularFormProgress({
  currentStep,
  totalSteps,
  size = 80,
  strokeWidth = 8,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--neon-green))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">
          {Math.round(progressPercentage)}%
        </span>
        <span className="text-xs text-muted-foreground">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
}

/**
 * Step Timeline - Shows completed, current, and upcoming steps
 */
export function StepTimeline({
  currentStep,
  totalSteps,
  completedSteps,
  stepTitles = [],
  className,
}: {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepTitles?: string[];
  className?: string;
}) {
  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    index,
    title: stepTitles[index] || `Step ${index + 1}`,
    isCompleted: completedSteps.includes(index),
    isCurrent: index === currentStep,
    isPending: index > currentStep,
  }));

  return (
    <div className={cn('space-y-3', className)}>
      {steps.map(step => (
        <div key={step.index} className="flex items-center space-x-3">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all',
              step.isCompleted && 'bg-neon-green text-primary-foreground',
              step.isCurrent &&
                'bg-primary text-primary-foreground ring-2 ring-primary/30',
              step.isPending && 'bg-muted text-muted-foreground'
            )}
          >
            {step.isCompleted ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              step.index + 1
            )}
          </div>

          <span
            className={cn(
              'text-sm transition-colors',
              step.isCurrent && 'text-foreground font-medium',
              step.isCompleted && 'text-foreground',
              step.isPending && 'text-muted-foreground'
            )}
          >
            {step.title}
          </span>

          {step.isCompleted && (
            <CheckCircle className="w-4 h-4 text-neon-green" />
          )}

          {step.isCurrent && (
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
