'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, AlertCircle, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Budget, BudgetPeriod } from '@/types/budget';
import { useBudgetProgress } from '@/hooks/use-budgets';
import { formatCurrency } from '@/lib/utils';
import { EnvelopeVisualization } from './envelope-visualization';

interface BudgetCardProps {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const [showEnvelopes, setShowEnvelopes] = useState(false);
  const { data: progress, isLoading: progressLoading } = useBudgetProgress(budget.id);

  const getPeriodBadgeColor = (period: BudgetPeriod) => {
    switch (period) {
      case BudgetPeriod.WEEKLY:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case BudgetPeriod.MONTHLY:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case BudgetPeriod.YEARLY:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage <= 50) return 'text-green-600';
    if (percentage <= 80) return 'text-yellow-600';
    if (percentage <= 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 80) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const utilizationPercentage = progress?.utilizationPercentage || 0;
  const isOverBudget = progress?.isOverBudget || false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{budget.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getPeriodBadgeColor(budget.period)}>
                {budget.period.toLowerCase()}
              </Badge>
              {budget.isActive ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600 border-gray-600">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowEnvelopes(!showEnvelopes)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {showEnvelopes ? 'Hide' : 'Show'} Envelopes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget Overview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Budget Progress</span>
            <span className={`font-medium ${getUtilizationColor(utilizationPercentage)}`}>
              {progressLoading ? '...' : `${Math.round(utilizationPercentage)}%`}
            </span>
          </div>
          <Progress 
            value={Math.min(utilizationPercentage, 100)} 
            className="h-2"
            style={{
              '--progress-background': getProgressColor(utilizationPercentage)
            } as React.CSSProperties}
          />
          {isOverBudget && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="h-3 w-3" />
              Over budget
            </div>
          )}
        </div>

        {/* Budget Amounts */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Allocated</p>
            <p className="font-semibold">
              {formatCurrency(budget.totalAllocatedCents / 100, budget.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Spent</p>
            <p className="font-semibold">
              {progressLoading ? '...' : formatCurrency((progress?.totalSpent || 0) / 100, budget.currency)}
            </p>
          </div>
        </div>

        {/* Period Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
          </span>
        </div>

        {/* Days Remaining */}
        {progress?.daysRemaining !== undefined && (
          <div className="text-xs text-muted-foreground">
            {progress.daysRemaining > 0 
              ? `${progress.daysRemaining} days remaining`
              : 'Budget period ended'
            }
          </div>
        )}

        {/* Envelope Visualization */}
        {showEnvelopes && progress && (
          <div className="mt-4 pt-4 border-t">
            <EnvelopeVisualization 
              budgetProgress={progress}
              currency={budget.currency}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
