import { useEffect, useRef } from 'react';
import { ChartContainer } from './chart-container';
import { cn } from '@/lib/utils';

interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  title: string;
  description?: string;
  className?: string;
  loading?: boolean;
  centerText?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  title,
  description,
  className,
  loading = false,
  centerText,
  centerValue,
}: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const defaultColors = [
    '#22c55e', // neon-green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
  ];

  useEffect(() => {
    if (!canvasRef.current || loading || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2 - 60;
    const innerRadius = radius * 0.6;

    // Calculate total value
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Draw donut segments
    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = item.color || defaultColors[index % defaultColors.length];

      // Create gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color);

      // Draw slice
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.arc(
        centerX,
        centerY,
        innerRadius,
        currentAngle + sliceAngle,
        currentAngle,
        true
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw slice border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw percentage label
      const percentage = ((item.value / total) * 100).toFixed(1);
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = (radius + innerRadius) / 2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (parseFloat(percentage) > 5) {
        // Only show percentage if slice is large enough
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });

    // Draw center text
    if (centerText || centerValue) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (centerValue) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(centerValue, centerX, centerY - 8);
      }

      if (centerText) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(centerText, centerX, centerY + (centerValue ? 16 : 0));
      }
    }
  }, [data, loading, centerText, centerValue]);

  // Calculate total for legend
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <canvas
          ref={canvasRef}
          className="w-64 h-64 rounded-lg flex-shrink-0"
          style={{ display: loading ? 'none' : 'block' }}
        />

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color =
              item.color || defaultColors[index % defaultColors.length];

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-foreground font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartContainer>
  );
}
