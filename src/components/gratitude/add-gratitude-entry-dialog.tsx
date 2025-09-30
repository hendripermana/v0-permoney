'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Heart, HelpingHand, Gift } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCreateGratitudeEntry } from '@/hooks/use-gratitude';
import { CreateGratitudeEntryDto } from '@/lib/api/gratitude';

const gratitudeSchema = z.object({
  giver: z.string().min(1, 'Giver name is required'),
  type: z.enum(['TREAT', 'HELP', 'GIFT'], {
    required_error: 'Please select a gratitude type',
  }),
  description: z.string().min(1, 'Description is required'),
  date: z.date({
    required_error: 'Date is required',
  }),
  estimatedValueCents: z.number().min(0).optional(),
  currency: z.string().optional(),
});

type GratitudeFormData = z.infer<typeof gratitudeSchema>;

const gratitudeTypes = [
  {
    value: 'TREAT' as const,
    label: 'Treat',
    description: 'Someone treated you to something',
    icon: Heart,
    color: 'text-pink-500',
  },
  {
    value: 'HELP' as const,
    label: 'Help',
    description: 'Someone helped you with something',
    icon: HelpingHand,
    color: 'text-blue-500',
  },
  {
    value: 'GIFT' as const,
    label: 'Gift',
    description: 'Someone gave you a gift',
    icon: Gift,
    color: 'text-purple-500',
  },
];

interface AddGratitudeEntryDialogProps {
  children?: React.ReactNode;
}

export function AddGratitudeEntryDialog({ children }: AddGratitudeEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const createGratitudeEntry = useCreateGratitudeEntry();

  const form = useForm<GratitudeFormData>({
    resolver: zodResolver(gratitudeSchema),
    defaultValues: {
      giver: '',
      description: '',
      date: new Date(),
      currency: 'IDR',
    },
  });

  const onSubmit = async (data: GratitudeFormData) => {
    try {
      const createData: CreateGratitudeEntryDto = {
        giver: data.giver,
        type: data.type,
        description: data.description,
        date: data.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        ...(data.estimatedValueCents && { estimatedValueCents: data.estimatedValueCents }),
        ...(data.currency && { currency: data.currency }),
      };

      await createGratitudeEntry.mutateAsync(createData);
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Heart className="mr-2 h-4 w-4" />
            Add Gratitude
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Gratitude Entry</DialogTitle>
          <DialogDescription>
            Record a moment of gratitude - when someone treated you, helped you, or gave you a gift.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="giver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who showed you gratitude?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John, Mom, My partner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Gratitude</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gratitude type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gratitudeTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className={cn('h-4 w-4', type.color)} />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened... e.g., 'Bought me coffee at Starbucks'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedValueCents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="100"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                        value={field.value || ''}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-muted-foreground">cents</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {field.value && field.value > 0 && (
                      <span className="text-sm">
                        ≈ {formatCurrency(field.value)}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createGratitudeEntry.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createGratitudeEntry.isPending}>
                {createGratitudeEntry.isPending ? 'Adding...' : 'Add Gratitude'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
