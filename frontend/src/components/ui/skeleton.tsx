'use client';

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

// Enhanced skeleton components for specific use cases
function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ 
  className,
  showHeader = true,
  showContent = true,
  showFooter = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  showHeader?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)} {...props}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {showContent && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
      {showFooter && (
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  );
}

function SkeletonAvatar({ 
  size = 'md',
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton 
      className={cn('rounded-full', sizeClasses[size], className)} 
      {...props} 
    />
  );
}

function SkeletonButton({ 
  size = 'md',
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-16',
    md: 'h-10 w-20',
    lg: 'h-12 w-24',
  };

  return (
    <Skeleton 
      className={cn('rounded-md', sizeClasses[size], className)} 
      {...props} 
    />
  );
}

function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-1/4', // First column smaller
                colIndex === columns - 1 && 'w-1/6' // Last column smaller
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ 
  type = 'bar',
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  type?: 'bar' | 'line' | 'pie' | 'donut';
}) {
  if (type === 'pie' || type === 'donut') {
    return (
      <div className={cn('flex items-center justify-center', className)} {...props}>
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      <div className="flex items-end space-x-2 h-32">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton 
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-12" />
        ))}
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonTable,
  SkeletonChart,
};
