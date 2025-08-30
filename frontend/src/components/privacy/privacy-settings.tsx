'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, Clock, Lock } from 'lucide-react';
import { usePrivacy } from './privacy-provider';

export function PrivacySettings() {
  const { state, updateSettings } = usePrivacy();

  const handleAutoLockTimeoutChange = (value: string) => {
    updateSettings({ autoLockTimeout: parseInt(value, 10) });
  };

  return (
    <Card className="permoney-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-neon-green" />
          <CardTitle>Privacy Settings</CardTitle>
        </div>
        <CardDescription>
          Control how your financial data is displayed and protected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacy Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Hide sensitive financial information
            </p>
          </div>
          <Switch
            checked={state.isPrivacyMode}
            onCheckedChange={(checked) => updateSettings({ isPrivacyMode: checked })}
          />
        </div>

        <Separator />

        {/* Blur Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium">What to Hide</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Account Balances</Label>
                <p className="text-xs text-muted-foreground">
                  Hide account balance amounts
                </p>
              </div>
              <Switch
                checked={state.hideBalances}
                onCheckedChange={(checked) => updateSettings({ hideBalances: checked })}
                disabled={!state.isPrivacyMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Transaction Amounts</Label>
                <p className="text-xs text-muted-foreground">
                  Hide transaction amounts in lists
                </p>
              </div>
              <Switch
                checked={state.hideTransactionAmounts}
                onCheckedChange={(checked) => updateSettings({ hideTransactionAmounts: checked })}
                disabled={!state.isPrivacyMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Sensitive Data</Label>
                <p className="text-xs text-muted-foreground">
                  Blur other sensitive information
                </p>
              </div>
              <Switch
                checked={state.blurSensitiveData}
                onCheckedChange={(checked) => updateSettings({ blurSensitiveData: checked })}
                disabled={!state.isPrivacyMode}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Auto-lock Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Auto-lock
          </Label>
          
          <div className="space-y-2">
            <Label className="text-sm">Enable privacy mode after inactivity</Label>
            <Select
              value={state.autoLockTimeout.toString()}
              onValueChange={handleAutoLockTimeoutChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Disabled</SelectItem>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="2">2 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Automatically enable privacy mode when you&apos;re away
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Status:</span>
            <span className={state.isPrivacyMode ? 'text-neon-green' : 'text-muted-foreground'}>
              {state.isPrivacyMode ? 'Privacy mode active' : 'Privacy mode disabled'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
