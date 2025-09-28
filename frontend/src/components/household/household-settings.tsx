'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Save } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '../ui/switch';
import { useHousehold, useUpdateSettings } from '../../hooks/use-households';
import { Household } from '../../lib/api';

const settingsSchema = z.object({
  baseCurrency: z.string().min(1, 'Base currency is required'),
  defaultViewType: z.enum(['individual', 'partner_only', 'combined']),
  enableNotifications: z.boolean().default(true),
  enableBudgetAlerts: z.boolean().default(true),
  privacyMode: z.boolean().default(false),
  autoCategorizationEnabled: z.boolean().default(true),
  currencyDisplayFormat: z.enum(['symbol', 'code', 'both']).default('symbol'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface HouseholdSettingsProps {
  householdId: string;
}

const currencies = [
  { value: 'IDR', label: 'Indonesian Rupiah (IDR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'MYR', label: 'Malaysian Ringgit (MYR)' },
];

const viewTypes = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Show only your personal financial data',
  },
  {
    value: 'partner_only',
    label: 'Partner Only',
    description: 'Show data shared between partners',
  },
  {
    value: 'combined',
    label: 'Combined',
    description: 'Show all household financial data',
  },
];

const currencyFormats = [
  { value: 'symbol', label: 'Symbol (₹, $, €)' },
  { value: 'code', label: 'Code (IDR, USD, EUR)' },
  { value: 'both', label: 'Both (₹ IDR, $ USD)' },
];

export function HouseholdSettings({ householdId }: HouseholdSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: household, isLoading } = useHousehold(householdId);
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      baseCurrency: household?.baseCurrency || 'IDR',
      defaultViewType: household?.settings?.defaultViewType || 'individual',
      enableNotifications: household?.settings?.enableNotifications ?? true,
      enableBudgetAlerts: household?.settings?.enableBudgetAlerts ?? true,
      privacyMode: household?.settings?.privacyMode ?? false,
      autoCategorizationEnabled: household?.settings?.autoCategorizationEnabled ?? true,
      currencyDisplayFormat: household?.settings?.currencyDisplayFormat || 'symbol',
    },
  });

  // Update form when household data loads
  React.useEffect(() => {
    if (household) {
      form.reset({
        baseCurrency: household.baseCurrency,
        defaultViewType: household.settings?.defaultViewType || 'individual',
        enableNotifications: household.settings?.enableNotifications ?? true,
        enableBudgetAlerts: household.settings?.enableBudgetAlerts ?? true,
        privacyMode: household.settings?.privacyMode ?? false,
        autoCategorizationEnabled: household.settings?.autoCategorizationEnabled ?? true,
        currencyDisplayFormat: household.settings?.currencyDisplayFormat || 'symbol',
      });
    }
  }, [household, form]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    try {
      await updateSettings.mutateAsync({
        householdId,
        settings: {
          ...data,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Household Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Household Settings
        </CardTitle>
        <CardDescription>
          Configure your household preferences and default settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Currency Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Currency & Display</h3>
              
              <FormField
                control={form.control}
                name="baseCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select base currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary currency for your household financial data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyDisplayFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Display Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select display format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How currency amounts are displayed throughout the app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* View Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Default View</h3>
              
              <FormField
                control={form.control}
                name="defaultViewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default View Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select default view" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {viewTypes.map((viewType) => (
                          <SelectItem key={viewType.value} value={viewType.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{viewType.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {viewType.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The default view when opening the dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Privacy & Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Privacy & Security</h3>
              
              <FormField
                control={form.control}
                name="privacyMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Privacy Mode</FormLabel>
                      <FormDescription>
                        Blur sensitive financial amounts by default
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* AI & Automation */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI & Automation</h3>
              
              <FormField
                control={form.control}
                name="autoCategorizationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Categorization</FormLabel>
                      <FormDescription>
                        Automatically suggest categories for new transactions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">General Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications about account activity
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableBudgetAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Budget Alerts</FormLabel>
                      <FormDescription>
                        Get notified when approaching budget limits
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
