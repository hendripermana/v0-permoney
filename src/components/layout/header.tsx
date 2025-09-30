'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { PWAInstallButton } from '@/components/pwa-install-prompt';
import { NotificationCenter } from '@/components/notifications';
import { PrivacyToggle } from '@/components/privacy';
import { OfflineIndicator } from '@/components/offline';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-neon-green flex items-center justify-center">
            <span className="text-black font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl">Permoney</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/dashboard" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link 
            href="/accounts" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Accounts
          </Link>
          <Link 
            href="/transactions" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Transactions
          </Link>
          <Link 
            href="/budgets" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Budgets
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <div data-offline-indicator>
            <OfflineIndicator />
          </div>
          <div data-notification-center>
            <NotificationCenter />
          </div>
          <div data-privacy-toggle>
            <PrivacyToggle />
          </div>
          <PWAInstallButton className="hidden sm:flex" />
          <ThemeToggle />
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/accounts" 
              className="block px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Accounts
            </Link>
            <Link 
              href="/transactions" 
              className="block px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Transactions
            </Link>
            <Link 
              href="/budgets" 
              className="block px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Budgets
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
