"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface ToggleGroupContextValue {
  type: "single" | "multiple"
  value: string | string[] | undefined
  toggleValue: (value: string) => void
  disabled?: boolean
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null)

function useToggleGroupContext() {
  const context = React.useContext(ToggleGroupContext)
  if (!context) {
    throw new Error("ToggleGroup components must be used within <ToggleGroup>")
  }
  return context
}

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  disabled?: boolean
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      className,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<string | string[] | undefined>(
      defaultValue
    )

    const currentValue = isControlled ? value : internalValue

    const handleChange = React.useCallback(
      (nextValue: string) => {
        if (type === "single") {
          if (!isControlled) {
            setInternalValue(nextValue)
          }
          onValueChange?.(nextValue)
        } else {
          const existing = Array.isArray(currentValue) ? currentValue : []
          const next = existing.includes(nextValue)
            ? existing.filter((item) => item !== nextValue)
            : [...existing, nextValue]
          if (!isControlled) {
            setInternalValue(next)
          }
          onValueChange?.(next)
        }
      },
      [currentValue, isControlled, onValueChange, type]
    )

    return (
      <ToggleGroupContext.Provider
        value={{
          type,
          value: currentValue,
          toggleValue: handleChange,
          disabled,
        }}
      >
        <div
          ref={ref}
          className={cn("flex flex-wrap gap-2", className)}
          role={type === "single" ? "radiogroup" : "group"}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
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

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  value: string
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, pressed, disabled, ...props }, ref) => {
    const context = useToggleGroupContext()
    const isMultiple = context.type === "multiple"
    const isPressed = React.useMemo(() => {
      if (isMultiple) {
        return Array.isArray(context.value) && context.value.includes(value)
      }
      return context.value === value
    }, [context.value, isMultiple, value])

    const isDisabled = disabled ?? context.disabled

    return (
      <button
        ref={ref}
        type="button"
        className={cn(toggleVariants({ pressed: isPressed, className }))}
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        data-disabled={isDisabled ? "true" : undefined}
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) return
          context.toggleValue(value)
        }}
        {...props}
      />
    )
  }
)
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
