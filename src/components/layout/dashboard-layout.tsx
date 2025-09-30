'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, sidebar, className }: DashboardLayoutProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row min-h-screen', className)}>
      {/* Sidebar - Mobile: full width, Desktop: fixed width */}
      {sidebar && (
        <aside className="w-full lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            {sidebar}
          </div>
        </aside>
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <div className={cn('container mx-auto px-4 py-6 space-y-6', className)}>
      {children}
    </div>
  );
}

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function DashboardGrid({ children, className, columns = 2 }: DashboardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {children}
    </div>
  );
}
