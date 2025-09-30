'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatMonthDay } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NetWorthDataPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  timestamp: number;
}

interface NetWorthChartProps {
  data: NetWorthDataPoint[];
  currency?: string;
  title?: string;
  description?: string;
  className?: string;
  showAssetLiabilityBreakdown?: boolean;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const timeRangeLabels: Record<TimeRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '3 Months',
  '1y': '1 Year',
  'all': 'All Time'
};

function CustomTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
  currency?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {label ? formatDate(new Date(label)) : 'Unknown Date'}
        </p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="text-muted-foreground">
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function NetWorthChart({ 
  data, 
  currency = 'IDR',
  title = 'Net Worth Trend',
  description = 'Track your financial progress over time',
  className,
  showAssetLiabilityBreakdown = false
}: NetWorthChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');
  
  // Filter data based on selected time range
  const filteredData = data.filter(point => {
    const now = Date.now();
    const pointTime = point.timestamp;
    
    switch (selectedRange) {
      case '7d':
        return now - pointTime <= 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - pointTime <= 30 * 24 * 60 * 60 * 1000;
      case '90d':
        return now - pointTime <= 90 * 24 * 60 * 60 * 1000;
      case '1y':
        return now - pointTime <= 365 * 24 * 60 * 60 * 1000;
      case 'all':
      default:
        return true;
    }
  });

  // Calculate trend
  const firstValue = filteredData[0]?.netWorth || 0;
  const lastValue = filteredData[filteredData.length - 1]?.netWorth || 0;
  const trend = lastValue - firstValue;
  const trendPercentage = firstValue !== 0 ? (trend / firstValue) * 100 : 0;
  
  const isPositiveTrend = trend >= 0;
  const trendColor = isPositiveTrend ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <Card className={`permoney-card-chunky ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {/* Time range selector */}
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
            {Object.entries(timeRangeLabels).map(([range, label]) => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRange(range as TimeRange)}
                className="text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Trend summary */}
        <div className="flex items-center space-x-4 mt-2">
          <div>
            <span className="text-2xl font-bold">
              {formatCurrency(lastValue, currency)}
            </span>
          </div>
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            <span className="text-sm font-medium">
              {isPositiveTrend ? '+' : ''}{formatCurrency(trend, currency)}
            </span>
            <span className="text-xs">
              ({isPositiveTrend ? '+' : ''}{trendPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {showAssetLiabilityBreakdown ? (
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => formatMonthDay(value as string)}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value, currency).replace(/\D/g, '') + 'M'}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                
                {/* Assets area */}
                <Area
                  type="monotone"
                  dataKey="assets"
                  stackId="1"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.6}
                  name="Assets"
                />
                
                {/* Liabilities area (negative) */}
                <Area
                  type="monotone"
                  dataKey="liabilities"
                  stackId="2"
                  stroke="hsl(0, 84%, 60%)"
                  fill="hsl(0, 84%, 60%)"
                  fillOpacity={0.6}
                  name="Liabilities"
                />
                
                {/* Net worth line */}
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 }}
                  name="Net Worth"
                />
              </AreaChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => formatMonthDay(value as string)}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => {
                    const millions = value / 1000000;
                    return millions >= 1 ? `${millions.toFixed(0)}M` : `${(value / 1000).toFixed(0)}K`;
                  }}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                
                {/* Net worth line with gradient */}
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="url(#netWorthGradient)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 }}
                  name="Net Worth"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
                    <stop offset="50%" stopColor="hsl(217, 91%, 60%)" />
                    <stop offset="100%" stopColor="hsl(271, 91%, 65%)" />
                  </linearGradient>
                </defs>
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Chart legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Net Worth</span>
          </div>
          {showAssetLiabilityBreakdown && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Assets</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Liabilities</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate sample net worth data
export function generateSampleNetWorthData(months = 12): NetWorthDataPoint[] {
  const data: NetWorthDataPoint[] = [];
  const now = new Date();
  
  for (let i = months; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseAssets = 50000000 + (months - i) * 2000000 + Math.random() * 5000000;
    const baseLiabilities = 15000000 - (months - i) * 500000 + Math.random() * 2000000;
    
    data.push({
      date: date.toISOString(),
      assets: baseAssets,
      liabilities: baseLiabilities,
      netWorth: baseAssets - baseLiabilities,
      timestamp: date.getTime()
    });
  }
  
  return data;
}
