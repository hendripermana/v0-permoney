'use client';

import React from 'react';
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonTable,
  SkeletonChart,
} from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Dashboard loading state
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="permoney-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="permoney-card">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <SkeletonChart className="h-64" />
          </CardContent>
        </Card>

        {/* Account list */}
        <Card className="permoney-card">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonAvatar size="sm" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="permoney-card">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={4} />
        </CardContent>
      </Card>
    </div>
  );
}

// Transaction list loading state
export function TransactionListSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="permoney-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <SkeletonAvatar size="sm" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Account card loading state
export function AccountCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('permoney-card', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SkeletonAvatar size="md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
          
          <div className="flex justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Budget progress loading state
export function BudgetProgressSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('permoney-card', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Form loading state
export function FormSkeleton({ fields = 5, className }: { fields?: number; className?: string }) {
  return (
    <Card className={cn('permoney-card', className)}>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// Progressive loading wrapper
interface ProgressiveLoadingProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ProgressiveLoading({ 
  isLoading, 
  skeleton, 
  children, 
  delay = 200,
  className 
}: ProgressiveLoadingProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading, delay]);

  if (isLoading && showSkeleton) {
    return <div className={className}>{skeleton}</div>;
  }

  if (isLoading) {
    return null; // Don't show anything during the delay
  }

  return <div className={className}>{children}</div>;
}

// Staggered loading animation
interface StaggeredLoadingProps {
  items: React.ReactNode[];
  delay?: number;
  className?: string;
}

export function StaggeredLoading({ items, delay = 100, className }: StaggeredLoadingProps) {
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (visibleCount < items.length) {
      const timeout = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visibleCount, items.length, delay]);

  return (
    <div className={className}>
      {items.slice(0, visibleCount).map((item, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// Loading spinner with text
interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ text, size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-muted border-t-neon-green', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Pulse loading effect
export function PulseLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-neon-green rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
