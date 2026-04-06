import { useState, useMemo, useCallback, useRef } from 'react'
import { FullscreenOutlined } from '@ant-design/icons'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { SANS_FONT } from '@/styles/tokens'

interface PriceHistoryPoint {
  timestamp?: string
  recordedAt?: string
  price: number | { amount: number; currency: string; symbol?: string }
  type?: string
  bidId?: string
  bidderDisplayName?: string
}

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryPoint[]
  currency?: string
  mode?: 'inline' | 'expanded'
  enableZoom?: boolean
  onExpand?: () => void
}

// Layout constants per mode
const INLINE_WIDTH = 720
const INLINE_HEIGHT = 220
const EXPANDED_WIDTH = 900
const EXPANDED_HEIGHT = 440

const INLINE_PADDING = { top: 20, right: 20, bottom: 40, left: 72 }
const EXPANDED_PADDING = { top: 28, right: 28, bottom: 52, left: 80 }

// Y-axis domain padding (percentage)
const Y_PAD_TOP = 0.10  // 10% headroom above max
const Y_PAD_BOTTOM = 0.05 // 5% below min
const MIN_Y_RANGE = 10000 // minimum range to prevent flat line

function normalizeData(priceHistory: PriceHistoryPoint[]) {
  const normalized = priceHistory
    .map((p) => ({
      price: typeof p.price === 'object' && p.price !== null ? p.price.amount : (p.price as number),
      timestamp: p.recordedAt ?? p.timestamp ?? '',
      type: p.type,
      bidId: p.bidId,
      bidderDisplayName: p.bidderDisplayName,
    }))
    .filter((p) => p.timestamp)
    .filter((p) => !p.type || !['repriced_after_cancellation', 'reset_to_starting_price'].includes(p.type))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  let maxPrice = 0
  return normalized.filter((p) => {
    if (p.price >= maxPrice) {
      maxPrice = p.price
      return true
    }
    return false
  })
}

function computeYDomain(prices: number[]): { yMin: number; yMax: number } {
  const rawMin = Math.min(...prices)
  const rawMax = Math.max(...prices)
  const rawRange = rawMax - rawMin || MIN_Y_RANGE

  const yMin = Math.max(0, rawMin - rawRange * Y_PAD_BOTTOM)
  const yMax = rawMax + rawRange * Y_PAD_TOP
  return { yMin, yMax: Math.max(yMax, yMin + MIN_Y_RANGE) }
}

function downsampleLabels(count: number, maxLabels: number): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i)
  const step = (count - 1) / (maxLabels - 1)
  const indices: number[] = []
  for (let i = 0; i < maxLabels; i++) {
    indices.push(Math.round(i * step))
  }
  return indices
}

export function PriceHistoryChart({
  priceHistory,
  currency = 'VND',
  mode = 'inline',
  enableZoom = false,
  onExpand,
}: PriceHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [viewRange, setViewRange] = useState<{ start: number; end: number } | null>(null)
  const dragRef = useRef<{ startX: number; startRange: { start: number; end: number } } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const isExpanded = mode === 'expanded'
  const W = isExpanded ? EXPANDED_WIDTH : INLINE_WIDTH
  const H = isExpanded ? EXPANDED_HEIGHT : INLINE_HEIGHT
  const PAD = isExpanded ? EXPANDED_PADDING : INLINE_PADDING
  const maxXLabels = isExpanded ? 8 : 5
  const maxYTicks = isExpanded ? 6 : 5

  const sorted = useMemo(() => normalizeData(priceHistory), [priceHistory])

  // Apply viewport range (zoom)
  const viewData = useMemo(() => {
    if (!viewRange || !enableZoom) return sorted
    return sorted.slice(viewRange.start, viewRange.end + 1)
  }, [sorted, viewRange, enableZoom])

  const { points, xLabels, yLabels } = useMemo(() => {
    if (viewData.length === 0) return { points: [], xLabels: [], yLabels: [] }

    const prices = viewData.map((p) => p.price)
    const { yMin, yMax } = computeYDomain(prices)
    const yRange = yMax - yMin

    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    const pts = viewData.map((p, i) => ({
      x: PAD.left + (viewData.length === 1 ? plotW / 2 : (i / (viewData.length - 1)) * plotW),
      y: PAD.top + plotH - ((p.price - yMin) / yRange) * plotH,
      data: p,
    }))

    // Y-axis labels
    const yLbls = Array.from({ length: maxYTicks }, (_, i) => {
      const val = yMin + (yRange * i) / (maxYTicks - 1)
      const y = PAD.top + plotH - ((val - yMin) / yRange) * plotH
      return { y, label: formatCurrency(Math.round(val), currency) }
    })

    // X-axis labels (downsampled)
    const indices = downsampleLabels(viewData.length, maxXLabels)
    const xLbls = indices
      .filter((idx) => idx < pts.length)
      .map((idx) => ({
        x: pts[idx].x,
        label: formatDateTime(viewData[idx].timestamp),
      }))

    return { points: pts, xLabels: xLbls, yLabels: yLbls }
  }, [viewData, currency, W, H, PAD, maxXLabels, maxYTicks])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!enableZoom || sorted.length < 4) return
    const current = viewRange ?? { start: 0, end: sorted.length - 1 }
    const range = current.end - current.start
    const shrink = Math.max(2, Math.floor(range * 0.25))
    setViewRange({
      start: Math.min(current.start + shrink, current.end - 2),
      end: Math.max(current.end - shrink, current.start + 2),
    })
  }, [enableZoom, sorted.length, viewRange])

  const handleZoomOut = useCallback(() => {
    if (!enableZoom) return
    if (!viewRange) return
    const range = viewRange.end - viewRange.start
    const expand = Math.max(2, Math.floor(range * 0.35))
    setViewRange({
      start: Math.max(0, viewRange.start - expand),
      end: Math.min(sorted.length - 1, viewRange.end + expand),
    })
  }, [enableZoom, sorted.length, viewRange])

  const handleReset = useCallback(() => setViewRange(null), [])

  // Pan via drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableZoom || !viewRange) return
    dragRef.current = { startX: e.clientX, startRange: { ...viewRange } }
  }, [enableZoom, viewRange])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || !svgRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const svgRect = svgRef.current.getBoundingClientRect()
    const plotW = W - PAD.left - PAD.right
    const pxPerPoint = svgRect.width * (plotW / W) / (dragRef.current.startRange.end - dragRef.current.startRange.start)
    const shift = Math.round(-dx / pxPerPoint)
    let newStart = dragRef.current.startRange.start + shift
    let newEnd = dragRef.current.startRange.end + shift
    if (newStart < 0) { newEnd -= newStart; newStart = 0 }
    if (newEnd >= sorted.length) { newStart -= (newEnd - sorted.length + 1); newEnd = sorted.length - 1 }
    newStart = Math.max(0, newStart)
    setViewRange({ start: newStart, end: newEnd })
  }, [sorted.length, W, PAD])

  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])

  if (priceHistory.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed gi\u00e1
      </div>
    )
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const plotBottom = H - PAD.bottom

  const areaPath = points.length > 1
    ? `M ${points[0].x},${plotBottom} ${points.map((p) => `L ${p.x},${p.y}`).join(' ')} L ${points[points.length - 1].x},${plotBottom} Z`
    : ''

  // Smart tooltip positioning
  const tooltipStyle = (idx: number): React.CSSProperties => {
    const p = points[idx]
    const leftPct = (p.x / W) * 100
    const topPct = (p.y / H) * 100
    const flipLeft = leftPct > 75
    const flipDown = topPct < 20

    return {
      position: 'absolute',
      left: `${leftPct}%`,
      top: `${topPct}%`,
      transform: `translate(${flipLeft ? '-95%' : '-5%'}, ${flipDown ? '20%' : '-120%'})`,
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      padding: '8px 12px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 10,
    }
  }

  return (
    <div style={{ position: 'relative', maxWidth: W }}>
      {/* Expand button (inline mode only) */}
      {mode === 'inline' && onExpand && (
        <button
          type="button"
          onClick={onExpand}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 5,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <FullscreenOutlined style={{ fontSize: 11 }} />
        </button>
      )}

      {/* Zoom controls (expanded mode) */}
      {isExpanded && enableZoom && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginBottom: 8 }}>
          <button type="button" onClick={handleZoomIn} style={zoomBtnStyle}>+</button>
          <button type="button" onClick={handleZoomOut} style={zoomBtnStyle} disabled={!viewRange}>−</button>
          <button type="button" onClick={handleReset} style={zoomBtnStyle} disabled={!viewRange}>Reset</button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', cursor: enableZoom && viewRange ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Horizontal grid */}
        {yLabels.map((tick, i) => (
          <line key={`h-${i}`} x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y}
            stroke="var(--color-border)" strokeWidth={0.5} opacity={0.5} />
        ))}

        {/* Vertical grid */}
        {xLabels.map((tick, i) => (
          <line key={`v-${i}`} x1={tick.x} y1={PAD.top} x2={tick.x} y2={H - PAD.bottom}
            stroke="var(--color-border)" strokeWidth={0.5} opacity={0.3} />
        ))}

        {/* Plot border */}
        <rect x={PAD.left} y={PAD.top}
          width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom}
          fill="none" stroke="var(--color-border)" strokeWidth={0.5} opacity={0.4} />

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#priceGradient)" />}

        {/* Line */}
        <polyline points={polylinePoints} fill="none" stroke="var(--color-accent)"
          strokeWidth={isExpanded ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hoveredIndex === i ? (isExpanded ? 6 : 5) : (isExpanded ? 4 : 3)}
            fill={hoveredIndex === i ? 'var(--color-accent)' : 'var(--color-bg-card)'}
            stroke="var(--color-accent)" strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)} />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((tick, i) => (
          <text key={i} x={PAD.left - 8} y={tick.y + 4} textAnchor="end"
            style={{ fontFamily: SANS_FONT, fontSize: isExpanded ? 11 : 10, fill: 'var(--color-text-secondary)' }}>
            {tick.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((tick, i) => (
          <text key={i} x={tick.x} y={H - (isExpanded ? 10 : 8)} textAnchor="middle"
            style={{ fontFamily: SANS_FONT, fontSize: isExpanded ? 11 : 10, fill: 'var(--color-text-secondary)' }}>
            {tick.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div style={tooltipStyle(hoveredIndex)}>
          <div style={{ fontFamily: SANS_FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
            {formatCurrency(points[hoveredIndex].data.price, currency)}
          </div>
          {points[hoveredIndex].data.bidderDisplayName && (
            <div style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-primary)', marginTop: 2, fontWeight: 500 }}>
              {points[hoveredIndex].data.bidderDisplayName}
            </div>
          )}
          <div style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {formatDateTime(points[hoveredIndex].data.timestamp)}
          </div>
        </div>
      )}
    </div>
  )
}

const zoomBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 4,
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-surface)',
  color: 'var(--color-text-primary)',
  fontFamily: SANS_FONT,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
