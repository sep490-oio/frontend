import { useState } from 'react'
import { Typography, Tag, Button, Spin, Empty, Card } from 'antd'
import { EyeOutlined, CommentOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMyDisputes } from '@/features/dispute/api'
import type { DisputeFilterParams } from '@/features/dispute/api'
import { DisputeStatus } from '@/types/enums'
import type { DisputeListItemDto } from '@/types'
import type { TablePaginationConfig } from 'antd/es/table'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

const STATUS_COLOR_MAP: Record<string, string> = {
  [DisputeStatus.Open]: 'blue',
  [DisputeStatus.AwaitingRespondent]: 'gold',
  [DisputeStatus.AwaitingEvidence]: 'gold',
  [DisputeStatus.UnderReview]: 'orange',
  [DisputeStatus.AwaitingInternalReview]: 'orange',
  [DisputeStatus.AwaitingResolutionApproval]: 'purple',
  [DisputeStatus.Resolved]: 'green',
  [DisputeStatus.Rejected]: 'red',
  [DisputeStatus.Cancelled]: 'default',
}

const DOMAIN_COLOR_MAP: Record<string, string> = {
  order: 'blue',
  auction: 'purple',
  payment: 'gold',
  shipment: 'cyan',
  warehouse_item: 'orange',
}

export default function MyDisputesPage() {
  const { t } = useTranslation('dispute')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const STATUS_OPTIONS = [
    { value: '', label: t('filter.all', 'All') },
    { value: DisputeStatus.Open, label: t('statusLabel.open') },
    { value: DisputeStatus.AwaitingRespondent, label: t('statusLabel.awaiting_respondent') },
    { value: DisputeStatus.UnderReview, label: t('statusLabel.under_review') },
    { value: DisputeStatus.Resolved, label: t('statusLabel.resolved') },
  ]

  const [filters, setFilters] = useState<DisputeFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useMyDisputes(filters)

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters((prev: DisputeFilterParams) => ({
      ...prev,
      pageNumber: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleStatusFilter = (value: string) => {
    setFilters((prev: DisputeFilterParams) => ({
      ...prev,
      status: value || undefined,
      pageNumber: 1,
    }))
  }

  const columns = [
    {
      title: t('disputeNumber', 'Number'),
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
      width: 130,
      render: (v: string, record: DisputeListItemDto) => (
        <Button
          type="link"
          onClick={() => navigate(`/me/disputes/${record.id}`)}
          style={{ padding: 0, fontFamily: MONO_FONT, fontWeight: 600, fontSize: 14, color: 'var(--color-accent)' }}
        >
          #{v || record.id.slice(0, 8)}
        </Button>
      )
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] ?? 'default'} style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}>
          {t(`statusLabel.${status}`, status)}
        </Tag>
      ),
    },
    {
      title: t('domain', 'Domain'),
      dataIndex: 'domain',
      key: 'domain',
      width: 120,
      render: (domain: string) =>
        domain ? <Tag color={DOMAIN_COLOR_MAP[domain] ?? 'default'} style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}>{t(`domainLabel.${domain}`, domain)}</Tag> : '-',
    },
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => (
        <Text style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>{formatDateTime(v)}</Text>
      )
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: DisputeListItemDto) => (
        <Button size="middle" icon={<EyeOutlined />} onClick={() => navigate(`/me/disputes/${record.id}`)} style={{ borderRadius: 10, fontWeight: 600, height: 36 }}>
          {tc('action.view', 'View')}
        </Button>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <Title
          level={2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          <CommentOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('myDisputes', 'My Disputes')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('myDisputesSubtitle', 'Resolution center for your orders and auctions')}
        </Text>
      </div>

      {/* Pill Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24, 
        overflowX: 'auto', 
        scrollbarWidth: 'none', 
        paddingBottom: isMobile ? 4 : 0,
        msOverflowStyle: 'none'
      }}>
        {STATUS_OPTIONS.map((opt) => {
          const isActive = (filters.status || '') === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusFilter(opt.value)}
              style={{
                padding: '8px 20px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SANS_FONT,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 38,
                border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-accent)' : 'var(--color-bg-card)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <Empty
          description={t('noDisputes', 'No disputes found')}
          style={{ padding: 80, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
        />
      ) : (
        <Card
          styles={{ body: { padding: 0 } }}
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <ResponsiveTable<DisputeListItemDto>
            mobileMode="card"
            columns={columns}
            dataSource={data?.items ?? []}
            rowKey="id"
            pagination={{
              current: data?.metadata?.currentPage ?? 1,
              pageSize: data?.metadata?.pageSize ?? 10,
              total: data?.metadata?.totalCount ?? 0,
              showSizeChanger: !isMobile,
              showTotal: (total) => tc('pagination.total', { total }),
              size: isMobile ? 'small' : undefined
            }}
            onChange={handleTableChange}
          />
        </Card>
      )}
    </div>
  )
}
