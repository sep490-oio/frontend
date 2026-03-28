import { useState } from 'react'
import { Typography, Card, Row, Col, Button, Space, Spin, Alert } from 'antd'
import {
  SearchOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useInspectionQueue, useStorageLocations } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

const CATEGORY_PILLS = ['Tất cả', 'Đồng hồ', 'Thời trang', 'Nghệ thuật']

export default function InspectorDashboardPage() {
  const navigate = useNavigate()
  const [activePill, setActivePill] = useState('Tất cả')

  const { data: queue, isLoading: queueLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 5,
    status: 'pending',
  })
  const { data: completedToday, isLoading: completedLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 1,
    status: 'completed',
  })
  const { data: locations, isLoading: locationsLoading } = useStorageLocations()

  const isLoading = queueLoading || completedLoading || locationsLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const occupiedCount = locations?.filter((l) => l.isOccupied).length ?? 0
  const totalLocations = locations?.length ?? 0
  const pendingCount = queue?.metadata?.totalCount ?? 0
  const completedCount = completedToday?.metadata?.totalCount ?? 0

  const statCards = [
    {
      icon: <SearchOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />,
      value: pendingCount,
      label: 'Chờ kiểm định',
      trend: '+12% so với hôm qua',
      trendColor: 'var(--color-danger)',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--color-success)' }} />,
      value: completedCount,
      label: 'Hoàn thành hôm nay',
      trend: 'Duy trì ổn định',
      trendColor: 'var(--color-success)',
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />,
      value: totalLocations > 0 ? `${Math.round((occupiedCount / totalLocations) * 100)}%` : '0%',
      label: 'Sức chứa kho',
      trend: `-30s nhanh hơn TB`,
      trendColor: 'var(--color-success)',
    },
  ]

  const { isMobile } = useBreakpoint()

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <Typography.Title
        level={2}
        style={{ marginBottom: isMobile ? 16 : 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', fontSize: isMobile ? 22 : undefined }}
      >
        Inspector Dashboard
      </Typography.Title>

      {/* ── Large Stat Cards ── */}
      <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]} style={{ marginBottom: isMobile ? 20 : 32 }}>
        {statCards.map((stat, idx) => (
          <Col xs={12} sm={8} key={idx}>
            <div
              style={{
                background: 'var(--color-accent-light)',
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
              <div style={{ fontSize: 12, color: stat.trendColor, fontWeight: 500 }}>
                {stat.trend}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Quick Actions ── */}
      <Card
        title="Quick Actions"
        style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)' }}
      >
        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate('/inspector/queue')}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            View Queue
          </Button>
          <Button
            icon={<DatabaseOutlined />}
            onClick={() => navigate('/inspector/storage')}
          >
            Manage Storage
          </Button>
        </Space>
      </Card>

      {/* ── Category Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill}
            onClick={() => setActivePill(pill)}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              background: activePill === pill ? 'var(--color-accent)' : 'var(--color-bg-card)',
              color: activePill === pill ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {pill}
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
            Hàng đợi kiểm định
          </Typography.Title>
          <Button type="link" onClick={() => navigate('/inspector/queue')} style={{ color: 'var(--color-accent)' }}>
            Xem tất cả
          </Button>
        </div>

        {queue?.items?.length ? (
          <Row gutter={[16, 16]}>
            {queue.items.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
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
                  {/* Image placeholder */}
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
                    }}
                  >
                    <DatabaseOutlined />
                    {/* Category badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'var(--color-accent)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: 10,
                      }}
                    >
                      Vật phẩm
                    </span>
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
                      {item.providerCode || item.id.slice(0, 8).toUpperCase()}
                    </Typography.Text>

                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatDateTime(item.arrivedAt)}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusBadge status={item.status} />
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/inspector/inspections/${item.id}`)}
                        style={{
                          background: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Alert message="No pending inspections" type="info" showIcon />
        )}
      </div>

      {/* ── History table (kept as-is) ── */}
      <Card
        title="Lịch sử kiểm định"
        style={{ borderRadius: 12, border: '1px solid var(--color-border)' }}
        extra={
          <Button type="link" onClick={() => navigate('/inspector/queue')} style={{ color: 'var(--color-accent)' }}>
            View All
          </Button>
        }
      >
        {completedToday?.items?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Vật phẩm</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Người bán</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {completedToday.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.itemTitle}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.sellerName}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={item.status} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>{formatDateTime(item.arrivedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Alert message="Chưa có lịch sử kiểm định hôm nay" type="info" showIcon />
        )}
      </Card>
    </div>
  )
}
