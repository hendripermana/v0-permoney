/**
 * Dashboard Layout Component
 * Main layout wrapper that includes sidebar navigation and content area
 */

import React, { useState, useEffect } from 'react';
import { Sidebar as PermoneySidebar, MobileSidebar } from './sidebar';
import { DashboardNavbar } from './dashboard-navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false); // Reset collapsed state on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleSidebarMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
      setSidebarCollapsed(false);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
      setSidebarCollapsed(true);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen">
        {/* Sidebar - Fixed Position */}
        <div
          className={cn(
            'fixed left-0 top-0 h-full transition-all duration-300 z-30',
            sidebarCollapsed ? 'w-20' : 'w-72'
          )}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <PermoneySidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            className="h-full"
          />
        </div>

        {/* Main Content - With Left Margin */}
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-20' : 'ml-72'
          )}
        >
          {/* Top Navigation */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <DashboardNavbar
              onMenuClick={toggleSidebar}
              showMenuButton={false} // Hide on desktop since sidebar is always visible
            />
          </div>

          {/* Content Area */}
          <main className={cn('min-h-screen p-6', className)}>
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Navigation */}
        <div className="sticky top-0 z-40">
          <DashboardNavbar onMenuClick={toggleSidebar} showMenuButton={true} />
        </div>

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
        />

        {/* Mobile Content */}
        <main className={cn('p-4', className)}>{children}</main>
      </div>
    </div>
  );
}

/**
 * Dashboard Page Wrapper
 * Provides consistent spacing and layout for dashboard pages
 */
export function DashboardPage({
  title,
  description,
  children,
  className,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}

/**
 * Dashboard Grid
 * Responsive grid layout for dashboard cards
 */
export function DashboardGrid({
  children,
  className,
  cols = 'auto',
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 'auto' | '1' | '2' | '3' | '4';
}) {
  const gridCols = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[cols], className)}>
      {children}
    </div>
  );
}

/**
 * Dashboard Section
 * Wrapper for dashboard content sections
 */
export function DashboardSection({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
