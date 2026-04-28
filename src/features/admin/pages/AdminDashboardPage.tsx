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
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

/* ── Trend indicator component ─────────────────────────────────────── */

function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isUp = value >= 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 11,
        fontWeight: 600,
        color: isUp ? 'var(--color-success)' : 'var(--color-danger)',
        background: isUp ? 'rgba(74, 124, 89, 0.1)' : 'rgba(207, 19, 34, 0.1)',
        borderRadius: 100,
        padding: '2px 6px',
        flexShrink: 0,
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
    <div style={{ padding: isMobile ? '12px 12px 80px' : '0 0 40px' }}>
      <Typography.Title
        level={isMobile ? 3 : 2}
        style={{
          marginBottom: isMobile ? 12 : 24,
          fontFamily: SERIF_FONT,
          color: 'var(--color-text-primary)',
        }}
      >
        {t('dashboard.title')}
      </Typography.Title>

      {/* ── Stat Cards with Trends ──────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={12} xl={6}>
          <Card
            style={{
              background: 'var(--color-accent-light)',
              borderColor: 'var(--color-border)',
              borderRadius: 12,
            }}
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {t('dashboard.totalUsers')}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 22 : 28, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                  {users?.metadata?.totalCount ?? 0}
                </div>
              </div>
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
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                  {t('dashboard.pendingVerifications')}
                </div>
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 600,
                    color: (verifications?.metadata?.totalCount ?? 0) > 0 ? '#faad14' : 'var(--color-text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {verifications?.metadata?.totalCount ?? 0}
                </div>
              </div>
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
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <WarningOutlined style={{ marginRight: 4 }} />
                  {t('dashboard.openReports')}
                </div>
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 600,
                    color: (reports?.metadata?.totalCount ?? 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {reports?.metadata?.totalCount ?? 0}
                </div>
              </div>
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
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <WalletOutlined style={{ marginRight: 4 }} />
                  {t('dashboard.platformBalance')}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 18 : 28, fontWeight: 600, color: 'var(--color-success)', lineHeight: 1.2 }}>
                  {formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}
                </div>
              </div>
              <TrendIndicator value={8.3} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <Card
        title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>{t('dashboard.quickActions')}</span>}
        style={{ marginBottom: isMobile ? 16 : 24, borderRadius: 12 }}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        {/* On mobile: stack vertically with full-width buttons */}
        {isMobile ? (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Button
              type="primary"
              icon={<FileSearchOutlined />}
              onClick={() => navigate('/admin/items/review')}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', height: 44, width: '100%' }}
              block
            >
              {t('dashboard.reviewQueue')}
            </Button>
            <Button icon={<AuditOutlined />} onClick={() => navigate('/admin/verifications')} style={{ height: 44 }} block>
              {t('dashboard.viewVerifications')}
            </Button>
            <Button icon={<FlagOutlined />} onClick={() => navigate('/admin/reports')} style={{ height: 44 }} block>
              {t('dashboard.viewReports')}
            </Button>
          </Space>
        ) : (
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
        )}
      </Card>

      {/* ── Main content: KYC table + Live Auctions sidebar ──────── */}
      <Row gutter={[isMobile ? 0 : 16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
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
              <Button type="link" onClick={() => navigate('/admin/verifications')} style={{ padding: 0 }}>
                {t('dashboard.viewVerifications')}
              </Button>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 0 : 24 } }}
          >
            {verifications?.items?.length ? (
              <List
                dataSource={verifications.items}
                renderItem={(item) => (
                  <List.Item
                    actions={isMobile ? undefined : [
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
                    onClick={isMobile ? () => navigate(`/admin/verifications/${item.id}`) : undefined}
                    style={{ cursor: isMobile ? 'pointer' : 'default', padding: isMobile ? '12px 16px' : '12px 24px' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={isMobile ? 36 : 40}
                          icon={<UserOutlined />}
                          style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', flexShrink: 0 }}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 500 }}>
                            {item.fullName ?? item.userId}
                          </span>
                          {isMobile && <StatusBadge status={item.status} size="small" />}
                        </div>
                      }
                      description={
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          {item.verificationType} &middot; {formatDateTime(item.submittedAt ?? item.createdAt)}
                        </span>
                      }
                    />
                    {!isMobile && <StatusBadge status={item.status} size="small" />}
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ padding: isMobile ? 16 : 24 }}>
                <Alert message={t('common.noData')} type="info" showIcon />
              </div>
            )}
          </Card>
        </Col>

        {/* Live Auctions Sidebar */}
        <Col xs={24} lg={8} style={{ marginTop: isMobile ? 16 : 0 }}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                <ThunderboltOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
                {t('dashboard.liveAuctions', 'Live Auctions')}
              </span>
            }
            style={{ borderRadius: 12 }}
          >
            {liveAuctions?.items?.length ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
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
                        minHeight: 44,
                      }}
                      onClick={() => navigate(`/admin/auctions/${auction.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auction.itemTitle ?? 'Auction'}
                        </span>
                        <Tag color="green" style={{ margin: 0, fontSize: 11, borderRadius: 100, flexShrink: 0 }}>
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

      <Row gutter={[isMobile ? 0 : 16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {/* Recent reports */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                {t('dashboard.recentReports')}
              </span>
            }
            extra={<Button type="link" onClick={() => navigate('/admin/reports')} style={{ padding: 0 }}>{t('dashboard.viewReports')}</Button>}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 0 : 24 } }}
          >
            {reports?.items?.length ? (
              <List<ReportDto>
                dataSource={reports?.items ?? []}
                renderItem={(item) => (
                  <List.Item style={{ padding: isMobile ? '10px 16px' : '10px 24px' }}>
                    <List.Item.Meta
                      title={<span style={{ fontSize: 13 }}>{`${item.entityType} - ${item.reasonCode}`}</span>}
                      description={<span style={{ fontSize: 12 }}>{formatDateTime(item.createdAt)}</span>}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ padding: isMobile ? 16 : 24 }}>
                <Alert message={t('common.noData')} type="info" showIcon />
              </div>
            )}
          </Card>
        </Col>

        {/* Pending withdrawals */}
        <Col xs={24} lg={12} style={{ marginTop: isMobile ? 16 : 0 }}>
          <Card
            title={
              <span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
                {t('dashboard.pendingWithdrawals')}
              </span>
            }
            extra={<Button type="link" onClick={() => navigate('/admin/payments')} style={{ padding: 0 }}>{t('payments.withdrawals')}</Button>}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 0 : 24 } }}
          >
            {withdrawals?.items?.length ? (
              <List
                dataSource={withdrawals?.items ?? []}
                renderItem={(item) => (
                  <List.Item style={{ padding: isMobile ? '10px 16px' : '10px 24px' }}>
                    <List.Item.Meta
                      title={<span style={{ fontSize: 13 }}>{formatCurrency(item.amount)}</span>}
                      description={<span style={{ fontSize: 12 }}>{`${item.accountHolder ?? ''} - ${formatDateTime(item.createdAt)}`}</span>}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ padding: isMobile ? 16 : 24 }}>
                <Alert message={t('common.noData')} type="info" showIcon />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── System Health Bar ────────────────────────────────────────── */}
      <Card style={{ borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={8} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
              <AlertOutlined style={{ fontSize: isMobile ? 16 : 18, color: 'var(--color-accent)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.riskLevel', 'Risk Level')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: isMobile ? 12 : 14 }}>
                  {t('dashboard.low', 'Low')}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={8} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
              <HeartOutlined style={{ fontSize: isMobile ? 16 : 18, color: 'var(--color-success)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.uptime', 'Uptime')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: isMobile ? 12 : 14, fontFamily: MONO_FONT }}>
                  99.9%
                </div>
              </div>
            </div>
          </Col>
          <Col xs={8} sm={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
              <ShoppingOutlined style={{ fontSize: isMobile ? 16 : 18, color: '#faad14', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('dashboard.openTickets', 'Open Tickets')}
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: isMobile ? 12 : 14, fontFamily: MONO_FONT }}>
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
