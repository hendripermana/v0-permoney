import { useState, useEffect } from 'react';
import { LineChart, BarChart, DonutChart } from '@/components';
import { PermoneyCard } from '@/components/permoney-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  spendingTrend: Array<{ label: string; value: number; date: string }>;
  categoryBreakdown: Array<{ label: string; value: number; color?: string }>;
  monthlyComparison: Array<{ label: string; value: number }>;
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockData: AnalyticsData = {
      spendingTrend: [
        { label: 'Day 1', value: 1200, date: '2024-01-01' },
        { label: 'Day 2', value: 800, date: '2024-01-02' },
        { label: 'Day 3', value: 1500, date: '2024-01-03' },
        { label: 'Day 4', value: 900, date: '2024-01-04' },
        { label: 'Day 5', value: 2100, date: '2024-01-05' },
        { label: 'Day 6', value: 1300, date: '2024-01-06' },
        { label: 'Day 7', value: 1700, date: '2024-01-07' },
      ],
      categoryBreakdown: [
        { label: 'Food & Dining', value: 4500, color: '#22c55e' },
        { label: 'Transportation', value: 2800, color: '#3b82f6' },
        { label: 'Shopping', value: 3200, color: '#f59e0b' },
        { label: 'Entertainment', value: 1500, color: '#ef4444' },
        { label: 'Bills & Utilities', value: 2200, color: '#8b5cf6' },
        { label: 'Healthcare', value: 800, color: '#06b6d4' },
      ],
      monthlyComparison: [
        { label: 'Jan', value: 15000 },
        { label: 'Feb', value: 12000 },
        { label: 'Mar', value: 18000 },
        { label: 'Apr', value: 14000 },
        { label: 'May', value: 16000 },
        { label: 'Jun', value: 13000 },
      ],
    };

    // Simulate loading
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const totalSpending =
    data?.categoryBreakdown?.reduce((sum, item) => sum + item.value, 0) || 0;
  const avgDaily = data?.spendingTrend
    ? data.spendingTrend.reduce((sum, item) => sum + item.value, 0) /
      data.spendingTrend.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Spending
              </p>
              <p className="text-2xl font-bold text-foreground">
                Rp {totalSpending.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-neon-green" />
            </div>
          </div>
        </PermoneyCard>

        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Daily Average
              </p>
              <p className="text-2xl font-bold text-foreground">
                Rp {Math.round(avgDaily).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </PermoneyCard>

        <PermoneyCard className="glassmorphism p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Categories</p>
              <p className="text-2xl font-bold text-foreground">
                {data?.categoryBreakdown.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </PermoneyCard>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          Financial Analytics
        </h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range
                  ? 'bg-neon-green hover:bg-neon-green/90'
                  : ''
              }
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Spending Trend
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          {data && (
            <LineChart
              data={data.spendingTrend}
              title="Daily Spending Trend"
              description="Track your spending patterns over time"
              loading={loading}
            />
          )}
        </TabsContent>

        <TabsContent value="categories">
          {data && (
            <DonutChart
              data={data.categoryBreakdown}
              title="Spending by Category"
              description="See where your money goes"
              centerText="Total"
              centerValue={`Rp ${totalSpending.toLocaleString()}`}
              loading={loading}
            />
          )}
        </TabsContent>

        <TabsContent value="comparison">
          {data && (
            <BarChart
              data={data.monthlyComparison}
              title="Monthly Spending Comparison"
              description="Compare spending across months"
              loading={loading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
