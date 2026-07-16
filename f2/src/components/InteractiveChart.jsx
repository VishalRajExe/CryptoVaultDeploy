import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const TIME_RANGES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

const CHART_TYPES = [
  { key: 'candlestick', label: 'Candle' },
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
];

/**
 * Full-featured interactive chart using TradingView's lightweight-charts.
 * Supports candlestick, area, and line types with time range controls and fullscreen.
 */
export default function InteractiveChart(props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync scrollbar hiding when fullscreen modal is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <>
      {/* Standard Inline Chart */}
      <InteractiveChartInner
        {...props}
        isFullscreen={false}
        onFullscreenToggle={() => setIsFullscreen(true)}
      />

      {/* Fullscreen Chart Portal */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#0b0b0c] p-6 flex flex-col justify-between text-ink">
          <InteractiveChartInner
            {...props}
            height={window.innerHeight - 150}
            isFullscreen={true}
            onFullscreenToggle={() => setIsFullscreen(false)}
          />
        </div>,
        document.body
      )}
    </>
  );
}

function InteractiveChartInner({
  data = [],
  height = 340,
  onRangeChange,
  defaultType = 'area',
  selectedRange = 7,
  loading = false,
  className = '',
  hideTimeRanges = false,
  timeVisible = false,
  isFullscreen = false,
  onFullscreenToggle,
  disableSimulation = false
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [chartType, setChartType] = useState(defaultType);
  const [crosshairData, setCrosshairData] = useState(null);

  const createChartInstance = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#707a8a',
        fontFamily: '"IBM Plex Sans", sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.015)' },
        horzLines: { color: 'rgba(255,255,255,0.015)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(252,213,53,0.25)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#1e2329',
        },
        horzLine: {
          color: 'rgba(252,213,53,0.25)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#1e2329',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        timeVisible: timeVisible || selectedRange <= 1,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Add series based on chart type
    let series;
    if (chartType === 'candlestick') {
      series = chart.addCandlestickSeries({
        upColor: '#02C076',
        downColor: '#E84158',
        borderUpColor: '#02C076',
        borderDownColor: '#E84158',
        wickUpColor: 'rgba(2,192,118,0.6)',
        wickDownColor: 'rgba(232,65,88,0.6)',
      });
    } else if (chartType === 'area') {
      // Fix for addAreaSeries not being a function in some versions
      if (chart && typeof chart.addAreaSeries === 'function') {
        series = chart.addAreaSeries({
          lineColor: '#FCD535',
          topColor: 'rgba(252,213,53,0.18)',
          bottomColor: 'rgba(252,213,53,0.0)',
          lineWidth: 2,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#FCD535',
          crosshairMarkerBackgroundColor: '#0b0e11',
        });
      } else {
        // Fallback to line series if addAreaSeries is not available
        series = chart.addLineSeries({
          color: '#FCD535',
          lineWidth: 2,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#FCD535',
          crosshairMarkerBackgroundColor: '#0b0e11',
        });
      }
    } else {
      series = chart.addLineSeries({
        color: '#FCD535',
        lineWidth: 2,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#FCD535',
        crosshairMarkerBackgroundColor: '#0b0e11',
      });
    }

    seriesRef.current = series;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) {
        setCrosshairData(null);
        return;
      }
      const d = param.seriesData.get(series);
      if (d) {
        setCrosshairData({
          time: param.time,
          value: d.close ?? d.value ?? 0,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        });
      }
    });

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartType, height, selectedRange, timeVisible]);

  // Create chart
  useEffect(() => {
    const cleanup = createChartInstance();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [createChartInstance]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const formatted = data.map((d) => {
      if (chartType === 'candlestick') {
        return { time: d.time, open: d.open, high: d.high, low: d.low, close: d.close };
      }
      return { time: d.time, value: d.close ?? d.value ?? 0 };
    });

    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();

    if (disableSimulation) return;

    // Live simulation
    let lastPoint = { ...formatted[formatted.length - 1] };
    const volatility = 0.0015;
    let tickCount = 0;
    
    // Estimate candle spacing
    const timeSpacing = formatted.length > 1 
      ? formatted[formatted.length - 1].time - formatted[formatted.length - 2].time 
      : 3600;

    const interval = setInterval(() => {
      if (!seriesRef.current) return;
      tickCount++;

      const val = lastPoint.close ?? lastPoint.value;
      const newClose = val * (1 + (Math.random() - 0.5) * volatility);

      if (tickCount % 4 === 0) {
        // Form a new candle every 4 ticks
        lastPoint = {
          time: lastPoint.time + timeSpacing,
          open: lastPoint.close ?? val,
          high: Math.max(lastPoint.close ?? val, newClose),
          low: Math.min(lastPoint.close ?? val, newClose),
          close: newClose,
          value: newClose
        };
      } else {
        // Wiggle the current candle
        if (chartType === 'candlestick') {
          lastPoint = {
            ...lastPoint,
            close: newClose,
            high: Math.max(lastPoint.high, newClose),
            low: Math.min(lastPoint.low, newClose),
          };
        } else {
          lastPoint = {
            ...lastPoint,
            value: newClose,
            close: newClose
          };
        }
      }
      
      seriesRef.current.update(lastPoint);
    }, 1000);

    return () => clearInterval(interval);
  }, [data, chartType, disableSimulation]);

  const formatPrice = (v) => {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: v < 1 ? 6 : 2 }).format(v);
  };

  return (
    <div className={isFullscreen 
      ? "w-full h-full flex flex-col justify-between bg-[#0b0e11]"
      : `rounded-lg bg-surface-card border border-outline-variant overflow-hidden ${className}`
    }>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          {/* Chart type toggle */}
          <div className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low p-0.5">
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setChartType(t.key)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-button font-bold transition-all ${
                  chartType === t.key
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-muted-strong hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Crosshair info */}
          {crosshairData && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              {crosshairData.open != null && (
                <>
                  <span className="text-muted-strong">O <span className="text-on-surface font-semibold">{formatPrice(crosshairData.open)}</span></span>
                  <span className="text-muted-strong">H <span className="text-on-surface font-semibold">{formatPrice(crosshairData.high)}</span></span>
                  <span className="text-muted-strong">L <span className="text-on-surface font-semibold">{formatPrice(crosshairData.low)}</span></span>
                  <span className="text-muted-strong">C <span className="text-on-surface font-semibold">{formatPrice(crosshairData.close)}</span></span>
                </>
              )}
              {crosshairData.open == null && (
                <span className="text-primary-container font-bold">{formatPrice(crosshairData.value)}</span>
              )}
            </div>
          )}
        </div>

        {/* Time range + Fullscreen toggle */}
        <div className="flex items-center gap-2">
          {!hideTimeRanges && (
            <div className="flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low p-0.5">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => onRangeChange?.(r.days)}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-button font-bold transition-all ${
                    selectedRange === r.days
                      ? 'bg-surface-elevated text-on-surface'
                      : 'text-muted-strong hover:text-on-surface'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onFullscreenToggle}
            className="p-1.5 rounded-md border border-outline-variant bg-surface-container-low text-muted-strong hover:text-on-surface transition-colors flex items-center justify-center"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className={isFullscreen ? "flex-1 relative w-full flex items-center justify-center mt-4" : "relative"}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-primary-container/20 border-t-primary-container rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ height }} />
      </div>
    </div>
  );
}