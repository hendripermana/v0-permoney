'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePriceHistory } from '@/hooks/use-wishlist';
import type { PriceHistoryEntry } from '@/types/wishlist';

interface PriceHistoryChartProps {
  itemId: string;
  itemName: string;
  currency: string;
  targetPrice?: number;
  days?: number;
}

export function PriceHistoryChart({ 
  itemId, 
  itemName, 
  currency, 
  targetPrice,
  days = 30 
}: PriceHistoryChartProps) {
  const { data: priceHistory = [], isLoading } = usePriceHistory(itemId, days);

  const chartData = useMemo(() => {
    return priceHistory
      .slice()
      .reverse() // Show oldest to newest
      .map((entry) => ({
        date: new Date(entry.date).getTime(),
        price: entry.price,
        formattedDate: formatDate(new Date(entry.date)),
      }));
  }, [priceHistory]);

  const priceStats = useMemo(() => {
    if (priceHistory.length === 0) return null;

    const prices = priceHistory.map(p => p.price);
    const currentPrice = prices[0];
    const oldestPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const priceChange = currentPrice - oldestPrice;
    const priceChangePercent = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100) : 0;

    return {
      currentPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      priceChange,
      priceChangePercent,
    };
  }, [priceHistory]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading price history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-4xl">📈</div>
              <p className="text-muted-foreground">No price history available yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.formattedDate}</p>
          <p className="text-sm">
            Price: <span className="font-semibold">{formatCurrency(payload[0].value, currency)}</span>
          </p>
          {targetPrice && (
            <p className="text-xs text-muted-foreground">
              Target: {formatCurrency(targetPrice, currency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price History ({days} days)</CardTitle>
          {priceStats && (
            <div className="flex items-center space-x-2">
              {priceStats.priceChangePercent > 0 ? (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{priceStats.priceChangePercent.toFixed(1)}%</span>
                </Badge>
              ) : priceStats.priceChangePercent < 0 ? (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-green-100 text-green-800">
                  <TrendingDown className="h-3 w-3" />
                  <span>{priceStats.priceChangePercent.toFixed(1)}%</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Minus className="h-3 w-3" />
                  <span>0%</span>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Price Stats */}
        {priceStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="font-semibold">{formatCurrency(priceStats.currentPrice, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Lowest</p>
              <p className="font-semibold text-green-600">{formatCurrency(priceStats.lowestPrice, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Highest</p>
              <p className="font-semibold text-red-600">{formatCurrency(priceStats.highestPrice, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="font-semibold">{formatCurrency(priceStats.averagePrice, currency)}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => formatDate(new Date(value))}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => {
                  const formatted = formatCurrency(value, currency);
                  // Simple compact formatting - remove decimals and shorten
                  return formatted.replace(/\.00/, '').replace(/,000,000/, 'M').replace(/,000/, 'K');
                }}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Target price line */}
              {targetPrice && (
                <Line
                  type="monotone"
                  dataKey={() => targetPrice}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Target Price"
                />
              )}
              
              {/* Price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Price</span>
          </div>
          {targetPrice && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t"></div>
              <span>Target Price</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
