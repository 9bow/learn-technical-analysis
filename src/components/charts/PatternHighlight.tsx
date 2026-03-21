import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi, type CandlestickData, type Time } from 'lightweight-charts';
import { useChartTheme, useResponsiveHeight, getChartOptions, getThemeColors } from './useChartTheme';

interface Annotation {
  startIndex: number;
  endIndex: number;
  label: string;
  description: string;
  color?: string;
}

interface PatternHighlightProps {
  dataset?: string;
  height?: number;
  title?: string;
  annotations?: Annotation[];
}

export default function PatternHighlight({
  dataset = 'head-shoulders',
  height = 400,
  title,
  annotations = [],
}: PatternHighlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
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

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });
    series.setData(data);

    if (annotations.length > 0) {
      const markers = annotations.flatMap((ann) => {
        const startData = data[ann.startIndex];
        const endData = data[Math.min(ann.endIndex, data.length - 1)];
        if (!startData || !endData) return [];
        return [
          {
            time: startData.time,
            position: 'aboveBar' as const,
            color: ann.color || '#3b82f6',
            shape: 'arrowDown' as const,
            text: ann.label,
          },
        ];
      });
      series.setMarkers(markers);
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
  }, [data, annotations, responsiveHeight]);

  return (
    <div style={{ margin: '1rem 0' }}>
      {title && (
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {title}
        </div>
      )}
      <div ref={containerRef} />
      {annotations.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {annotations.map((ann, i) => (
            <button
              key={i}
              onClick={() => setSelectedAnnotation(selectedAnnotation === ann ? null : ann)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                border: `1px solid ${ann.color || '#3b82f6'}`,
                background: selectedAnnotation === ann ? (ann.color || '#3b82f6') : 'transparent',
                color: selectedAnnotation === ann ? '#fff' : 'inherit',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {ann.label}
            </button>
          ))}
        </div>
      )}
      {selectedAnnotation && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: `1px solid ${selectedAnnotation.color || '#3b82f6'}`,
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        >
          <strong>{selectedAnnotation.label}</strong>
          <p style={{ margin: '0.25rem 0 0' }}>{selectedAnnotation.description}</p>
        </div>
      )}
    </div>
  );
}
