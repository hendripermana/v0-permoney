import { useEffect, useRef } from 'react';
import { ChartContainer } from './chart-container';
import { cn } from '@/lib/utils';

interface LineChartData {
  label: string;
  value: number;
  date: string;
}

interface LineChartProps {
  data: LineChartData[];
  title: string;
  description?: string;
  className?: string;
  color?: string;
  loading?: boolean;
}

export function LineChart({
  data,
  title,
  description,
  className,
  color = '#22c55e',
  loading = false,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (chartWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y =
        padding +
        chartHeight -
        ((point.value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y =
        padding +
        chartHeight -
        ((point.value - minValue) / valueRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels (dates)
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 6) === 0) {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const date = new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        ctx.fillText(date, x, rect.height - 10);
      }
    });

    // Y-axis labels (values)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (valueRange / 4) * (4 - i);
      const y = padding + (chartHeight / 4) * i + 4;
      ctx.fillText(value.toLocaleString(), padding - 10, y);
    }
  }, [data, loading, color]);

  return (
    <ChartContainer
      title={title}
      description={description}
      className={className}
      loading={loading}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-64 rounded-lg"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </ChartContainer>
  );
}
