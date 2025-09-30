'use client';

import { Heart, HelpingHand, Gift, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { GratitudeSummary } from '@/lib/api/gratitude';

const gratitudeTypeConfig = {
  TREAT: {
    icon: Heart,
    label: 'Treats',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  HELP: {
    icon: HelpingHand,
    label: 'Help',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  GIFT: {
    icon: Gift,
    label: 'Gifts',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

interface GratitudeSummaryProps {
  summary: GratitudeSummary;
  className?: string;
}

export function GratitudeSummaryComponent({ summary, className }: GratitudeSummaryProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate max values for progress bars
  const maxTypeCount = Math.max(...summary.byType.map(t => t.count));
  const maxGiverCount = Math.max(...summary.topGivers.map(g => g.count));
  const maxMonthlyCount = Math.max(...summary.monthlyTrend.map(m => m.count));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalEntries}</p>
                <p className="text-sm text-muted-foreground">Total Gratitude Moments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {summary.totalValueCents > 0 ? formatCurrency(summary.totalValueCents) : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Total Estimated Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.topGivers.length}</p>
                <p className="text-sm text-muted-foreground">People Showing Gratitude</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gratitude Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Gratitude Types</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.byType.map((type) => {
              const config = gratitudeTypeConfig[type.type];
              const Icon = config.icon;
              const percentage = maxTypeCount > 0 ? (type.count / maxTypeCount) * 100 : 0;

              return (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className={cn('h-4 w-4', config.color)} />
                      <span className="font-medium">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {type.count}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {type.totalValueCents > 0 && formatCurrency(type.totalValueCents)}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  {type.averageValueCents > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Average: {formatCurrency(type.averageValueCents)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Givers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Top Givers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.topGivers.slice(0, 5).map((giver, index) => {
              const percentage = maxGiverCount > 0 ? (giver.count / maxGiverCount) * 100 : 0;

              return (
                <div key={giver.giver} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{giver.giver}</span>
                      <Badge variant="secondary" className="text-xs">
                        {giver.count} times
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {giver.totalValueCents > 0 && formatCurrency(giver.totalValueCents)}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Last: {new Date(giver.lastGratitudeDate).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      {summary.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Monthly Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.monthlyTrend.slice(-6).map((month) => {
                const percentage = maxMonthlyCount > 0 ? (month.count / maxMonthlyCount) * 100 : 0;

                return (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatMonth(month.month)}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {month.count} entries
                        </Badge>
                        {month.totalValueCents > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(month.totalValueCents)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
