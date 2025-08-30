/**
 * Sidebar Component
 * Professional left navigation sidebar with glassmorphism design
 * Optimized for both collapsed and expanded states
 */

import React, { useState } from 'react';
import {
  PermoneyCard,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from './index';
import {
  User,
  Settings,
  Receipt,
  Wallet,
  Home,
  TrendingUp,
  CreditCard,
  Target,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Star,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    href: '/transactions',
    badge: '12',
    submenu: [
      {
        id: 'all-transactions',
        label: 'All Transactions',
        icon: Receipt,
        href: '/transactions',
      },
      {
        id: 'add-transaction',
        label: 'Add Transaction',
        icon: Receipt,
        href: '/transactions/add',
      },
      {
        id: 'recurring',
        label: 'Recurring',
        icon: Receipt,
        href: '/transactions/recurring',
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: Receipt,
        href: '/transactions/categories',
      },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: Wallet,
    href: '/budget',
    submenu: [
      {
        id: 'budget-overview',
        label: 'Budget Overview',
        icon: Wallet,
        href: '/budget',
      },
      {
        id: 'create-budget',
        label: 'Create Budget',
        icon: Target,
        href: '/budget/create',
      },
      {
        id: 'budget-goals',
        label: 'Goals',
        icon: Target,
        href: '/budget/goals',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    href: '/analytics',
    submenu: [
      {
        id: 'spending-analysis',
        label: 'Spending Analysis',
        icon: TrendingUp,
        href: '/analytics/spending',
      },
      {
        id: 'income-analysis',
        label: 'Income Analysis',
        icon: TrendingUp,
        href: '/analytics/income',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: TrendingUp,
        href: '/analytics/reports',
      },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: CreditCard,
    href: '/accounts',
    submenu: [
      {
        id: 'bank-accounts',
        label: 'Bank Accounts',
        icon: CreditCard,
        href: '/accounts/bank',
      },
      {
        id: 'credit-cards',
        label: 'Credit Cards',
        icon: CreditCard,
        href: '/accounts/credit',
      },
      {
        id: 'investments',
        label: 'Investments',
        icon: TrendingUp,
        href: '/accounts/investments',
      },
    ],
  },
  {
    id: 'islamic-finance',
    label: 'Islamic Finance',
    icon: Star,
    href: '/islamic-finance',
    submenu: [
      {
        id: 'zakat-calculator',
        label: 'Zakat Calculator',
        icon: Calculator,
        href: '/islamic-finance',
      },
      {
        id: 'halal-investments',
        label: 'Halal Investments',
        icon: TrendingUp,
        href: '/islamic-finance/investments',
      },
      {
        id: 'sedekah-tracker',
        label: 'Sedekah Tracker',
        icon: Star,
        href: '/islamic-finance/sedekah',
      },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: Bell,
    href: '/subscriptions',
    badge: '2',
    submenu: [
      {
        id: 'manage-subscriptions',
        label: 'Manage Subscriptions',
        icon: Bell,
        href: '/subscriptions',
      },
      {
        id: 'subscription-calendar',
        label: 'Payment Calendar',
        icon: Target,
        href: '/subscriptions/calendar',
      },
      {
        id: 'cost-analysis',
        label: 'Cost Analysis',
        icon: TrendingUp,
        href: '/subscriptions/analysis',
      },
    ],
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
    badge: '3',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/help',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    submenu: [
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        href: '/settings/profile',
      },
      {
        id: 'preferences',
        label: 'Preferences',
        icon: Settings,
        href: '/settings/preferences',
      },
      {
        id: 'security',
        label: 'Security',
        icon: Settings,
        href: '/settings/security',
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: CreditCard,
        href: '/settings/billing',
      },
    ],
  },
];

export function Sidebar({
  className,
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState('dashboard');

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu) {
      toggleSubmenu(item.id);
    } else {
      setActiveItem(item.id);
      // Handle navigation here
      console.log('Navigate to:', item.href);
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeItem === item.id;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubItem = level > 0;

    return (
      <div key={item.id} className="w-full">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            // Base styles
            'w-full justify-start text-left font-medium transition-all duration-200 group relative',

            // Height and padding
            isCollapsed ? 'h-11 px-3' : 'h-11 px-3',

            // Sub-item indentation
            isSubItem && !isCollapsed && 'ml-6 w-[calc(100%-1.5rem)]',

            // Active state
            isActive && [
              'bg-neon-green/10 text-neon-green border-r-2 border-neon-green',
              'shadow-sm backdrop-blur-sm',
            ],

            // Hover state
            !isActive && [
              'hover:bg-white/5 hover:text-foreground',
              'hover:shadow-sm hover:backdrop-blur-sm',
              'hover:border-r-2 hover:border-white/20',
            ],

            // Sub-item specific styles
            isSubItem && [
              'text-sm',
              isActive ? 'bg-neon-green/5' : 'hover:bg-white/3',
            ]
          )}
          onClick={() => handleItemClick(item)}
        >
          {/* Icon */}
          <item.icon
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3',
              isActive
                ? 'text-neon-green'
                : 'text-muted-foreground group-hover:text-foreground',
              isSubItem && 'h-4 w-4'
            )}
          />

          {/* Content - only show when not collapsed */}
          {!isCollapsed && (
            <>
              {/* Label */}
              <span
                className={cn(
                  'flex-1 transition-colors duration-200',
                  isActive ? 'text-neon-green' : 'text-foreground',
                  isSubItem && 'text-sm'
                )}
              >
                {item.label}
              </span>

              {/* Right side content */}
              <div className="flex items-center gap-2 ml-2">
                {/* Badge */}
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-1.5 py-0.5 font-medium',
                      isActive
                        ? 'bg-neon-green/20 text-neon-green'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}

                {/* Submenu chevron */}
                {hasSubmenu && (
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 transition-all duration-200',
                      isExpanded && 'rotate-90',
                      isActive
                        ? 'text-neon-green'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                )}
              </div>
            </>
          )}
        </Button>

        {/* Submenu */}
        {hasSubmenu && isExpanded && !isCollapsed && (
          <div className="mt-1 mb-2 space-y-0.5">
            {item.submenu!.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72',
        className
      )}
    >
      <PermoneyCard className="glassmorphism flex flex-col h-full border-r border-border/50 shadow-xl">
        {/* Header */}
        <div
          className={cn(
            'flex-shrink-0 border-b border-border/30 transition-all duration-200',
            isCollapsed ? 'p-3' : 'p-4'
          )}
        >
          <div
            className={cn(
              'flex items-center',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            {isCollapsed ? (
              <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-neon-green/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-neon-green/80 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-foreground tracking-tight">
                    Permoney
                  </span>
                  <div className="text-xs text-muted-foreground font-medium">
                    Finance Platform
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div
          className={cn(
            'flex-shrink-0 border-b border-border/30 transition-all duration-200',
            isCollapsed ? 'p-3' : 'p-4'
          )}
        >
          <div
            className={cn(
              'flex items-center',
              isCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            <Avatar
              className={cn(
                'border-2 border-neon-green/20 shadow-md transition-all duration-200',
                isCollapsed ? 'h-10 w-10' : 'h-12 w-12'
              )}
            >
              <AvatarImage src="/api/placeholder/48/48" alt="Profile" />
              <AvatarFallback className="bg-gradient-to-br from-neon-green to-neon-green/80 text-white font-bold text-sm">
                JD
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-sm">
                  John Doe
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  john@example.com
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-500 font-medium">
                    Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div
          className={cn(
            'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
            isCollapsed ? 'p-2' : 'p-4'
          )}
        >
          <div className="space-y-1">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div
          className={cn(
            'flex-shrink-0 border-t border-border/30 space-y-1 transition-all duration-200',
            isCollapsed ? 'p-2' : 'p-4'
          )}
        >
          {bottomMenuItems.map(item => renderMenuItem(item))}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start text-left font-medium transition-all duration-200 group',
              'text-red-500 hover:text-red-600 hover:bg-red-500/10',
              'hover:shadow-sm hover:backdrop-blur-sm',
              isCollapsed ? 'h-11 px-3' : 'h-11 px-3'
            )}
          >
            <LogOut
              className={cn(
                'flex-shrink-0 transition-colors duration-200',
                isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'
              )}
            />
            {!isCollapsed && <span className="flex-1">Logout</span>}
          </Button>
        </div>
      </PermoneyCard>
    </div>
  );
}

/**
 * Mobile Sidebar Overlay
 * Professional mobile responsive design
 */
export function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 transform transition-transform duration-300 ease-out">
        <Sidebar className="h-full shadow-2xl" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
