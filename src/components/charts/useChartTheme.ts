import { useEffect, useState, useCallback } from 'react';
import type { IChartApi } from 'lightweight-charts';

interface ThemeColors {
  background: string;
  textColor: string;
  gridColor: string;
  borderColor: string;
}

const LIGHT: ThemeColors = {
  background: '#ffffff',
  textColor: '#374151',
  gridColor: '#e5e7eb',
  borderColor: '#d1d5db',
};

const DARK: ThemeColors = {
  background: '#1a1a2e',
  textColor: '#d1d5db',
  gridColor: '#2d2d44',
  borderColor: '#2d2d44',
};

export function getThemeColors(): ThemeColors {
  if (typeof document === 'undefined') return LIGHT;
  const isDark = document.documentElement.dataset.theme === 'dark' ||
    document.documentElement.classList.contains('dark');
  return isDark ? DARK : LIGHT;
}

export function getChartOptions(colors: ThemeColors) {
  return {
    layout: {
      background: { color: colors.background },
      textColor: colors.textColor,
    },
    grid: {
      vertLines: { color: colors.gridColor },
      horzLines: { color: colors.gridColor },
    },
    rightPriceScale: { borderColor: colors.borderColor },
    timeScale: { borderColor: colors.borderColor },
  };
}

export function useResponsiveHeight(propHeight: number): number {
  const [height, setHeight] = useState(propHeight);

  useEffect(() => {
    const compute = () =>
      window.innerWidth < 768
        ? Math.min(propHeight, Math.round(window.innerWidth * 0.75))
        : propHeight;

    setHeight(compute());

    const onResize = () => setHeight(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [propHeight]);

  return height;
}

export function useChartTheme(chartRef: React.RefObject<IChartApi | null>) {
  const applyTheme = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(getChartOptions(getThemeColors()));
  }, [chartRef]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === 'data-theme' ||
          mutation.attributeName === 'class'
        ) {
          applyTheme();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => observer.disconnect();
  }, [applyTheme]);
}
