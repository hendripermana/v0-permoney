import { useEffect, useRef } from 'react';
import { ChartContainer } from './chart-container';
import { cn } from '@/lib/utils';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function BarChart({
  data,
  title,
  description,
  className,
  loading = false,
}: BarChartProps) {
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
    const padding = 60;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (chartWidth / data.length) * 0.8;
    const barSpacing = (chartWidth / data.length) * 0.2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = padding + chartHeight - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      const color = item.color || defaultColors[index % defaultColors.length];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80'); // Add transparency

      // Draw bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw bar border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const valueText = item.value.toLocaleString();
      ctx.fillText(valueText, x + barWidth / 2, y - 8);

      // Draw label below bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '11px Inter, sans-serif';
      const labelY = padding + chartHeight + 20;

      // Truncate long labels
      let label = item.label;
      if (label.length > 10) {
        label = label.substring(0, 8) + '...';
      }

      ctx.fillText(label, x + barWidth / 2, labelY);
    });

    // Draw Y-axis labels (values)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(value.toLocaleString(), padding - 10, y);
    }
  }, [data, loading]);

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-80 rounded-lg"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </ChartContainer>
  );
}
