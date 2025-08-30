import * as React from 'react';
import { cn } from '@/lib/utils';

// Enhanced PermoneyCard with shadcn/ui structure while maintaining core design
interface PermoneyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  chunky?: boolean;
  variant?: 'default' | 'green' | 'subtle' | 'elevated';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  loading?: boolean;
}

const PermoneyCard = React.forwardRef<HTMLDivElement, PermoneyCardProps>(
  (
    {
      children,
      className,
      hover = true,
      chunky = false,
      variant = 'default',
      size = 'md',
      interactive = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const getCardClass = () => {
      const baseClass = 'glassmorphism rounded-lg transition-all duration-300';

      // Variant styles
      const variantClasses = {
        default: chunky ? 'permoney-card-chunky' : 'permoney-card',
        green: 'permoney-card-green',
        subtle: 'border border-border/50 shadow-sm',
        elevated: 'border-2 border-border shadow-lg',
      };

      // Size classes
      const sizeClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      };

      return cn(
        baseClass,
        variantClasses[variant],
        sizeClasses[size],
        hover && 'hover:shadow-xl hover:scale-[1.02]',
        interactive &&
          'cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2',
        loading && 'animate-pulse'
      );
    };

    if (loading) {
      return (
        <div ref={ref} className={cn(getCardClass(), className)} {...props}>
          <div className="skeleton h-4 w-3/4 mb-2 rounded"></div>
          <div className="skeleton h-4 w-1/2 mb-4 rounded"></div>
          <div className="skeleton h-20 w-full rounded"></div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(getCardClass(), className)}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PermoneyCard.displayName = 'PermoneyCard';

// Enhanced Card subcomponents with Permoney styling
const PermoneyCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));
PermoneyCardHeader.displayName = 'PermoneyCardHeader';

const PermoneyCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight text-foreground',
      className
    )}
    {...props}
  />
));
PermoneyCardTitle.displayName = 'PermoneyCardTitle';

const PermoneyCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
PermoneyCardDescription.displayName = 'PermoneyCardDescription';

const PermoneyCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));
PermoneyCardContent.displayName = 'PermoneyCardContent';

const PermoneyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
PermoneyCardFooter.displayName = 'PermoneyCardFooter';

export {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardFooter,
  PermoneyCardTitle,
  PermoneyCardDescription,
  PermoneyCardContent,
};
