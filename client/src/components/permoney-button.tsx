import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Enhanced PermoneyButton with signature design elements and vibrant hardcoded-style effects
const permoneyButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
  {
    variants: {
      variant: {
        // Permoney signature default - vibrant neon green with core identity shadows
        default:
          'bg-neon-green text-primary-foreground font-bold border-2 border-primary-foreground hover:bg-neon-green/90 hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2 active:permoney-shadow-active active:translate-y-0',

        // Glassmorphism variant with core shadows
        glass:
          'glassmorphism border-2 border-border text-foreground hover:border-neon-green hover:text-neon-green hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',

        // Outline with core identity shadows
        outline:
          'border-2 border-border bg-background text-foreground hover:bg-foreground hover:text-background hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',

        // Neon outline with glow and core shadows
        neon: 'border-2 border-neon-green bg-transparent text-neon-green hover:bg-neon-green hover:text-primary-foreground hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',

        // Destructive with core shadows
        destructive:
          'bg-destructive text-destructive-foreground border-2 border-border hover:bg-destructive/90 hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',

        // Secondary with core shadows
        secondary:
          'glassmorphism bg-muted text-muted-foreground border-2 border-border hover:bg-muted/80 hover:text-foreground hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',

        // Ghost with subtle lift
        ghost:
          'text-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:-translate-y-1',

        // Link with enhanced neon accent
        link: 'text-neon-green underline-offset-4 hover:underline hover:text-neon-green/80 hover:scale-[1.02]',

        // Premium gradient with core identity shadows
        gradient:
          'bg-gradient-to-r from-neon-green via-emerald-400 to-green-400 text-primary-foreground font-bold border-2 border-primary-foreground hover:from-neon-green/95 hover:via-emerald-400/95 hover:to-green-400/95 hover:scale-[1.02] permoney-shadow hover:permoney-shadow-hover hover:-translate-y-2',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
);

export interface PermoneyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof permoneyButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const PermoneyButton = React.forwardRef<HTMLButtonElement, PermoneyButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(
          permoneyButtonVariants({ variant, size, loading, className })
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </Comp>
    );
  }
);
PermoneyButton.displayName = 'PermoneyButton';

export { PermoneyButton, permoneyButtonVariants };
