import { useState } from 'react'
import { Typography, Button, Space, Tabs, Tag, Table } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useInboundPackages } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { InboundPackageDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: 'awaiting_pickup', label: 'awaitingPickup' },
  { key: 'in_transit', label: 'inTransit' },
  { key: 'seller_claims_arrived', label: 'sellerClaimsArrived' },
  { key: 'received', label: 'received' },
  { key: 'stored', label: 'stored' },
  { key: 'inspected', label: 'inspected' },
  { key: 'cancelled', label: 'cancelled' },
] as const

export default function InboundShipmentsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { isMobile } = useBreakpoint()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { packageState: statusFilter } : {}),
  }

  const { data, isLoading } = useInboundPackages(params)

  const gotoPackage = (code: string) =>
    navigate(`${prefix}/warehouse/inbound/packages/${encodeURIComponent(code)}`)

  const columns: ColumnsType<InboundPackageDto> = [
    {
      title: t('tracking', 'Tracking'),
      key: 'tracking',
      render: (_: unknown, r) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => gotoPackage(r.clientOrderCode)}>
          {r.carrierTrackingNumber || r.clientOrderCode}
        </Button>
      ),
    },
    {
      title: t('provider', 'Provider'),
      dataIndex: 'providerCode',
      key: 'providerCode',
      width: 140,
      render: (code: string) => getProviderLabel(code),
    },
    {
      title: t('items', 'Items'),
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 90,
      render: (n: number) => <Tag color="blue">{n}</Tag>,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'displayStatus',
      key: 'displayStatus',
      width: 160,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d: string) => formatDateTime(d),
    },
    {
      title: t('shippingFee', 'Fee'),
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 110,
      render: (fee?: number) => (fee != null ? formatCurrency(fee) : '—'),
    },
    {
      title: tc('actions', 'Actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, r) => (
        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => gotoPackage(r.clientOrderCode)} />
      ),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} className="oio-serif" style={{ margin: 0, fontWeight: 400, fontSize: isMobile ? 24 : 32 }}>
          {t('inboundPackages', 'Inbound Packages')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${prefix}/warehouse/inbound/book`)}>
          {t('bookInbound', 'Book Inbound')}
        </Button>
      </Space>

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key)
          setPage(1)
        }}
        items={STATUS_TABS.map((tab) => ({
          key: tab.key,
          label: t(`statusTab.${tab.label}`, tab.label.charAt(0).toUpperCase() + tab.label.slice(1)),
        }))}
      />

      <Table<InboundPackageDto>
        rowKey="clientOrderCode"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement
            if (target.closest('button')) return
            gotoPackage(record.clientOrderCode)
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
    </div>
  )
}
