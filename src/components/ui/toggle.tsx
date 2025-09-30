"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
  {
    variants: {
      pressed: {
        true: "bg-primary text-primary-foreground",
        false: "",
      },
    },
    defaultVariants: {
      pressed: false,
    },
  }
)

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  pressed?: boolean
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, disabled, onClick, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(pressed)

    React.useEffect(() => {
      setIsPressed(pressed)
    }, [pressed])

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        data-disabled={disabled ? "true" : undefined}
        className={cn(
          toggleVariants({ pressed: isPressed, className }),
          disabled && "opacity-50"
        )}
        onClick={(event) => {
          if (disabled) return
          setIsPressed((value) => !value)
          onClick?.(event)
        }}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Toggle.displayName = "Toggle"

export { Toggle, toggleVariants }
