'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BudgetProgress } from '@/types/budget';
import { formatCurrency } from '@/lib/utils';

interface EnvelopeVisualizationProps {
  budgetProgress: BudgetProgress;
  currency: string;
}

export function EnvelopeVisualization({ budgetProgress, currency }: EnvelopeVisualizationProps) {
  const getEnvelopeColor = (utilizationPercentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700';
    if (utilizationPercentage <= 50) return 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700';
    if (utilizationPercentage <= 80) return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700';
    return 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700';
  };

  const getProgressColor = (utilizationPercentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (utilizationPercentage <= 50) return 'bg-green-500';
    if (utilizationPercentage <= 80) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Budget Envelopes</h4>
      <div className="space-y-3">
        {budgetProgress.categories.map((category) => (
          <div
            key={category.categoryId}
            className={`p-3 rounded-lg border-2 ${getEnvelopeColor(category.utilizationPercentage, category.isOverBudget)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span className="font-medium text-sm">{category.categoryName}</span>
              </div>
              <Badge 
                variant={category.isOverBudget ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {Math.round(category.utilizationPercentage)}%
              </Badge>
            </div>
            
            <Progress 
              value={Math.min(category.utilizationPercentage, 100)} 
              className="h-2 mb-2"
              style={{
                '--progress-background': getProgressColor(category.utilizationPercentage, category.isOverBudget)
              } as React.CSSProperties}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Spent: {formatCurrency(category.spent / 100, currency)}
              </span>
              <span>
                Budget: {formatCurrency(category.allocated / 100, currency)}
              </span>
            </div>
            
            {category.remaining !== 0 && (
              <div className="text-xs mt-1">
                {category.remaining > 0 ? (
                  <span className="text-green-600">
                    {formatCurrency(category.remaining / 100, currency)} remaining
                  </span>
                ) : (
                  <span className="text-red-600">
                    {formatCurrency(Math.abs(category.remaining) / 100, currency)} over budget
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
