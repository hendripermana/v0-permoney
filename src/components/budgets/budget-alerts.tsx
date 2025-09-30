'use client';

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BudgetAlert, BudgetAlertSeverity, BudgetAlertType } from '@/types/budget';
import { useBudgets } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils';

export function BudgetAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { data: budgets } = useBudgets({ isActive: true });

  // Mock alerts - in real implementation, these would come from the API
  const mockAlerts: BudgetAlert[] = [
    {
      id: '1',
      budgetId: 'budget-1',
      categoryId: 'cat-1',
      type: BudgetAlertType.APPROACHING_LIMIT,
      severity: BudgetAlertSeverity.MEDIUM,
      title: 'Food & Dining approaching limit',
      message: 'You\'ve spent 85% of your Food & Dining budget for this month.',
      threshold: 85,
      currentValue: 85,
      createdAt: new Date().toISOString(),
      isRead: false,
    },
    {
      id: '2',
      budgetId: 'budget-1',
      type: BudgetAlertType.OVERSPEND,
      severity: BudgetAlertSeverity.HIGH,
      title: 'Entertainment budget exceeded',
      message: 'You\'ve exceeded your Entertainment budget by 15%.',
      threshold: 100,
      currentValue: 115,
      createdAt: new Date().toISOString(),
      isRead: false,
    },
  ];

  const activeAlerts = mockAlerts.filter(alert => !dismissedAlerts.has(alert.id));

  const getSeverityIcon = (severity: BudgetAlertSeverity) => {
    switch (severity) {
      case BudgetAlertSeverity.LOW:
        return <Info className="h-4 w-4" />;
      case BudgetAlertSeverity.MEDIUM:
        return <AlertCircle className="h-4 w-4" />;
      case BudgetAlertSeverity.HIGH:
        return <AlertTriangle className="h-4 w-4" />;
      case BudgetAlertSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: BudgetAlertSeverity) => {
    switch (severity) {
      case BudgetAlertSeverity.LOW:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case BudgetAlertSeverity.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case BudgetAlertSeverity.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case BudgetAlertSeverity.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Budget Alerts
        </CardTitle>
        <CardDescription>
          Important notifications about your budget performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeAlerts.map((alert) => (
          <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="space-y-1">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm opacity-90">{alert.message}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.type.toLowerCase().replace('_', ' ')}
                    </Badge>
                    <span className="text-xs opacity-75">
                      {alert.currentValue}% of budget
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
