import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PermoneyButton } from '@/components/permoney-button';
import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Link } from 'wouter';
import { PermoneyLogo } from '@/components/permoney-logo';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="relative z-50 px-6 sm:px-8 lg:px-12 py-6 theme-transition glassmorphism">
        <div className="w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" onClick={closeMobileMenu}>
            <PermoneyLogo
              size="sm"
              className="sm:hidden hover:scale-105 transition-transform duration-200"
            />
            <PermoneyLogo
              size="md"
              className="hidden sm:block hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium px-3 py-2 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById('how-it-works')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-sm font-medium px-3 py-2 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById('features')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Features
            </a>
            <a
              href="#support"
              className="text-sm font-medium px-3 py-2 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById('support')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Support
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-transition hover-bounce border border-transparent hover:border-neon-green hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:scale-105"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="text-sm font-medium border border-transparent hover:border-neon-green hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:scale-105"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/auth/register">
              <PermoneyButton
                variant="default"
                size="default"
                className="font-bold px-6 py-3 text-sm"
              >
                Get Started
              </PermoneyButton>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-transition hover-bounce border border-transparent hover:border-neon-green hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:scale-105"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="theme-transition hover-bounce border border-transparent hover:border-neon-green hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:scale-105"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          ></div>

          {/* Mobile Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] glassmorphism border-l border-border/50 slide-in-right z-[70]">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <PermoneyLogo size="sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileMenu}
                  className="hover-bounce border border-transparent hover:border-neon-green hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:scale-105"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex-1 px-6 py-8 space-y-6">
                <a
                  href="#how-it-works"
                  onClick={e => {
                    e.preventDefault();
                    closeMobileMenu();
                    setTimeout(() => {
                      document
                        .getElementById('how-it-works')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }}
                  className="block text-lg font-medium px-4 py-3 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:translate-x-2"
                >
                  How it works
                </a>
                <a
                  href="#features"
                  onClick={e => {
                    e.preventDefault();
                    closeMobileMenu();
                    setTimeout(() => {
                      document
                        .getElementById('features')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }}
                  className="block text-lg font-medium px-4 py-3 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:translate-x-2"
                >
                  Features
                </a>
                <a
                  href="#support"
                  onClick={e => {
                    e.preventDefault();
                    closeMobileMenu();
                    setTimeout(() => {
                      document
                        .getElementById('support')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }}
                  className="block text-lg font-medium px-4 py-3 rounded-md border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:translate-x-2"
                >
                  Support
                </a>

                <div className="border-t border-border/50 pt-6 mt-8">
                  <Link href="/auth/login" onClick={closeMobileMenu}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-lg font-medium border border-transparent hover:border-neon-green/50 hover:bg-neon-green/10 hover:text-neon-green dark:hover:text-neon-green dark:hover:bg-neon-green/20 transition-all duration-200 hover:translate-x-2 mb-4"
                    >
                      Sign in
                    </Button>
                  </Link>

                  <Link href="/auth/register" onClick={closeMobileMenu}>
                    <PermoneyButton
                      variant="default"
                      size="lg"
                      className="w-full font-bold"
                    >
                      Get Started
                    </PermoneyButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
