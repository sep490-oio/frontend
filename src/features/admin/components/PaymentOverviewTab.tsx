import { useMemo } from 'react'
import { Card, Col, Progress, Row, Statistic, Tooltip, Typography } from 'antd'
import {
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/format'
import { PlatformRevenueChart } from './PlatformRevenueChart'
import type { PaymentSummaryDto, PlatformRevenueHistoryDto } from '@/types/payment'

// ── Types ────────────────────────────────────────────────────────────

interface PaymentOverviewTabProps {
  summary: PaymentSummaryDto | undefined
  summaryLoading: boolean
  wallet: { availableBalance: number; pendingBalance: number; totalBalance: number; currency?: string } | undefined
  walletLoading: boolean
  revenueData: PlatformRevenueHistoryDto | undefined
  isMobile: boolean
}

// ── Mock trend data ──────────────────────────────────────────────────

function useMockTrends() {
  return useMemo(() => ({
    netRevenue: { pct: 15.2, up: true },
    commission: { pct: 12.8, up: true },
    inspectionFees: { pct: -2.1, up: false },
    forfeitIncome: { pct: 8.5, up: true },
  }), [])
}

// ── Trend Indicator ──────────────────────────────────────────────────

function TrendIndicator({ pct, up }: { pct: number; up: boolean }) {
  const { t } = useTranslation('admin')
  const color = up ? '#52c41a' : '#ff4d4f'
  const icon = up ? <RiseOutlined /> : <FallOutlined />
  const absVal = Math.abs(pct).toFixed(1)
  return (
    <span style={{ fontSize: 11, color, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
      {icon} {up ? '+' : '-'}{absVal}% {t('payments.comparedToLastWeek', 'so với tuần trước')}
    </span>
  )
}

// ── CSS ──────────────────────────────────────────────────────────────

const hoverCSS = `
  .ov-hero:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
  .ov-sidebar-block:hover { background: var(--color-bg-elevated, #fafafa) !important; }
`

// ── Sidebar stat row ─────────────────────────────────────────────────

function SidebarStatRow({
  icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  suffix?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#595959' }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, color: color ?? '#262626', fontFamily: 'monospace' }}>
        {value}{suffix && <span style={{ fontWeight: 400, fontSize: 11, color: '#8c8c8c', marginLeft: 2 }}>{suffix}</span>}
      </span>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function PaymentOverviewTab({
  summary,
  summaryLoading,
  wallet,
  walletLoading,
  revenueData,
  isMobile,
}: PaymentOverviewTabProps) {
  const { t } = useTranslation('admin')
  const trends = useMockTrends()

  // Escrow breakdown for progress bar
  const released = summary?.releasedEscrowTotal ?? 0
  const refunded = summary?.refundedEscrowTotal ?? 0
  const escrowTotal = released + refunded
  const releasedPct = escrowTotal > 0 ? Math.round((released / escrowTotal) * 100) : 50

  return (
    <>
      <style>{hoverCSS}</style>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: TOP-LEVEL HERO METRICS (4 cards, 25% each)
          ═══════════════════════════════════════════════════════════════ */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {/* Net Revenue */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="ov-hero"
            loading={summaryLoading}
            styles={{ body: { padding: isMobile ? '14px 12px' : '20px 24px' } }}
            style={{
              borderRadius: 14,
              border: '1px solid #d3adf7',
              background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
              height: '100%',
              transition: 'all 0.2s',
            }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 12, color: '#531dab', fontWeight: 600 }}>
                  <RiseOutlined style={{ marginRight: 4 }} />
                  {t('payments.netRevenue', 'Doanh thu ròng')}
                </span>
              }
              value={revenueData?.totalRevenue ?? 0}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: '#722ed1', fontSize: isMobile ? 18 : 26, fontWeight: 700 }}
            />
            <TrendIndicator pct={trends.netRevenue.pct} up={trends.netRevenue.up} />
          </Card>
        </Col>

        {/* Platform Balance */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="ov-hero"
            loading={walletLoading}
            styles={{ body: { padding: isMobile ? '14px 12px' : '20px 24px' } }}
            style={{
              borderRadius: 14,
              border: '1px solid #b7eb8f',
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              height: '100%',
              transition: 'all 0.2s',
            }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 12, color: '#389e0d', fontWeight: 600 }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  {t('payments.platformBalance')}
                  <Tooltip title={t('payments.platformBalanceTooltip')}>
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 11 }} />
                  </Tooltip>
                </span>
              }
              value={wallet?.totalBalance ?? 0}
              formatter={(val) => formatCurrency(val as number, wallet?.currency)}
              valueStyle={{ color: '#237804', fontSize: isMobile ? 18 : 26, fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Holding Escrow — WARNING */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="ov-hero"
            loading={summaryLoading}
            styles={{ body: { padding: isMobile ? '14px 12px' : '20px 24px' } }}
            style={{
              borderRadius: 14,
              border: '1.5px solid #ffe58f',
              background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
              height: '100%',
              transition: 'all 0.2s',
            }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 12, color: '#ad6800', fontWeight: 600 }}>
                  <ExclamationCircleOutlined style={{ marginRight: 4, color: '#faad14' }} />
                  {t('payments.holdingEscrowCount')}
                  <Tooltip title={t('payments.holdingEscrowTooltip')}>
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 11 }} />
                  </Tooltip>
                </span>
              }
              value={summary?.holdingEscrowCount ?? 0}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: '#d48806', fontSize: isMobile ? 18 : 26, fontWeight: 700 }}
            />
          </Card>
        </Col>

        {/* Pending Withdrawals — DANGER */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            className="ov-hero"
            loading={summaryLoading}
            styles={{ body: { padding: isMobile ? '14px 12px' : '20px 24px' } }}
            style={{
              borderRadius: 14,
              border: '1.5px solid #ffa39e',
              background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
              height: '100%',
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.1)',
              transition: 'all 0.2s',
            }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 12, color: '#a8071a', fontWeight: 600 }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
                  {t('payments.pendingWithdrawals')}
                </span>
              }
              value={summary?.withdrawalPendingCount ?? 0}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: '#cf1322', fontSize: isMobile ? 18 : 26, fontWeight: 700 }}
              suffix={
                (summary?.withdrawalPendingCount ?? 0) > 0
                  ? <span style={{ fontSize: 12, color: '#a8071a', fontWeight: 500 }}>({summary?.withdrawalPendingCount} {t('payments.pendingCount', 'yêu cầu')})</span>
                  : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: LEFT (chart + breakdown) | RIGHT (operational sidebar)
          ═══════════════════════════════════════════════════════════════ */}
      <Row gutter={[isMobile ? 0 : 20, isMobile ? 16 : 0]}>
        {/* ─── LEFT: Analytics Column (65–70%) ────────────────────── */}
        <Col xs={24} lg={16} xl={17}>
          {/* Revenue Chart */}
          <PlatformRevenueChart />

          {/* Revenue Breakdown Cards */}
          <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
            <Col xs={8}>
              <Card
                styles={{ body: { padding: isMobile ? '10px 8px' : '16px 20px' } }}
                style={{ borderRadius: 12, borderLeft: '3px solid #52c41a' }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: isMobile ? 10 : 12, color: '#595959' }}>
                      <PercentageOutlined style={{ marginRight: 3, color: '#52c41a' }} />
                      {t('payments.commission', 'Hoa hồng')}
                    </span>
                  }
                  value={revenueData?.totalCommission ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#389e0d', fontSize: isMobile ? 14 : 18, fontWeight: 700 }}
                />
                <TrendIndicator pct={trends.commission.pct} up={trends.commission.up} />
              </Card>
            </Col>
            <Col xs={8}>
              <Card
                styles={{ body: { padding: isMobile ? '10px 8px' : '16px 20px' } }}
                style={{ borderRadius: 12, borderLeft: '3px solid #1677ff' }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: isMobile ? 10 : 12, color: '#595959' }}>
                      <SafetyCertificateOutlined style={{ marginRight: 3, color: '#1677ff' }} />
                      {t('payments.inspectionFees', 'Phí kiểm định')}
                    </span>
                  }
                  value={revenueData?.totalInspectionFees ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ fontSize: isMobile ? 14 : 18, fontWeight: 700 }}
                />
                <TrendIndicator pct={trends.inspectionFees.pct} up={trends.inspectionFees.up} />
              </Card>
            </Col>
            <Col xs={8}>
              <Card
                styles={{ body: { padding: isMobile ? '10px 8px' : '16px 20px' } }}
                style={{ borderRadius: 12, borderLeft: '3px solid #fa8c16' }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: isMobile ? 10 : 12, color: '#595959' }}>
                      <StopOutlined style={{ marginRight: 3, color: '#fa8c16' }} />
                      {t('payments.forfeit', 'Tịch thu')}
                    </span>
                  }
                  value={revenueData?.totalForfeitIncome ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#d46b08', fontSize: isMobile ? 14 : 18, fontWeight: 700 }}
                />
                <TrendIndicator pct={trends.forfeitIncome.pct} up={trends.forfeitIncome.up} />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* ─── RIGHT: Operational Sidebar (30–35%) ────────────────── */}
        <Col xs={24} lg={8} xl={7}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16, height: '100%' }}>

            {/* Block 1: Activity */}
            <Card
              loading={summaryLoading}
              styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
              style={{ borderRadius: 12, flex: 1 }}
            >
              <Typography.Text strong style={{ fontSize: 13, color: '#262626', display: 'block', marginBottom: 8 }}>
                {t('payments.activityStats')}
              </Typography.Text>
              <SidebarStatRow
                icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
                label={t('payments.completedPayments')}
                value={summary?.completedPayments ?? 0}
                color="#389e0d"
              />
              <div style={{ borderTop: '1px solid #f0f0f0' }} />
              <SidebarStatRow
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />}
                label={t('payments.failedPayments')}
                value={summary?.failedPayments ?? 0}
                color="#cf1322"
              />
              <div style={{ borderTop: '1px solid #f0f0f0' }} />
              <SidebarStatRow
                icon={<WalletOutlined style={{ color: '#1677ff', fontSize: 14 }} />}
                label={t('payments.walletTopUps')}
                value={summary?.walletTopUps ?? 0}
              />
            </Card>

            {/* Block 2: Escrow Breakdown */}
            <Card
              loading={summaryLoading}
              styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
              style={{ borderRadius: 12, flex: 1 }}
            >
              <Typography.Text strong style={{ fontSize: 13, color: '#262626', display: 'block', marginBottom: 8 }}>
                {t('payments.escrowBreakdown', 'Chi tiết ký quỹ')}
              </Typography.Text>
              <SidebarStatRow
                icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
                label={t('payments.releasedEscrow')}
                value={formatCurrency(released)}
                color="#389e0d"
              />
              <SidebarStatRow
                icon={<LockOutlined style={{ color: '#1677ff', fontSize: 14 }} />}
                label={t('payments.refundedEscrow')}
                value={formatCurrency(refunded)}
                color="#1677ff"
              />
              {/* Progress bar: Released vs Refunded ratio */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                  <span>{t('payments.releasedLabel', 'Giải phóng')} {releasedPct}%</span>
                  <span>{t('payments.refundedLabel', 'Hoàn tiền')} {100 - releasedPct}%</span>
                </div>
                <Progress
                  percent={100}
                  success={{ percent: releasedPct, strokeColor: '#52c41a' }}
                  strokeColor="#1677ff"
                  showInfo={false}
                  size="small"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </Card>

            {/* Block 3: Wallet Details */}
            <Card
              loading={walletLoading}
              styles={{ body: { padding: isMobile ? '12px 14px' : '16px 20px' } }}
              style={{ borderRadius: 12, flex: 1 }}
            >
              <Typography.Text strong style={{ fontSize: 13, color: '#262626', display: 'block', marginBottom: 8 }}>
                {t('payments.walletDetails', 'Chi tiết ví')}
              </Typography.Text>
              <SidebarStatRow
                icon={<DollarOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
                label={t('payments.availableBalance')}
                value={formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}
                color="#389e0d"
              />
              <div style={{ borderTop: '1px solid #f0f0f0' }} />
              <SidebarStatRow
                icon={<ClockCircleOutlined style={{ color: '#faad14', fontSize: 14 }} />}
                label={t('payments.pendingBalance')}
                value={formatCurrency(wallet?.pendingBalance ?? 0, wallet?.currency)}
                color="#d48806"
              />
            </Card>
          </div>
        </Col>
      </Row>
    </>
  )
}
