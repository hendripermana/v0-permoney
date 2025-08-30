import { PermoneyCard } from '@/components/permoney-card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  loading = false,
}: ChartContainerProps) {
  return (
    <PermoneyCard className={cn('glassmorphism p-6', className)}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </PermoneyCard>
  );
}
