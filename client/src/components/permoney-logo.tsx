import { cn } from '@/lib/utils';

interface PermoneyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PermoneyLogo({ className, size = 'md' }: PermoneyLogoProps) {
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-13 px-5 text-lg',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-bold cursor-pointer select-none relative group',
        'bg-gradient-to-r from-card/95 to-card border-2 border-border rounded-xl glassmorphism',
        'shadow-[4px_4px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_hsl(var(--border))]',
        'hover:transform hover:-translate-y-1 transition-all duration-300 ease-out',
        'overflow-hidden backdrop-blur-md',
        sizeClasses[size],
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/10 via-neon-green/5 to-neon-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />

      {/* Main logo text */}
      <div className="relative z-10 flex items-center space-x-0.5 font-extrabold tracking-tight">
        <span className="text-neon-green drop-shadow-sm">PER</span>
        <span className="text-foreground">MONEY</span>
      </div>

      {/* Animated underline */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-neon-green to-neon-green/60 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] rounded-full" />

      {/* Corner indicators */}
      <div className="absolute top-1 right-1 w-1 h-1 bg-neon-green/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />

      {/* Subtle inner glow */}
      <div className="absolute inset-0.5 bg-gradient-to-br from-neon-green/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

// Compact version for mobile or smaller spaces
export function PermoneyLogoCompact({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl',
        'border-2 glassmorphism font-black text-lg sm:text-xl',
        'bg-gradient-to-br from-card/95 to-card text-neon-green border-border',
        'shadow-[3px_3px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_hsl(var(--border))]',
        'hover:transform hover:-translate-y-1 hover:scale-105',
        'transition-all duration-300 ease-out cursor-pointer',
        'group overflow-hidden backdrop-blur-md',
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-green/15 via-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

      {/* Letter P with enhanced styling */}
      <span className="relative z-10 font-extrabold drop-shadow-sm">P</span>

      {/* Corner indicator */}
      <div className="absolute top-1 right-1 w-1 h-1 bg-neon-green/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125" />

      {/* Bottom accent line */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-neon-green transition-all duration-300 group-hover:w-[calc(100%-0.5rem)] rounded-full" />

      {/* Subtle inner glow */}
      <div className="absolute inset-0.5 bg-gradient-to-br from-neon-green/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
