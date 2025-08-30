'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useHouseholds } from '../../hooks/use-households';
import { Household } from '../../lib/api';

interface HouseholdSelectorProps {
  value?: string;
  onValueChange: (householdId: string) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function HouseholdSelector({
  value,
  onValueChange,
  onCreateNew,
  className,
}: HouseholdSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: households, isLoading } = useHouseholds();

  const selectedHousehold = households?.find((h) => h.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[300px] justify-between', className)}
        >
          {selectedHousehold ? selectedHousehold.name : 'Select household...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search households..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No households found.'}
            </CommandEmpty>
            <CommandGroup>
              {households?.map((household) => (
                <CommandItem
                  key={household.id}
                  value={household.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === household.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{household.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {household.members.length} member{household.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CommandItem>
              ))}
              {onCreateNew && (
                <CommandItem
                  onSelect={() => {
                    onCreateNew();
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new household
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
