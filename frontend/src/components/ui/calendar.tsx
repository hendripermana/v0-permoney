"use client"

import * as React from "react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6]

type CalendarMode = "single"

export interface CalendarProps {
  className?: string
  selected?: Date | null
  onSelect?: (date?: Date) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  mode?: CalendarMode
  showOutsideDays?: boolean
  defaultMonth?: Date
  fromYear?: number
  toYear?: number
}

interface CalendarDay {
  date: Date
  inCurrentMonth: boolean
  isDisabled: boolean
}

export function Calendar({
  className,
  selected = null,
  onSelect,
  disabled,
  initialFocus = false,
  mode = "single",
  showOutsideDays = true,
  defaultMonth,
  fromYear,
  toYear,
}: CalendarProps) {
  const today = React.useMemo(() => new Date(), [])

  const initialMonth = React.useMemo(() => {
    if (defaultMonth) return startOfMonth(defaultMonth)
    if (selected) return startOfMonth(selected)
    return startOfMonth(today)
  }, [defaultMonth, selected, today])

  const [currentMonth, setCurrentMonth] = React.useState(initialMonth)
  const gridRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(startOfMonth(selected))
    }
  }, [selected])

  React.useEffect(() => {
    if (initialFocus && gridRef.current) {
      gridRef.current.focus()
    }
  }, [initialFocus, currentMonth])

  const handlePreviousMonth = React.useCallback(() => {
    setCurrentMonth((month) => {
      const next = subMonths(month, 1)
      if (fromYear && next.getFullYear() < fromYear) {
        return month
      }
      return next
    })
  }, [fromYear])

  const handleNextMonth = React.useCallback(() => {
    setCurrentMonth((month) => {
      const next = addMonths(month, 1)
      if (toYear && next.getFullYear() > toYear) {
        return month
      }
      return next
    })
  }, [toYear])

  const handleSelect = React.useCallback(
    (date: Date) => {
      if (mode !== "single") return

      const isDisabled = disabled?.(date)
      if (isDisabled) return

      if (selected && isSameDay(selected, date)) {
        onSelect?.(undefined)
      } else {
        onSelect?.(date)
      }
    },
    [disabled, mode, onSelect, selected],
  )

  const weeks = React.useMemo(() => buildMonthGrid(currentMonth, {
    disabled,
    showOutsideDays,
    fromYear,
    toYear,
  }), [currentMonth, disabled, fromYear, showOutsideDays, toYear])

  return (
    <div className={cn("w-fit rounded-lg border bg-popover text-popover-foreground", className)}>
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePreviousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {DAYS_OF_WEEK.map((weekday) => {
          const labelDate = startOfWeek(currentMonth, { weekStartsOn: 0 })
          return (
            <div key={weekday}>
              {format(addDays(labelDate, weekday), "EEEEE")}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {weeks.map((day, index) => {
          const isSelected = !day.isDisabled && selected && isSameDay(day.date, selected)
          const isCurrent = isToday(day.date)
          const inactive = !day.inCurrentMonth

          const commonClasses = cn(
            "flex h-9 w-full items-center justify-center rounded-md text-sm transition-all",
            inactive && "text-muted-foreground/60",
            day.isDisabled && "cursor-not-allowed opacity-40",
            !day.isDisabled && "cursor-pointer hover:bg-accent hover:text-accent-foreground",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            !isSelected && isCurrent && "border border-primary",
          )

          return (
            <button
              key={day.date.toISOString() + index}
              type="button"
              ref={index === 0 ? gridRef : undefined}
              className={commonClasses}
              onClick={() => handleSelect(day.date)}
              disabled={day.isDisabled}
              data-focused={index === 0 ? "true" : undefined}
            >
              {format(day.date, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildMonthGrid(
  month: Date,
  {
    disabled,
    showOutsideDays,
    fromYear,
    toYear,
  }: {
    disabled?: (date: Date) => boolean
    showOutsideDays: boolean
    fromYear?: number
    toYear?: number
  },
): CalendarDay[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })

  return eachDayOfInterval({ start, end }).map((date) => {
    const inCurrentMonth = isSameMonth(date, month)

    let isDisabled = false

    if (disabled?.(date)) {
      isDisabled = true
    }

    if (!showOutsideDays && !inCurrentMonth) {
      isDisabled = true
    }

    if (fromYear && date.getFullYear() < fromYear) {
      isDisabled = true
    }

    if (toYear && date.getFullYear() > toYear) {
      isDisabled = true
    }

    if (fromYear && isBefore(date, new Date(fromYear, 0, 1))) {
      isDisabled = true
    }

    if (toYear && isAfter(date, new Date(toYear, 11, 31))) {
      isDisabled = true
    }

    return {
      date,
      inCurrentMonth,
      isDisabled,
    }
  })
}
