'use client';

import { useState } from 'react';
import { Eye, Users, User, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { ViewType } from '../../lib/api';

interface ViewTypeSelectorProps {
  value: ViewType;
  onValueChange: (viewType: ViewType) => void;
  className?: string;
}

const viewTypes = [
  {
    value: 'individual' as ViewType,
    label: 'Individual',
    description: 'Your personal financial data only',
    icon: User,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    value: 'partner_only' as ViewType,
    label: 'Partner Only',
    description: 'Data shared between partners',
    icon: UserCheck,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  {
    value: 'combined' as ViewType,
    label: 'Combined',
    description: 'All household financial data',
    icon: Users,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
];

export function ViewTypeSelector({
  value,
  onValueChange,
  className,
}: ViewTypeSelectorProps) {
  const selectedViewType = viewTypes.find((vt) => vt.value === value);
  const SelectedIcon = selectedViewType?.icon || Eye;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start gap-2', className)}
        >
          <SelectedIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedViewType?.label}</span>
          <Badge className={cn('ml-auto', selectedViewType?.color)}>
            {selectedViewType?.label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {viewTypes.map((viewType) => {
          const Icon = viewType.icon;
          return (
            <DropdownMenuItem
              key={viewType.value}
              onClick={() => onValueChange(viewType.value)}
              className={cn(
                'flex flex-col items-start gap-1 p-3',
                value === viewType.value && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{viewType.label}</span>
                {value === viewType.value && (
                  <Badge className={viewType.color}>Active</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {viewType.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
