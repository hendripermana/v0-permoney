'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  className?: string;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode, selected, onSelect, disabled, initialFocus, ...props }, ref) => {
    const [currentDate, setCurrentDate] = React.useState(selected || new Date());
    const [viewDate, setViewDate] = React.useState(new Date());

    const handleDateClick = (date: Date) => {
      if (disabled && disabled(date)) return;
      setCurrentDate(date);
      onSelect?.(date);
    };

    // Simple calendar implementation - in a real app, use a proper calendar library
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }
      
      return days;
    };

    const days = getDaysInMonth(viewDate);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div
        ref={ref}
        className={cn('p-3', className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            className="p-1 hover:bg-accent rounded"
          >
            ←
          </button>
          <div className="font-semibold">
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </div>
          <button
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            className="p-1 hover:bg-accent rounded"
          >
            →
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-sm font-medium p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div key={index} className="text-center">
              {day ? (
                <button
                  onClick={() => handleDateClick(day)}
                  disabled={disabled && disabled(day)}
                  className={cn(
                    'w-8 h-8 text-sm rounded hover:bg-accent',
                    selected && day.toDateString() === selected.toDateString() && 'bg-primary text-primary-foreground',
                    disabled && disabled(day) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {day.getDate()}
                </button>
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar };
