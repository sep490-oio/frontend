import { useState, useMemo } from 'react'
import { formatCurrency, formatDateTime } from '@/utils/format'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

interface PriceHistoryPoint {
  timestamp?: string
  recordedAt?: string
  price: number | { amount: number; currency: string; symbol?: string }
  type?: string
}

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryPoint[]
  currency?: string
}

const CHART_WIDTH = 720
const CHART_HEIGHT = 300
const PADDING = { top: 24, right: 24, bottom: 48, left: 80 }

export function PriceHistoryChart({ priceHistory, currency = 'VND' }: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Normalize: extract numeric price and timestamp from various formats
  const sorted = useMemo(() => {
    return priceHistory
      .map((p) => ({
        price: typeof p.price === 'object' && p.price !== null ? p.price.amount : (p.price as number),
        timestamp: p.recordedAt ?? p.timestamp ?? '',
        type: p.type,
      }))
      .filter((p) => p.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [priceHistory])

  const { points, xLabels, yLabels } = useMemo(() => {
    if (sorted.length === 0) {
      return { points: [], xLabels: [], yLabels: [] }
    }

    const prices = sorted.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const plotW = CHART_WIDTH - PADDING.left - PADDING.right
    const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom

    const pts = sorted.map((p, i) => ({
      x: PADDING.left + (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW),
      y: PADDING.top + plotH - ((p.price - min) / range) * plotH,
      data: p,
    }))

    // Y-axis labels (5 ticks)
    const yTicks = 5
    const yLbls = Array.from({ length: yTicks }, (_, i) => {
      const val = min + (range * i) / (yTicks - 1)
      const y = PADDING.top + plotH - ((val - min) / range) * plotH
      return { y, label: formatCurrency(Math.round(val), currency) }
    })

    // X-axis labels (up to 5)
    const step = Math.max(1, Math.floor(sorted.length / 4))
    const xLbls: { x: number; label: string }[] = []
    for (let i = 0; i < sorted.length; i += step) {
      xLbls.push({ x: pts[i].x, label: formatDateTime(sorted[i].timestamp) })
    }
    // Always include last
    if (sorted.length > 1 && xLbls[xLbls.length - 1]?.x !== pts[pts.length - 1].x) {
      xLbls.push({ x: pts[pts.length - 1].x, label: formatDateTime(sorted[sorted.length - 1].timestamp) })
    }

    return { points: pts, xLabels: xLbls, yLabels: yLbls }
  }, [sorted, currency])

  if (priceHistory.length === 0) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          fontFamily: SANS_FONT,
          fontSize: 14,
          color: 'var(--color-text-secondary)',
        }}
      >
        Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed gi\u00e1
      </div>
    )
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const plotBottom = CHART_HEIGHT - PADDING.bottom

  // Area fill path
  const areaPath =
    points.length > 1
      ? `M ${points[0].x},${plotBottom} ${points.map((p) => `L ${p.x},${p.y}`).join(' ')} L ${points[points.length - 1].x},${plotBottom} Z`
      : ''

  return (
    <div style={{ position: 'relative', maxWidth: CHART_WIDTH }}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Background grid — horizontal lines */}
        {yLabels.map((tick, i) => (
          <line
            key={`h-${i}`}
            x1={PADDING.left}
            y1={tick.y}
            x2={CHART_WIDTH - PADDING.right}
            y2={tick.y}
            stroke="var(--color-border)"
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {/* Background grid — vertical lines */}
        {xLabels.map((tick, i) => (
          <line
            key={`v-${i}`}
            x1={tick.x}
            y1={PADDING.top}
            x2={tick.x}
            y2={CHART_HEIGHT - PADDING.bottom}
            stroke="var(--color-border)"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Plot border */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={CHART_WIDTH - PADDING.left - PADDING.right}
          height={CHART_HEIGHT - PADDING.top - PADDING.bottom}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={0.5}
          opacity={0.4}
        />

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#priceGradient)" />}

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3}
            fill={hoveredIndex === i ? 'var(--color-accent)' : 'var(--color-bg-card)'}
            stroke="var(--color-accent)"
            strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((tick, i) => (
          <text
            key={i}
            x={PADDING.left - 8}
            y={tick.y + 4}
            textAnchor="end"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 10,
              fill: 'var(--color-text-secondary)',
            }}
          >
            {tick.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={CHART_HEIGHT - 8}
            textAnchor="middle"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 10,
              fill: 'var(--color-text-secondary)',
            }}
          >
            {tick.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].x / CHART_WIDTH) * 100}%`,
            top: `${(points[hoveredIndex].y / CHART_HEIGHT) * 100}%`,
            transform: 'translate(-50%, -140%)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '8px 12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-accent)',
            }}
          >
            {formatCurrency(points[hoveredIndex].data.price, currency)}
          </div>
          <div
            style={{
              fontFamily: SANS_FONT,
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              marginTop: 2,
            }}
          >
            {formatDateTime(points[hoveredIndex].data.timestamp)}
          </div>
        </div>
      )}
    </div>
  )
}
