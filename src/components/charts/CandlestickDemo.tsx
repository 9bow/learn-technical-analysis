import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useChartTheme, useResponsiveHeight, getChartOptions, getThemeColors } from './useChartTheme';

interface CandlestickDemoProps {
  dataset?: string;
  height?: number;
  title?: string;
}

export default function CandlestickDemo({
  dataset = 'uptrend-stock',
  height = 400,
  title,
}: CandlestickDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'bar'>('candlestick');
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const responsiveHeight = useResponsiveHeight(height);

  useChartTheme(chartRef);

  useEffect(() => {
    const raw = import.meta.env.BASE_URL || '/';
    const basePath = raw.endsWith('/') ? raw : raw + '/';
    fetch(`${basePath}data/ohlcv/${dataset}.json`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [dataset]);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: responsiveHeight,
      ...getChartOptions(getThemeColors()),
      crosshair: { mode: 0 },
    });

    chartRef.current = chart;

    if (chartType === 'candlestick') {
      const series = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      });
      series.setData(data);
    } else if (chartType === 'line') {
      const series = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      series.setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else {
      const series = chart.addBarSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
      });
      series.setData(data);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, responsiveHeight]);

  return (
    <div style={{ margin: '1rem 0' }}>
      {title && (
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {(['candlestick', 'line', 'bar'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              border: '1px solid',
              borderColor: chartType === type ? '#3b82f6' : '#6b7280',
              background: chartType === type ? '#3b82f6' : 'transparent',
              color: chartType === type ? '#fff' : 'inherit',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {type === 'candlestick' ? '캔들스틱' : type === 'line' ? '라인' : '바'}
          </button>
        ))}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
