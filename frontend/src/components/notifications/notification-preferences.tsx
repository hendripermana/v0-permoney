'use client';

import React, { useState } from 'react';
import { X, Bell, Mail, Smartphone, Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/notification-context';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferencesProps {
  onClose: () => void;
}

const channelOptions = [
  { value: 'IN_APP', label: 'In-App', icon: Bell },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PUSH', label: 'Push', icon: Smartphone },
];

export function NotificationPreferences({ onClose }: NotificationPreferencesProps) {
  const { preferences, updatePreferences, sendTestNotification, subscribeToPush } = useNotifications();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = async () => {
    if (!localPreferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences(localPreferences);
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async (type: string) => {
    try {
      await sendTestNotification(type, ['IN_APP', 'EMAIL']);
      toast({
        title: 'Test Notification Sent',
        description: 'Check your notifications to see the test message.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      });
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Push notifications require permission to work.',
          variant: 'destructive',
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await subscribeToPush(subscription);
      toast({
        title: 'Push Notifications Enabled',
        description: 'You will now receive push notifications.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications.',
        variant: 'destructive',
      });
    }
  };

  const updatePreferenceSection = (section: string, updates: any) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      [section]: {
        ...localPreferences[section as keyof typeof localPreferences],
        ...updates,
      },
    });
  };

  const toggleChannel = (section: string, channel: string) => {
    if (!localPreferences) return;
    
    const currentChannels = (localPreferences[section as keyof typeof localPreferences] as any).channels;
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c: string) => c !== channel)
      : [...currentChannels, channel];
    
    updatePreferenceSection(section, { channels: newChannels });
  };

  if (!localPreferences) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Loading Preferences...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize how and when you receive notifications
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Budget Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you approach or exceed your budget limits
              </p>
            </div>
            <Switch
              checked={localPreferences.budgetAlerts.enabled}
              onCheckedChange={(enabled) => 
                updatePreferenceSection('budgetAlerts', { enabled })
              }
            />
          </div>
          
          {localPreferences.budgetAlerts.enabled && (
            <div className="ml-4 space-y-3">
              <div>
                <Label className="text-sm">Alert Threshold (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={localPreferences.budgetAlerts.threshold}
                  onChange={(e) => 
                    updatePreferenceSection('budgetAlerts', { 
                      threshold: parseInt(e.target.value) 
                    })
                  }
                  className="w-20"
                />
              </div>
              
              <div>
                <Label className="text-sm">Notification Channels</Label>
                <div className="flex gap-4 mt-2">
                  {channelOptions.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`budget-${channel.value}`}
                        checked={localPreferences.budgetAlerts.channels.includes(channel.value)}
                        onCheckedChange={() => toggleChannel('budgetAlerts', channel.value)}
                      />
                      <Label htmlFor={`budget-${channel.value}`} className="text-sm">
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification('BUDGET_WARNING')}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          )}
        </div>
        <Separator />

        {/* Zakat Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Zakat Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about Zakat calculations and payments
              </p>
            </div>
            <Switch
              checked={localPreferences.zakatReminders.enabled}
              onCheckedChange={(enabled) =>
                updatePreferenceSection('zakatReminders', { enabled })
              }
            />
          </div>

          {localPreferences.zakatReminders.enabled && (
            <div className="ml-4 space-y-3">
              <div>
                <Label className="text-sm">Days Before Due</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={localPreferences.zakatReminders.daysBefore}
                  onChange={(e) =>
                    updatePreferenceSection('zakatReminders', {
                      daysBefore: parseInt(e.target.value),
                    })
                  }
                  className="w-20"
                />
              </div>

              <div>
                <Label className="text-sm">Notification Channels</Label>
                <div className="flex gap-4 mt-2">
                  {channelOptions.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`zakat-${channel.value}`}
                        checked={localPreferences.zakatReminders.channels.includes(channel.value)}
                        onCheckedChange={() => toggleChannel('zakatReminders', channel.value)}
                      />
                      <Label htmlFor={`zakat-${channel.value}`} className="text-sm">
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification('ZAKAT_REMINDER')}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Push Notifications */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Enable browser push notifications for real-time alerts
            </p>
          </div>

          <Button variant="outline" onClick={handleEnablePushNotifications}>
            <Smartphone className="h-4 w-4 mr-2" />
            Enable Push Notifications
          </Button>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
