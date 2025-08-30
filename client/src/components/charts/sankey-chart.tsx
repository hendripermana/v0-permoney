import { ChartContainer } from './chart-container';
import { cn } from '@/lib/utils';

interface SankeyChartData {
  source: string;
  target: string;
  value: number;
}

interface SankeyChartProps {
  data: SankeyChartData[];
  title: string;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function SankeyChart({
  data,
  title,
  description,
  className,
  loading = false,
}: SankeyChartProps) {
  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Sankey Chart</div>
          <div className="text-sm">Cash flow visualization - Coming Soon</div>
          <div className="mt-4 text-xs opacity-60">
            Will show money flow between categories
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
