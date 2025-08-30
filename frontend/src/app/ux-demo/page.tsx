'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Advanced UX Components
import { OnboardingTrigger, OnboardingOverlay } from '@/components/onboarding';
import { PrivacySettings, PrivacyToggle, BalanceBlur } from '@/components/privacy';
import { 
  TransactionEmoji, 
  TransactionColorTag, 
  TransactionAmount, 
  VisualTransactionCard,
  EmojiPicker 
} from '@/components/transactions/transaction-visual-enhancements';
import { NotificationCenter, useNotificationActions } from '@/components/notifications';
import { useToastActions } from '@/hooks/use-toast';
import { OfflineIndicator, useOfflineQueue } from '@/components/offline';
import { ErrorDisplay, NetworkError, ValidationError, SuccessMessage } from '@/components/error';
import { 
  DashboardSkeleton, 
  TransactionListSkeleton, 
  AccountCardSkeleton,
  ProgressiveLoading,
  LoadingSpinner,
  PulseLoading 
} from '@/components/loading';
import { useProgressiveLoading } from '@/hooks/use-progressive-loading';

// Demo data
const demoTransactions = [
  {
    id: '1',
    description: 'Starbucks Coffee',
    amount: 45000,
    currency: 'IDR',
    category: 'coffee',
    merchant: 'Starbucks',
    type: 'expense' as const,
    date: new Date(),
    tags: ['coffee', 'morning'],
  },
  {
    id: '2',
    description: 'Salary Payment',
    amount: 15000000,
    currency: 'IDR',
    category: 'salary',
    type: 'income' as const,
    date: new Date(),
  },
  {
    id: '3',
    description: 'Grab Food Delivery',
    amount: 85000,
    currency: 'IDR',
    category: 'delivery',
    merchant: 'Grab',
    type: 'expense' as const,
    date: new Date(),
    tags: ['food', 'delivery'],
  },
];

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Permoney!',
    description: 'Let\'s take a quick tour of the advanced UX features we\'ve built.',
    position: 'center' as const,
  },
  {
    id: 'privacy-toggle',
    title: 'Privacy Mode',
    description: 'Click the eye icon in the header to toggle privacy mode and blur sensitive data.',
    target: '[data-privacy-toggle]',
    position: 'bottom' as const,
  },
  {
    id: 'notifications',
    title: 'Notification Center',
    description: 'Stay updated with all your financial alerts and system notifications.',
    target: '[data-notification-center]',
    position: 'bottom' as const,
  },
  {
    id: 'offline-indicator',
    title: 'Offline Support',
    description: 'Your actions are queued when offline and synced when you\'re back online.',
    target: '[data-offline-indicator]',
    position: 'bottom' as const,
  },
];

export default function UXDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [demoBalance] = useState(2500000);

  const { showSuccess, showError: showErrorToast, showLoading, showSyncStatus } = useToastActions();
  const { showSuccess: showSuccessNotification, showError: showErrorNotification } = useNotificationActions();
  const { actions } = useOfflineQueue();
  
  const { showSkeleton, showContent } = useProgressiveLoading(isLoading, {
    showSkeletonAfter: 200,
    minLoadingTime: 1000,
  });

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleToastDemo = () => {
    showSuccess('Success!', 'This is a success toast message with enhanced styling.');
  };

  const handleErrorDemo = () => {
    showErrorToast('Error Occurred', 'This is an error toast with retry functionality.', {
      retryable: true,
      onRetry: () => console.log('Retrying...'),
    });
  };

  const handleNotificationDemo = () => {
    showSuccessNotification('Budget Alert', 'You\'ve exceeded your coffee budget for this month.');
  };

  const handleSyncDemo = () => {
    const toastId = showSyncStatus('starting');
    
    setTimeout(() => {
      showSyncStatus('progress', { toastId, progress: 50 });
    }, 1000);
    
    setTimeout(() => {
      showSyncStatus('success', { toastId, message: 'All transactions synced successfully' });
    }, 2000);
  };

  const handleOfflineDemo = () => {
    actions.addTransaction({
      description: 'Demo Transaction',
      amount: 50000,
      category: 'demo',
    });
    showSuccessNotification('Transaction Queued', 'Transaction added to offline queue for syncing.');
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Advanced UX Features Demo</h1>
        <p className="text-xl text-muted-foreground">
          Explore the enhanced user experience features built for Permoney
        </p>
        <OnboardingTrigger steps={onboardingSteps} variant="button">
          Start Interactive Tour
        </OnboardingTrigger>
      </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="loading">Loading</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        {/* Visual Enhancements */}
        <TabsContent value="visual" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Visual Transaction Enhancements</CardTitle>
              <CardDescription>
                Enhanced transaction display with emojis, color tags, and visual improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Emoji Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Category Emojis</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <TransactionEmoji category="coffee" />
                    <span>Coffee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TransactionEmoji category="transport" />
                    <span>Transport</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TransactionEmoji category="shopping" />
                    <span>Shopping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TransactionEmoji category="food" />
                    <span>Food</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Pick an emoji:</Label>
                  <EmojiPicker 
                    onEmojiSelect={setSelectedEmoji}
                    selectedEmoji={selectedEmoji}
                  />
                  {selectedEmoji && <span>Selected: {selectedEmoji}</span>}
                </div>
              </div>

              <Separator />

              {/* Color Tags Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Color-Coded Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <TransactionColorTag category="income" type="income">Income</TransactionColorTag>
                  <TransactionColorTag category="food" type="expense">Food</TransactionColorTag>
                  <TransactionColorTag category="transport" type="expense">Transport</TransactionColorTag>
                  <TransactionColorTag category="shopping" type="expense">Shopping</TransactionColorTag>
                  <TransactionColorTag category="health" type="expense">Health</TransactionColorTag>
                </div>
              </div>

              <Separator />

              {/* Transaction Cards Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Enhanced Transaction Cards</h3>
                <div className="space-y-3">
                  {demoTransactions.map((transaction) => (
                    <VisualTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      showEmoji={true}
                      showColorTag={true}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Mode */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Privacy Mode Demo</CardTitle>
              <CardDescription>
                Control how sensitive financial data is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span>Privacy Toggle:</span>
                <PrivacyToggle variant="button" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Balance Blurring Demo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BalanceBlur>
                        <div className="text-2xl font-bold text-green-600">
                          Rp {demoBalance.toLocaleString('id-ID')}
                        </div>
                      </BalanceBlur>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BalanceBlur>
                        <div className="text-lg font-semibold text-red-600">
                          -Rp 85,000
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Grab Food Delivery
                        </div>
                      </BalanceBlur>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <PrivacySettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Notification System Demo</CardTitle>
              <CardDescription>
                Toast notifications and persistent notification center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleToastDemo} variant="outline">
                  Show Success Toast
                </Button>
                <Button onClick={handleErrorDemo} variant="outline">
                  Show Error Toast
                </Button>
                <Button onClick={handleNotificationDemo} variant="outline">
                  Add Notification
                </Button>
                <Button onClick={handleSyncDemo} variant="outline">
                  Demo Sync Progress
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Check the notification center in the header to see persistent notifications
                </p>
                <NotificationCenter 
                  trigger={
                    <Button variant="outline">
                      Open Notification Center
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loading States */}
        <TabsContent value="loading" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Progressive Loading States</CardTitle>
              <CardDescription>
                Skeleton screens and progressive loading animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={handleLoadingDemo} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Demo Loading States'}
                </Button>
                {isLoading && <LoadingSpinner text="Processing..." />}
              </div>

              <Separator />

              <ProgressiveLoading
                isLoading={isLoading}
                skeleton={<DashboardSkeleton />}
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Loaded Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          Rp 2,500,000
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Spending</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          Rp 1,250,000
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ProgressiveLoading>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Loading Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Pulse Loading</Label>
                    <div className="mt-2">
                      <PulseLoading />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Spinner Loading</Label>
                    <div className="mt-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Handling */}
        <TabsContent value="errors" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Error Handling Demo</CardTitle>
              <CardDescription>
                Human-readable error messages and user-friendly error displays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setShowError(!showError)} 
                  variant="outline"
                >
                  {showError ? 'Hide' : 'Show'} Error Display
                </Button>
              </div>

              {showError && (
                <div className="space-y-4">
                  <ErrorDisplay
                    error={{ status: 500, message: 'Internal server error' }}
                    onRetry={() => console.log('Retrying...')}
                    onDismiss={() => setShowError(false)}
                    variant="card"
                    showDetails={true}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Specialized Error Components</h3>
                
                <NetworkError onRetry={() => console.log('Retrying network...')} />
                
                <ValidationError 
                  errors={{
                    'Amount': 'Must be a positive number',
                    'Category': 'Please select a category',
                    'Date': 'Cannot be in the future'
                  }}
                  onDismiss={() => console.log('Dismissed')}
                />
                
                <SuccessMessage
                  title="Transaction Created"
                  message="Your transaction has been successfully recorded."
                  action={{
                    label: 'View Transaction',
                    onClick: () => console.log('View transaction'),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Support */}
        <TabsContent value="offline" className="space-y-6">
          <Card className="permoney-card">
            <CardHeader>
              <CardTitle>Offline Support Demo</CardTitle>
              <CardDescription>
                Transaction queueing and sync when offline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span>Offline Indicator:</span>
                <OfflineIndicator />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Queue Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Actions are automatically queued when offline and synced when connection is restored.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleOfflineDemo} variant="outline">
                    Add Demo Transaction
                  </Button>
                  <Button 
                    onClick={() => {
                      // Simulate going offline
                      Object.defineProperty(navigator, 'onLine', {
                        writable: true,
                        value: false,
                      });
                      window.dispatchEvent(new Event('offline'));
                    }}
                    variant="outline"
                  >
                    Simulate Offline
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  Note: The offline indicator in the header shows the current queue status 
                  and allows you to manually retry failed syncs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Onboarding Overlay */}
      <OnboardingOverlay steps={onboardingSteps} />
    </div>
  );
}
