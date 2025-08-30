import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Enhanced PermoneyInput with glassmorphism and signature styling
const permoneyInputVariants = cva(
  'flex w-full rounded-lg border bg-background px-3 py-2 text-base ring-offset-background transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        // Default with subtle glassmorphism
        default:
          'border-border bg-background/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:border-neon-green hover:border-neon-green/50',

        // Full glassmorphism effect
        glass:
          'glassmorphism border-border/50 focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:border-neon-green hover:border-neon-green/50',

        // Solid background
        solid:
          'border-border bg-background focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:border-neon-green hover:border-neon-green/50',

        // Neon outline
        neon: 'border-2 border-neon-green bg-transparent focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]',

        // Minimal border
        minimal:
          'border-0 border-b-2 border-border rounded-none bg-transparent focus-visible:border-neon-green focus-visible:outline-none px-0',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-6 text-lg',
      },
      state: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
);

export interface PermoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof permoneyInputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const PermoneyInput = React.forwardRef<HTMLInputElement, PermoneyInputProps>(
  (
    {
      className,
      type = 'text',
      variant,
      size,
      state,
      leftIcon,
      rightIcon,
      label,
      helperText,
      errorMessage,
      ...props
    },
    ref
  ) => {
    const inputState = errorMessage ? 'error' : state;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              permoneyInputVariants({ variant, size, state: inputState }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <p
            className={cn(
              'text-xs',
              errorMessage ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);
PermoneyInput.displayName = 'PermoneyInput';

export { PermoneyInput, permoneyInputVariants };
