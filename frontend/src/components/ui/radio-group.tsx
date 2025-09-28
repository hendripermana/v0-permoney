"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

function useRadioGroupContext() {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroup components must be used within <RadioGroup>")
  }
  return context
}

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, defaultValue, onValueChange, disabled, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue

    const handleChange = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onValueChange?.(nextValue)
      },
      [isControlled, onValueChange]
    )

    return (
      <RadioGroupContext.Provider
        value={{ value: currentValue, onChange: handleChange, disabled }}
      >
        <div
          ref={ref}
          role="radiogroup"
          className={cn("flex flex-wrap gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  indicatorClassName?: string
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, className, indicatorClassName, children, disabled, ...props }, ref) => {
    const context = useRadioGroupContext()
    const isSelected = context.value === value
    const isDisabled = disabled ?? context.disabled

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        data-state={isSelected ? "checked" : "unchecked"}
        data-disabled={isDisabled ? "true" : undefined}
        onClick={() => {
          if (isDisabled) return
          context.onChange(value)
        }}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border border-input transition-colors",
          isSelected && "border-ring bg-ring/10 text-ring",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isSelected ? (
          <Circle className={cn("h-3 w-3 fill-current", indicatorClassName)} />
        ) : null}
        <span className="sr-only">{children}</span>
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

const RadioGroupIndicator: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn("flex h-3 w-3 items-center justify-center", className)} {...props}>
    <Circle className="h-3 w-3 fill-current" />
  </span>
)

export { RadioGroup, RadioGroupItem, RadioGroupIndicator }
