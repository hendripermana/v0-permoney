import { ChartContainer } from './chart-container';
import { cn } from '@/lib/utils';

interface HeatmapChartData {
  day: string;
  hour: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapChartData[];
  title: string;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function HeatmapChart({
  data,
  title,
  description,
  className,
  loading = false,
}: HeatmapChartProps) {
  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Heatmap Chart</div>
          <div className="text-sm">
            Spending patterns visualization - Coming Soon
          </div>
          <div className="mt-4 text-xs opacity-60">
            Will show spending intensity by time and day
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
