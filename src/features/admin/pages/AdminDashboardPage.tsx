import { Typography, Card, Row, Col, List, Button, Space, Spin, Alert, Avatar, Progress, Tag } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  WalletOutlined,
  FileSearchOutlined,
  AuditOutlined,
  FlagOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useAdminReports, useAdminWithdrawals, usePendingVerifications, usePlatformWallet } from '@/features/admin/api'
import { useAuctions } from '@/features/auction/api'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { ReportDto } from '@/types'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const MONO_FONT = "'DM Mono', monospace"

/* ── Trend indicator component ─────────────────────────────────────── */

function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isUp = value >= 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 12,
        fontWeight: 600,
        color: isUp ? 'var(--color-success)' : '#cf1322',
        background: isUp ? 'rgba(74, 124, 89, 0.1)' : 'rgba(207, 19, 34, 0.1)',
        borderRadius: 100,
        padding: '2px 8px',
      }}
    >
      {isUp ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
      {Math.abs(value)}{suffix}
    </span>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: users, isLoading: usersLoading } = useAdminUsers({ pageNumber: 1, pageSize: 1 })
  const { data: verifications, isLoading: verificationsLoading } = usePendingVerifications({ pageNumber: 1, pageSize: 5, status: 'pending' })
  const { data: reports, isLoading: reportsLoading } = useAdminReports({ pageNumber: 1, pageSize: 5, status: 'open' })
  const { data: withdrawals, isLoading: withdrawalsLoading } = useAdminWithdrawals({ pageNumber: 1, pageSize: 5, status: 'pending' })
  const { data: wallet, isLoading: walletLoading } = usePlatformWallet()
  const { data: liveAuctions } = useAuctions({ pageNumber: 1, pageSize: 5, status: 'active' })

  const isLoading = usersLoading || verificationsLoading || reportsLoading || withdrawalsLoading || walletLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <Typography.Title
        level={2}
        style={{ marginBottom: isMobile ? 16 : 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', fontSize: isMobile ? 22 : undefined }}
      >
        {t('dashboard.title')}
      </Typography.Title>

      {/* ── Stat Cards with Trends ──────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} xl={6}>
          <Card
            style={{
              background: 'var(--color-accent-light)',
              borderColor: 'var(--color-border)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                  <UserOutlined style={{ marginRight: 6 }} />
                  {t('dashboard.totalUsers')}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {users?.metadata?.totalCount ?? 0}
                </div>
              </div>
              {/* TODO: Replace with real metrics from API */}
              <TrendIndicator value={12.5} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card
            style={{
              background: 'var(--color-accent-light)',
              borderColor: 'var(--color-border)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                  {t('dashboard.pendingVerifications')}
                </div>
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 28,
                    fontWeight: 600,
                    color: (verifications?.metadata?.totalCount ?? 0) > 0 ? '#faad14' : 'var(--color-text-primary)',
                  }}
                >
                  {verifications?.metadata?.totalCount ?? 0}
                </div>
              </div>
              {/* TODO: Replace with real metrics from API */}
              <TrendIndicator value={-2.4} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card
            style={{
              background: 'var(--color-accent-light)',
              borderColor: 'var(--color-border)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                  <WarningOutlined style={{ marginRight: 6 }} />
                  {t('dashboard.openReports')}
                </div>
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 28,
                    fontWeight: 600,
                    color: (reports?.metadata?.totalCount ?? 0) > 0 ? '#cf1322' : 'var(--color-text-primary)',
                  }}
                >
                  {reports?.metadata?.totalCount ?? 0}
                </div>
              </div>
              {/* TODO: Replace with real metrics from API */}
              <TrendIndicator value={5.1} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} xl={6}>
          <Card
            style={{
              background: 'var(--color-accent-light)',
              borderColor: 'var(--color-border)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                  <WalletOutlined style={{ marginRight: 6 }} />
                  {t('dashboard.platformBalance')}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: 28, fontWeight: 600, color: 'var(--color-success)' }}>
                  {formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}
                </div>
              </div>
              {/* TODO: Replace with real metrics from API */}
              <TrendIndicator value={8.3} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <Card
        title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>{t('dashboard.quickActions')}</span>}
        style={{ marginBottom: 24, borderRadius: 12 }}
      >
        <Space wrap>
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => navigate('/admin/items/review')}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('dashboard.reviewQueue')}
          </Button>
          <Button icon={<AuditOutlined />} onClick={() => navigate('/admin/verifications')}>
            {t('dashboard.viewVerifications')}
          </Button>
          <Button icon={<FlagOutlined />} onClick={() => navigate('/admin/reports')}>
            {t('dashboard.viewReports')}
          </Button>
        </Space>
      </Card>

      {/* ── Main content: KYC table + Live Auctions sidebar ──────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* KYC Review Table */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                {t('dashboard.pendingVerifications')}
              </span>
            }
            extra={
              <Button type="link" onClick={() => navigate('/admin/verifications')}>
                {t('dashboard.viewVerifications')}
              </Button>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            {verifications?.items?.length ? (
              <List
                dataSource={verifications.items}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="approve"
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        style={{
                          background: 'var(--color-success)',
                          borderColor: 'var(--color-success)',
                          borderRadius: 6,
                        }}
                        onClick={() => navigate(`/admin/verifications/${item.id}`)}
                      >
                        {t('actions.approve', 'Approve')}
                      </Button>,
                      <Button
                        key="reject"
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        style={{ borderRadius: 6 }}
                        onClick={() => navigate(`/admin/verifications/${item.id}`)}
                      >
                        {t('actions.reject', 'Reject')}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={40}
                          icon={<UserOutlined />}
                          style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                        />
                      }
                      title={
                        <span style={{ fontWeight: 500 }}>
                          {item.fullName ?? item.userId}
                        </span>
                      }
                      description={
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          {item.verificationType} &middot; {formatDateTime(item.submittedAt ?? item.createdAt)}
                        </span>
                      }
                    />
                    <StatusBadge status={item.status} size="small" />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message={t('common.noData')} type="info" showIcon />
            )}
          </Card>
        </Col>

        {/* Live Auctions Sidebar */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                <ThunderboltOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
                {t('dashboard.liveAuctions', 'Live Auctions')}
              </span>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            {liveAuctions?.items?.length ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {liveAuctions.items.map((auction) => {
                  const now = Date.now()
                  const end = auction.endTime ? new Date(auction.endTime).getTime() : now
                  const start = auction.startTime ? new Date(auction.startTime).getTime() : now
                  const total = end - start
                  const elapsed = now - start
                  const progress = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0

                  return (
                    <div
                      key={auction.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--color-accent-light)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/admin/auctions/${auction.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)' }}>
                          {auction.itemTitle ?? 'Auction'}
                        </span>
                        <Tag color="green" style={{ margin: 0, fontSize: 11, borderRadius: 100 }}>
                          LIVE
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                        {auction.bidCount ?? 0} bids &middot;{' '}
                        <span style={{ fontFamily: MONO_FONT, fontWeight: 500 }}>
                          {formatCurrency(
                            typeof auction.currentPrice === 'object' && auction.currentPrice
                              ? (auction.currentPrice as { amount: number }).amount
                              : (auction.currentPrice as number) ?? 0,
                          )}
                        </span>
                      </div>
                      <Progress
                        percent={progress}
                        size="small"
                        strokeColor="var(--color-accent)"
                        trailColor="var(--color-border)"
                        showInfo={false}
                      />
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {auction.endTime ? formatDateTime(auction.endTime) : '-'}
                      </div>
                    </div>
                  )
                })}
              </Space>
            ) : (
              <Alert message={t('dashboard.noLiveAuctions', 'No live auctions')} type="info" showIcon />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Recent reports */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                {t('dashboard.recentReports')}
              </span>
            }
            extra={<Button type="link" onClick={() => navigate('/admin/reports')}>{t('dashboard.viewReports')}</Button>}
            style={{ borderRadius: 12 }}
          >
            {reports?.items?.length ? (
              <List<ReportDto>
                dataSource={reports?.items ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.entityType} - ${item.reasonCode}`}
                      description={formatDateTime(item.createdAt)}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message={t('common.noData')} type="info" showIcon />
            )}
          </Card>
        </Col>

        {/* Pending withdrawals */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                {t('dashboard.pendingWithdrawals')}
              </span>
            }
            extra={<Button type="link" onClick={() => navigate('/admin/payments')}>{t('payments.withdrawals')}</Button>}
            style={{ borderRadius: 12 }}
          >
            {withdrawals?.items?.length ? (
              <List
                dataSource={withdrawals?.items ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={formatCurrency(item.amount)}
                      description={`${item.accountHolder ?? ''} - ${formatDateTime(item.createdAt)}`}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message={t('common.noData')} type="info" showIcon />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── System Health Bar ────────────────────────────────────────── */}
      <Card style={{ borderRadius: 12 }}>
        <Row gutter={[24, 12]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertOutlined style={{ fontSize: 18, color: 'var(--color-accent)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.riskLevel', 'Risk Level')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: 14 }}>
                  {t('dashboard.low', 'Low')}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HeartOutlined style={{ fontSize: 18, color: 'var(--color-success)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.uptime', 'Uptime')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14, fontFamily: MONO_FONT }}>
                  99.9%
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingOutlined style={{ fontSize: 18, color: '#faad14' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.openTickets', 'Open Tickets')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14, fontFamily: MONO_FONT }}>
                  {(reports?.metadata?.totalCount ?? 0) + (withdrawals?.metadata?.totalCount ?? 0)}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
