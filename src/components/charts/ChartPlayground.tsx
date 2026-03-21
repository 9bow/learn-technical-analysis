import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useChartTheme, useResponsiveHeight, getChartOptions, getThemeColors } from './useChartTheme';

const DATASETS = [
  { value: 'uptrend-stock', label: '상승 추세 (주식)' },
  { value: 'downtrend-stock', label: '하락 추세 (주식)' },
  { value: 'sideways-stock', label: '횡보 (주식)' },
  { value: 'volatile-crypto', label: '고변동성 (가상자산)' },
  { value: 'breakout-example', label: '돌파 패턴' },
  { value: 'head-shoulders', label: '헤드앤숄더' },
  { value: 'double-bottom', label: '이중 바닥' },
  { value: 'high-volume-event', label: '거래량 급증' },
];

interface ChartPlaygroundProps {
  height?: number;
}

export default function ChartPlayground({ height = 500 }: ChartPlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [selectedDataset, setSelectedDataset] = useState('uptrend-stock');
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const [showVolume, setShowVolume] = useState(true);
  const responsiveHeight = useResponsiveHeight(height);

  useChartTheme(chartRef);

  useEffect(() => {
    const raw = import.meta.env.BASE_URL || '/';
    const basePath = raw.endsWith('/') ? raw : raw + '/';
    fetch(`${basePath}data/ohlcv/${selectedDataset}.json`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [selectedDataset]);

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

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.map((d) => ({
          time: d.time,
          value: (d as CandlestickData<Time> & { volume?: number }).volume || 0,
          color:
            (d.close as number) >= (d.open as number)
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)',
        })),
      );
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
  }, [data, showVolume, responsiveHeight]);

  return (
    <div className="chart-playground-wrapper">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #6b7280',
              background: 'transparent',
              color: 'inherit',
              fontSize: '0.9rem',
            }}
          >
            {DATASETS.map((ds) => (
              <option key={ds.value} value={ds.value}>
                {ds.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowVolume(!showVolume)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #6b7280',
              background: showVolume ? '#6b7280' : 'transparent',
              color: showVolume ? '#fff' : 'inherit',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            거래량 {showVolume ? 'ON' : 'OFF'}
          </button>
        </div>
        <div ref={containerRef} />
      </div>
    </div>
  );
}
