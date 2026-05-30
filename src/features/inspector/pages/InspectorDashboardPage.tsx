import { useState } from 'react'
import { Typography, Card, Row, Col, Button, Space, Spin, Alert } from 'antd'
import {
  SearchOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInspectionQueue, useInspectionDashboardStats } from '@/features/inspector/api'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'

export default function InspectorDashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('inspector')
  const { isMobile } = useBreakpoint()

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const { data: categories } = useCategories()
  const { data: stats, isLoading: statsLoading } = useInspectionDashboardStats()

  const { data: queueData, isLoading: queueLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 8,
    status: 'awaiting_inspection',
    categoryId: activeCategoryId || undefined,
  })

  const { data: reviewData, isLoading: reviewLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 5,
    status: 'awaiting_review',
  })

  const queue = queueData?.items ?? []
  const awaitingReviewList = reviewData?.items ?? []

  const isLoading = statsLoading || queueLoading || reviewLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const statCards = [
    {
      icon: <SearchOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />,
      value: stats?.awaitingInspection ?? 0,
      label: t('dashboard.awaitingInspection'),
      trend: '',
      trendColor: 'var(--color-text-secondary)',
    },
    {
      icon: <AuditOutlined style={{ fontSize: 24, color: 'var(--color-warning)' }} />,
      value: stats?.awaitingReview ?? 0,
      label: t('dashboard.awaitingReview'),
      trend: '',
      trendColor: 'var(--color-text-secondary)',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--color-success)' }} />,
      value: stats?.todayCompleted ?? 0,
      label: t('dashboard.completedToday'),
      trend: '',
      trendColor: 'var(--color-text-secondary)',
    },
  ]

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <Typography.Title
        level={2}
        style={{ marginBottom: isMobile ? 16 : 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', fontSize: isMobile ? 22 : undefined }}
      >
        {t('dashboard.title')}
      </Typography.Title>

      {/* ── Large Stat Cards ── */}
      <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]} style={{ marginBottom: isMobile ? 20 : 32 }}>
        {statCards.map((stat, idx) => (
          <Col xs={12} sm={8} key={idx}>
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 12,
                padding: isMobile ? '16px 12px' : '28px 24px',
                border: '1px solid var(--color-border-light)',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ marginBottom: 12 }}>{stat.icon}</div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: isMobile ? 24 : 36,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: 'var(--color-text-primary)',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                {stat.label}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Quick Actions ── */}
      <Card
        title={t('dashboard.quickActions')}
        style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)' }}
      >
        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate('/inspector/queue')}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('dashboard.viewQueue')}
          </Button>
          <Button
            icon={<AuditOutlined />}
            onClick={() => navigate('/inspector/reviews')}
          >
            {t('dashboard.reviews')}
          </Button>
        </Space>
      </Card>

      {/* ── Category Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategoryId(null)}
          style={{
            padding: '6px 18px',
            borderRadius: 20,
            border: '1px solid var(--color-border)',
            background: activeCategoryId === null ? 'var(--color-accent)' : 'var(--color-bg-card)',
            color: activeCategoryId === null ? '#fff' : 'var(--color-text-secondary)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t('dashboard.categoryAll')}
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              background: activeCategoryId === cat.id ? 'var(--color-accent)' : 'var(--color-bg-card)',
              color: activeCategoryId === cat.id ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Item Cards Grid ── */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0, fontFamily: SERIF_FONT }}>
            {t('dashboard.inspectionQueue')}
          </Typography.Title>
          <Button type="link" onClick={() => navigate('/inspector/queue')} style={{ color: 'var(--color-accent)' }}>
            {t('dashboard.viewAll')}
          </Button>
        </div>

        {queue?.length ? (
          <Row gutter={[16, 16]}>
            {queue.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.warehouseItemId ?? item.itemId}>
                <div
                  style={{
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-card)',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Item image or placeholder */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 160,
                      background: 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-secondary)',
                      fontSize: 32,
                      overflow: 'hidden',
                    }}
                  >
                    {item.itemImageUrl ? (
                      <img
                        src={item.itemImageUrl}
                        alt={item.itemTitle}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <DatabaseOutlined />
                    )}
                    {/* Category badge could be dynamically added if we enrich API to return categoryName */}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text
                      strong
                      ellipsis
                      style={{
                        fontSize: 14,
                        color: 'var(--color-text-primary)',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      {item.itemTitle}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 8,
                      }}
                    >
                      {item.carrierTrackingNumber || item.inboundShipmentId.slice(0, 8).toUpperCase()}
                    </Typography.Text>

                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {item.arrivedAt ? formatDateTime(item.arrivedAt) : '-'}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={item.queueStatus} />
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/inspector/inspections/${item.inboundShipmentId}`)}
                        style={{
                          background: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        {t('dashboard.inspect')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Alert message={t('dashboard.noPendingInspections')} type="info" showIcon />
        )}
      </div>

      {/* ── Awaiting Review History table ── */}
      <Card
        title={t('dashboard.awaitingReview')}
        style={{ borderRadius: 12, border: '1px solid var(--color-border)' }}
        extra={
          <Button type="link" onClick={() => navigate('/inspector/reviews')} style={{ color: 'var(--color-accent)' }}>
            {t('dashboard.viewAll')}
          </Button>
        }
      >
        {awaitingReviewList?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('dashboard.columnItem')}</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('dashboard.columnSeller')}</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('dashboard.columnStatus')}</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{t('dashboard.columnTime')}</th>
                </tr>
              </thead>
              <tbody>
                {awaitingReviewList.map((item) => (
                  <tr key={item.warehouseItemId ?? item.itemId} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.itemTitle}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.sellerId.slice(0, 8)}...</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={item.queueStatus} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.arrivedAt ? formatDateTime(item.arrivedAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Alert message={t('dashboard.noHistoryToday')} type="info" showIcon />
        )}
      </Card>
    </div>
  )
}
