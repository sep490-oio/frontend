import { useState, useMemo } from 'react'
import { Segmented, Statistic, Spin, Empty, DatePicker, Space, Typography } from 'antd'
import {
  RiseOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/format'
import { usePlatformRevenueHistory, type PlatformRevenueParams } from '@/features/admin/api'
import { SANS_FONT } from '@/styles/tokens'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// ── Chart constants ─────────────────────────────────────────────────

const W = 900
const H = 340
const PAD = { top: 28, right: 24, bottom: 52, left: 80 }
const MAX_Y_TICKS = 6

const COLORS = {
  commission: '#52c41a',
  inspectionFees: '#1677ff',
  forfeitIncome: '#fa8c16',
  refunds: '#ff4d4f',
  netRevenue: '#722ed1',
}

// ── Component ───────────────────────────────────────────────────────

export function PlatformRevenueChart() {
  const { t } = useTranslation('admin')

  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const params = useMemo<PlatformRevenueParams>(() => {
    const from = dateRange?.[0]?.format('YYYY-MM-DD') ?? dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const to = dateRange?.[1]?.format('YYYY-MM-DD') ?? dayjs().format('YYYY-MM-DD')
    return { from, to, granularity }
  }, [dateRange, granularity])

  const { data, isLoading } = usePlatformRevenueHistory(params)

  const chartData = useMemo(() => {
    if (!data?.dataPoints?.length) return null

    const points = data.dataPoints
    const maxNet = Math.max(...points.map(p => p.netRevenue), 0)
    const minNet = Math.min(...points.map(p => p.netRevenue), 0)
    const range = (maxNet - minNet) || 1
    const yPad = range * 0.15
    const yMin = minNet - yPad
    const yMax = maxNet + yPad

    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    const mapped = points.map((p, i) => ({
      x: PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW),
      y: PAD.top + plotH - ((p.netRevenue - yMin) / (yMax - yMin)) * plotH,
      data: p,
    }))

    // Y-axis labels
    const yLabels = Array.from({ length: MAX_Y_TICKS }, (_, i) => {
      const val = yMin + ((yMax - yMin) * i) / (MAX_Y_TICKS - 1)
      const y = PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH
      return { y, label: formatShortCurrency(Math.round(val)) }
    })

    // X-axis labels (downsampled)
    const maxLabels = 8
    const step = Math.max(1, Math.floor(points.length / maxLabels))
    const xLabels = points
      .map((p, i) => ({ x: mapped[i].x, label: formatDateLabel(p.date, granularity), i }))
      .filter((_, i) => i % step === 0 || i === points.length - 1)

    return { mapped, yLabels, xLabels, yMin, yMax }
  }, [data, granularity])

  // Bar chart data for stacked bars
  const barData = useMemo(() => {
    if (!data?.dataPoints?.length) return null

    const points = data.dataPoints
    const maxTotal = Math.max(...points.map(p => p.commission + p.inspectionFees + p.forfeitIncome), 1)
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom
    const barW = Math.max(4, Math.min(40, plotW / points.length - 2))

    return points.map((p, i) => {
      const x = PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)
      const total = p.commission + p.inspectionFees + p.forfeitIncome
      const h = (total / maxTotal) * plotH

      const commH = (p.commission / maxTotal) * plotH
      const inspH = (p.inspectionFees / maxTotal) * plotH
      const forfH = (p.forfeitIncome / maxTotal) * plotH

      const baseY = PAD.top + plotH

      return { x, barW, baseY, commH, inspH, forfH, h, data: p }
    })
  }, [data])

  const presets = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ]

  return (
    <>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Text strong><RiseOutlined /> {t('revenue.chartTitle', 'Revenue Over Time')}</Typography.Text>
        <Space wrap>
          {presets.map(p => (
            <Typography.Link
              key={p.value}
              onClick={() => setDateRange([dayjs().subtract(p.value, 'day'), dayjs()])}
              style={{ fontSize: 12 }}
            >
              {p.label}
            </Typography.Link>
          ))}
          <RangePicker
            size="small"
            value={dateRange}
            onChange={val => setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: 220 }}
          />
          <Segmented
            size="small"
            value={granularity}
            onChange={v => setGranularity(v as 'day' | 'week' | 'month')}
            options={[
              { label: t('revenue.day', 'Day'), value: 'day' },
              { label: t('revenue.week', 'Week'), value: 'week' },
              { label: t('revenue.month', 'Month'), value: 'month' },
            ]}
          />
        </Space>
      </div>
      
      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
          <Statistic
            title={<span style={{ fontSize: 12 }}><DollarOutlined /> {t('revenue.totalRevenue', 'Net Revenue')}</span>}
            value={data?.totalRevenue ?? 0}
            formatter={v => formatCurrency(v as number, data?.currency)}
            valueStyle={{ color: COLORS.netRevenue, fontSize: 24, fontWeight: 700 }}
            loading={isLoading}
          />
          <Statistic
            title={<span style={{ fontSize: 12 }}><RiseOutlined /> {t('revenue.commission', 'Commission')}</span>}
            value={data?.totalCommission ?? 0}
            formatter={v => formatCurrency(v as number, data?.currency)}
            valueStyle={{ color: COLORS.commission, fontSize: 18, fontWeight: 600 }}
            loading={isLoading}
          />
          <Statistic
            title={<span style={{ fontSize: 12 }}><SafetyCertificateOutlined /> {t('revenue.inspectionFees', 'Inspection')}</span>}
            value={data?.totalInspectionFees ?? 0}
            formatter={v => formatCurrency(v as number, data?.currency)}
            valueStyle={{ color: COLORS.inspectionFees, fontSize: 18, fontWeight: 600 }}
            loading={isLoading}
          />
          <Statistic
            title={<span style={{ fontSize: 12 }}><WarningOutlined /> {t('revenue.forfeitIncome', 'Forfeit')}</span>}
            value={data?.totalForfeitIncome ?? 0}
            formatter={v => formatCurrency(v as number, data?.currency)}
            valueStyle={{ color: COLORS.forfeitIncome, fontSize: 18, fontWeight: 600 }}
            loading={isLoading}
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : !chartData || !barData ? (
          <Empty description={t('revenue.noData', 'No revenue data for this period')} />
        ) : (
          <div style={{ position: 'relative', maxWidth: W }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.netRevenue} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.netRevenue} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              {/* Horizontal grid */}
              {chartData.yLabels.map((tick, i) => (
                <line key={`h-${i}`} x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y}
                  stroke="var(--color-border)" strokeWidth={0.5} opacity={0.5} />
              ))}

              {/* Stacked bars */}
              {barData.map((bar, i) => (
                <g key={`bar-${i}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Commission */}
                  <rect
                    x={bar.x - bar.barW / 2}
                    y={bar.baseY - bar.commH - bar.inspH - bar.forfH}
                    width={bar.barW}
                    height={Math.max(0, bar.commH)}
                    fill={COLORS.commission}
                    opacity={hoveredIndex === i ? 1 : 0.75}
                    rx={1}
                  />
                  {/* Inspection Fees */}
                  <rect
                    x={bar.x - bar.barW / 2}
                    y={bar.baseY - bar.inspH - bar.forfH}
                    width={bar.barW}
                    height={Math.max(0, bar.inspH)}
                    fill={COLORS.inspectionFees}
                    opacity={hoveredIndex === i ? 1 : 0.75}
                    rx={1}
                  />
                  {/* Forfeit */}
                  <rect
                    x={bar.x - bar.barW / 2}
                    y={bar.baseY - bar.forfH}
                    width={bar.barW}
                    height={Math.max(0, bar.forfH)}
                    fill={COLORS.forfeitIncome}
                    opacity={hoveredIndex === i ? 1 : 0.75}
                    rx={1}
                  />
                </g>
              ))}

              {/* Net revenue line */}
              {chartData.mapped.length > 1 && (
                <>
                  <path
                    d={`M ${chartData.mapped[0].x},${PAD.top + (H - PAD.top - PAD.bottom)} ${chartData.mapped.map(p => `L ${p.x},${p.y}`).join(' ')} L ${chartData.mapped[chartData.mapped.length - 1].x},${PAD.top + (H - PAD.top - PAD.bottom)} Z`}
                    fill="url(#revenueGradient)"
                  />
                  <polyline
                    points={chartData.mapped.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={COLORS.netRevenue}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Data points on line */}
              {chartData.mapped.map((p, i) => (
                <circle key={`dot-${i}`} cx={p.x} cy={p.y}
                  r={hoveredIndex === i ? 6 : 3.5}
                  fill={hoveredIndex === i ? COLORS.netRevenue : 'var(--color-bg-card)'}
                  stroke={COLORS.netRevenue}
                  strokeWidth={2}
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}

              {/* Y-axis labels */}
              {chartData.yLabels.map((tick, i) => (
                <text key={`yl-${i}`} x={PAD.left - 8} y={tick.y + 4} textAnchor="end"
                  style={{ fontFamily: SANS_FONT, fontSize: 10, fill: 'var(--color-text-secondary)' }}>
                  {tick.label}
                </text>
              ))}

              {/* X-axis labels */}
              {chartData.xLabels.map((tick, i) => (
                <text key={`xl-${i}`} x={tick.x} y={H - 8} textAnchor="middle"
                  style={{ fontFamily: SANS_FONT, fontSize: 10, fill: 'var(--color-text-secondary)' }}>
                  {tick.label}
                </text>
              ))}

              {/* Plot border */}
              <rect x={PAD.left} y={PAD.top}
                width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom}
                fill="none" stroke="var(--color-border)" strokeWidth={0.5} opacity={0.3} />
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && chartData.mapped[hoveredIndex] && (
              <div style={{
                position: 'absolute',
                left: `${(chartData.mapped[hoveredIndex].x / W) * 100}%`,
                top: `${(chartData.mapped[hoveredIndex].y / H) * 100}%`,
                transform: `translate(${(chartData.mapped[hoveredIndex].x / W) > 0.7 ? '-100%' : '0'}, -120%)`,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '10px 14px',
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                zIndex: 10,
                minWidth: 180,
              }}>
                <div style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  {chartData.mapped[hoveredIndex].data.date}
                </div>
                <TooltipRow color={COLORS.commission} label={t('payments.revenueChart.label.commission', 'Commission')} value={chartData.mapped[hoveredIndex].data.commission} currency={data?.currency} />
                <TooltipRow color={COLORS.inspectionFees} label={t('payments.revenueChart.label.inspection', 'Inspection')} value={chartData.mapped[hoveredIndex].data.inspectionFees} currency={data?.currency} />
                <TooltipRow color={COLORS.forfeitIncome} label={t('payments.revenueChart.label.forfeit', 'Forfeit')} value={chartData.mapped[hoveredIndex].data.forfeitIncome} currency={data?.currency} />
                <TooltipRow color={COLORS.refunds} label={t('payments.revenueChart.label.refunds', 'Refunds')} value={-chartData.mapped[hoveredIndex].data.refunds} currency={data?.currency} />
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 6, paddingTop: 6 }}>
                  <TooltipRow color={COLORS.netRevenue} label={t('payments.revenueChart.label.net', 'Net')} value={chartData.mapped[hoveredIndex].data.netRevenue} currency={data?.currency} bold />
                </div>
              </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <LegendItem color={COLORS.commission} label={t('payments.revenueChart.legend.commission', 'Commission 10%')} />
              <LegendItem color={COLORS.inspectionFees} label={t('payments.revenueChart.legend.inspection', 'Inspection 3%')} />
              <LegendItem color={COLORS.forfeitIncome} label={t('payments.revenueChart.legend.forfeit', 'Forfeit')} />
              <LegendItem color={COLORS.refunds} label={t('payments.revenueChart.legend.refunds', 'Refunds')} />
              <LegendItem color={COLORS.netRevenue} label={t('payments.revenueChart.legend.netRevenue', 'Net Revenue')} line />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

function TooltipRow({ color, label, value, currency, bold }: {
  color: string; label: string; value: number; currency?: string; bold?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontFamily: SANS_FONT, fontSize: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      </span>
      <span style={{ fontWeight: bold ? 700 : 500, color: value >= 0 ? color : COLORS.refunds }}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}

function LegendItem({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: SANS_FONT, fontSize: 11 }}>
      {line ? (
        <span style={{ width: 16, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
      ) : (
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', opacity: 0.8 }} />
      )}
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </span>
  )
}

function formatShortCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return val.toLocaleString()
}

function formatDateLabel(date: string, gran: string): string {
  const d = dayjs(date)
  if (gran === 'month') return d.format('MMM YY')
  if (gran === 'week') return d.format('DD/MM')
  return d.format('DD/MM')
}
