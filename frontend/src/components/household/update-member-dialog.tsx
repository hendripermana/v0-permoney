'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useUpdateMember } from '../../hooks/use-households';
import { HouseholdMember } from '../../lib/api';

const formSchema = z.object({
  role: z.enum(['ADMIN', 'PARTNER', 'FINANCE_STAFF'], {
    required_error: 'Please select a role',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateMemberDialogProps {
  householdId: string;
  member?: HouseholdMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Full access to all household features and settings',
  },
  {
    value: 'PARTNER',
    label: 'Partner',
    description: 'Access to shared financial data and most features',
  },
  {
    value: 'FINANCE_STAFF',
    label: 'Finance Staff',
    description: 'Limited access to financial data entry and reporting',
  },
];

export function UpdateMemberDialog({
  householdId,
  member,
  open,
  onOpenChange,
}: UpdateMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateMember = useUpdateMember();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: member?.role || 'PARTNER',
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        role: member.role,
      });
    }
  }, [member, form]);

  const onSubmit = async (data: FormData) => {
    if (!member) return;

    setIsSubmitting(true);
    try {
      await updateMember.mutateAsync({
        householdId,
        memberId: member.userId,
        data: {
          role: data.role,
          permissions: member.permissions,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogDescription>
            Update the role and permissions for {member.user.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
