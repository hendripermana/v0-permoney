'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, SkipForward as Skip } from 'lucide-react';
import { OnboardingTooltipProps } from '@/types/onboarding';
import { cn } from '@/lib/utils';

export function OnboardingTooltip({
  step,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  isFirst,
  isLast,
  stepNumber,
  totalSteps,
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    const calculatePosition = () => {
      if (!step.target) {
        // Center the tooltip if no target
        setPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
        });
        setArrowPosition('top');
        return;
      }

      const targetElement = document.querySelector(step.target);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

      // Determine best position based on step.position or auto-calculate
      const preferredPosition = step.position || 'bottom';

      switch (preferredPosition) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 16;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          arrow = 'bottom';
          break;
        case 'bottom':
          top = targetRect.bottom + 16;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          arrow = 'top';
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - 16;
          arrow = 'right';
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + 16;
          arrow = 'left';
          break;
        case 'center':
        default:
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + 16;
          arrow = 'left';
          break;
      }

      // Adjust if tooltip goes outside viewport
      if (left < 16) {
        left = 16;
      } else if (left + tooltipRect.width > viewportWidth - 16) {
        left = viewportWidth - tooltipRect.width - 16;
      }

      if (top < 16) {
        top = 16;
      } else if (top + tooltipRect.height > viewportHeight - 16) {
        top = viewportHeight - tooltipRect.height - 16;
      }

      setPosition({ top, left });
      setArrowPosition(arrow);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [step.target, step.position]);

  const progress = ((stepNumber - 1) / (totalSteps - 1)) * 100;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight target element */}
      {step.target && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-96 max-w-[calc(100vw-2rem)]"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <Card className="permoney-card shadow-2xl border-2 border-neon-green/20">
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-3 h-3 bg-background border-neon-green/20 rotate-45',
              {
                'top-[-6px] left-1/2 transform -translate-x-1/2 border-t border-l': arrowPosition === 'top',
                'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-b border-r': arrowPosition === 'bottom',
                'left-[-6px] top-1/2 transform -translate-y-1/2 border-l border-b': arrowPosition === 'left',
                'right-[-6px] top-1/2 transform -translate-y-1/2 border-r border-t': arrowPosition === 'right',
              }
            )}
          />

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  Step {stepNumber} of {totalSteps}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onComplete}
                className="h-6 w-6 p-0 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Progress value={progress} className="h-1" />
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Custom component if provided */}
            {step.component && (
              <div className="mb-4">
                <step.component {...(step.props || {})} />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Previous
                  </Button>
                )}
                {step.optional && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="flex items-center gap-1 text-muted-foreground"
                  >
                    <Skip className="h-3 w-3" />
                    Skip
                  </Button>
                )}
              </div>

              <Button
                variant="permoney"
                size="sm"
                onClick={isLast ? onComplete : onNext}
                className="flex items-center gap-1"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
