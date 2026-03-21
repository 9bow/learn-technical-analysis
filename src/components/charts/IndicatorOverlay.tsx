import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type CandlestickData, type Time, type ISeriesApi } from 'lightweight-charts';
import { useChartTheme, useResponsiveHeight, getChartOptions, getThemeColors } from './useChartTheme';
import { calcSMA, calcEMA, calcBollingerBands } from '../../lib/indicators';

type IndicatorType = 'sma20' | 'sma50' | 'ema20' | 'bb';

interface IndicatorOverlayProps {
  dataset?: string;
  height?: number;
  title?: string;
  availableIndicators?: IndicatorType[];
}

const INDICATOR_CONFIG: Record<IndicatorType, { label: string; color: string }> = {
  sma20: { label: 'SMA 20', color: '#f59e0b' },
  sma50: { label: 'SMA 50', color: '#8b5cf6' },
  ema20: { label: 'EMA 20', color: '#06b6d4' },
  bb: { label: '볼린저 밴드', color: '#ec4899' },
};

export default function IndicatorOverlay({
  dataset = 'uptrend-stock',
  height = 400,
  title,
  availableIndicators = ['sma20', 'sma50', 'ema20', 'bb'],
}: IndicatorOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorType>>(new Set());
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
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    candleSeries.setData(data);

    indicatorSeriesRef.current.clear();

    activeIndicators.forEach((indicator) => {
      if (indicator === 'bb') {
        const bb = calcBollingerBands(data);
        const upperSeries = chart.addLineSeries({
          color: INDICATOR_CONFIG.bb.color,
          lineWidth: 1,
          lineStyle: 2,
        });
        upperSeries.setData(bb.upper);

        const middleSeries = chart.addLineSeries({
          color: INDICATOR_CONFIG.bb.color,
          lineWidth: 1,
        });
        middleSeries.setData(bb.middle);

        const lowerSeries = chart.addLineSeries({
          color: INDICATOR_CONFIG.bb.color,
          lineWidth: 1,
          lineStyle: 2,
        });
        lowerSeries.setData(bb.lower);
      } else {
        const config = INDICATOR_CONFIG[indicator];
        const series = chart.addLineSeries({
          color: config.color,
          lineWidth: 2,
        });

        let indicatorData;
        if (indicator === 'sma20') indicatorData = calcSMA(data, 20);
        else if (indicator === 'sma50') indicatorData = calcSMA(data, 50);
        else indicatorData = calcEMA(data, 20);

        series.setData(indicatorData);
        indicatorSeriesRef.current.set(indicator, series);
      }
    });

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
  }, [data, activeIndicators, responsiveHeight]);

  const toggleIndicator = (indicator: IndicatorType) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(indicator)) {
        next.delete(indicator);
      } else {
        next.add(indicator);
      }
      return next;
    });
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      {title && (
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {availableIndicators.map((indicator) => {
          const config = INDICATOR_CONFIG[indicator];
          const isActive = activeIndicators.has(indicator);
          return (
            <button
              key={indicator}
              onClick={() => toggleIndicator(indicator)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                border: `2px solid ${config.color}`,
                background: isActive ? config.color : 'transparent',
                color: isActive ? '#fff' : 'inherit',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {config.label}
            </button>
          );
        })}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
