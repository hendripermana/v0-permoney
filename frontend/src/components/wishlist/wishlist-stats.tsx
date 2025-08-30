'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Target, 
  ShoppingCart, 
  DollarSign,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface WishlistStatsProps {
  stats: {
    total: number;
    active: number;
    purchased: number;
    targetReached: number;
    totalValue: number;
  };
}

export function WishlistStats({ stats }: WishlistStatsProps) {
  const statCards = [
    {
      title: 'Total Items',
      value: stats.total,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Tracking',
      value: stats.active,
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Target Reached',
      value: stats.targetReached,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      highlight: stats.targetReached > 0,
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue, 'IDR'),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`relative ${stat.highlight ? 'ring-2 ring-orange-200' : ''}`}>
          {stat.highlight && (
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-orange-500 text-white text-xs">
                New!
              </Badge>
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.isValue ? stat.value : stat.value.toLocaleString()}
            </div>
            {stat.title === 'Active Tracking' && stats.total > 0 && (
              <p className="text-xs text-muted-foreground">
                {((stats.active / stats.total) * 100).toFixed(0)}% of total items
              </p>
            )}
            {stat.title === 'Target Reached' && stats.active > 0 && (
              <p className="text-xs text-muted-foreground">
                {((stats.targetReached / stats.active) * 100).toFixed(0)}% of active items
              </p>
            )}
            {stat.title === 'Total Value' && stats.active > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.active} active items
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
