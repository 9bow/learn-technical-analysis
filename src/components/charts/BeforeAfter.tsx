import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useChartTheme, useResponsiveHeight, getChartOptions, getThemeColors } from './useChartTheme';

interface BeforeAfterProps {
  dataset?: string;
  splitRatio?: number;
  height?: number;
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfter({
  dataset = 'breakout-example',
  splitRatio = 0.6,
  height = 350,
  title,
  beforeLabel = '패턴 형성 구간',
  afterLabel = '결과 확인',
}: BeforeAfterProps) {
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const beforeChartRef = useRef<IChartApi | null>(null);
  const afterChartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const [showAfter, setShowAfter] = useState(false);
  const responsiveHeight = useResponsiveHeight(height);

  useChartTheme(beforeChartRef);
  useChartTheme(afterChartRef);

  useEffect(() => {
    const raw = import.meta.env.BASE_URL || '/';
    const basePath = raw.endsWith('/') ? raw : raw + '/';
    fetch(`${basePath}data/ohlcv/${dataset}.json`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [dataset]);

  const createChartInstance = (
    container: HTMLDivElement,
    chartData: CandlestickData<Time>[],
  ) => {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: responsiveHeight,
      ...getChartOptions(getThemeColors()),
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    series.setData(chartData);
    chart.timeScale().fitContent();
    return chart;
  };

  useEffect(() => {
    if (!beforeRef.current || data.length === 0) return;

    const splitIndex = Math.floor(data.length * splitRatio);
    const beforeData = data.slice(0, splitIndex);
    const chart = createChartInstance(beforeRef.current, beforeData);
    beforeChartRef.current = chart;

    const handleResize = () => {
      if (beforeRef.current) {
        chart.applyOptions({ width: beforeRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      beforeChartRef.current = null;
    };
  }, [data, splitRatio, responsiveHeight]);

  useEffect(() => {
    if (!afterRef.current || data.length === 0 || !showAfter) return;

    const chart = createChartInstance(afterRef.current, data);
    afterChartRef.current = chart;

    const handleResize = () => {
      if (afterRef.current) {
        chart.applyOptions({ width: afterRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      afterChartRef.current = null;
    };
  }, [data, showAfter, responsiveHeight]);

  return (
    <div style={{ margin: '1rem 0' }}>
      {title && (
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {title}
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
          {beforeLabel}
        </div>
        <div ref={beforeRef} />
      </div>
      <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
        <button
          onClick={() => setShowAfter(!showAfter)}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '0.375rem',
            border: '1px solid #3b82f6',
            background: showAfter ? '#3b82f6' : 'transparent',
            color: showAfter ? '#fff' : '#3b82f6',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          {showAfter ? '결과 숨기기' : '결과 확인하기 →'}
        </button>
      </div>
      {showAfter && (
        <div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {afterLabel}
          </div>
          <div ref={afterRef} />
        </div>
      )}
    </div>
  );
}
