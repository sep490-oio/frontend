import { useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Avatar,
  Flex,
  Empty,
  Tabs,
  Tag,
} from 'antd'
import { SendOutlined, PictureOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'

import {
  useWarehouseStaffOutboundQueue,
  useStaffOutboundShipments,
} from '@/features/warehouse/api'
import type {
  WarehouseStaffOutboundQueueItemDto,
  WarehouseStaffOutboundShipmentListItemDto,
} from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SANS_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

function ReadyToBookTab() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading } = useWarehouseStaffOutboundQueue({ pageNumber: page, pageSize })

  const columns: ColumnsType<WarehouseStaffOutboundQueueItemDto> = [
    {
      title: t('staffOutboundQueue.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, record: WarehouseStaffOutboundQueueItemDto) => {
        const loc = record.storageLocationLabel
        return (
          <Flex align="center" gap={12}>
            <Avatar
              shape="square"
              size={48}
              src={record.itemPrimaryImageUrl ?? undefined}
              icon={!record.itemPrimaryImageUrl ? <PictureOutlined /> : undefined}
              style={{ flexShrink: 0, borderRadius: 6 }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                {record.itemTitle}
              </div>
              {loc && (
                <div style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {loc}
                </div>
              )}
              <Link
                to={`/warehouse-staff/items/${record.warehouseItemId}`}
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: SANS_FONT, fontSize: 11 }}
              >
                {t('staffOutboundQueue.viewInWarehouse', 'View in warehouse')}
              </Link>
            </div>
          </Flex>
        )
      },
    },
    {
      title: t('staffOutboundQueue.columns.buyer', 'Buyer'),
      key: 'buyer',
      render: (_: unknown, record: WarehouseStaffOutboundQueueItemDto) => (
        <div style={{ fontFamily: SANS_FONT, fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>{record.buyerRecipientName ?? '—'}</div>
          {record.buyerShippingAddress && (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
              {record.buyerShippingAddress}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('staffOutboundQueue.columns.seller', 'Seller'),
      dataIndex: 'sellerDisplayName',
      key: 'seller',
      render: (name: string | null) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 13 }}>{name ?? '—'}</span>
      ),
    },
    {
      title: t('staffOutboundQueue.columns.orderNumber', 'Order'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {orderNumber}
        </Typography.Text>
      ),
    },
    {
      title: t('staffOutboundQueue.columns.status', 'Status'),
      dataIndex: 'orderStatus',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('staffOutboundQueue.columns.paidAt', 'Paid At'),
      dataIndex: 'orderPaidAt',
      key: 'paidAt',
      render: (date: string | null) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {date ? formatDateTime(date) : '—'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: WarehouseStaffOutboundQueueItemDto) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => navigate(`/warehouse-staff/outbound/${record.orderId}`)}
          >
            {t('staffOutboundQueue.bookOutbound', 'Book Outbound')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Table<WarehouseStaffOutboundQueueItemDto>
      rowKey="orderId"
      columns={columns}
      dataSource={data?.items ?? []}
      loading={isLoading}
      locale={{
        emptyText: (
          <Empty
            description={t('staffOutboundQueue.empty', 'No orders waiting for outbound booking.')}
          />
        ),
      }}
      pagination={{
        current: data?.metadata?.currentPage ?? page,
        pageSize: data?.metadata?.pageSize ?? pageSize,
        total: data?.metadata?.totalCount ?? 0,
        showSizeChanger: true,
        onChange: (p, ps) => {
          setPage(p)
          setPageSize(ps)
        },
      }}
    />
  )
}

function BookedShipmentsTab() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading } = useStaffOutboundShipments({ pageNumber: page, pageSize })

  const columns: ColumnsType<WarehouseStaffOutboundShipmentListItemDto> = [
    {
      title: t('staffOutboundShipments.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, record) => (
        <Flex align="center" gap={12}>
          <Avatar
            shape="square"
            size={48}
            src={record.itemPrimaryImageUrl ?? undefined}
            icon={!record.itemPrimaryImageUrl ? <PictureOutlined /> : undefined}
            style={{ flexShrink: 0, borderRadius: 6 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SANS_FONT, fontSize: 13, fontWeight: 500 }}>
              {record.itemTitle ?? '—'}
            </div>
            {record.storageLocationLabel && (
              <div style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {record.storageLocationLabel}
              </div>
            )}
          </div>
        </Flex>
      ),
    },
    {
      title: t('staffOutboundShipments.columns.orderNumber', 'Order'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {orderNumber || '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('staffOutboundShipments.columns.shipmentMode', 'Mode'),
      dataIndex: 'shipmentMode',
      key: 'shipmentMode',
      render: (mode: string) => (
        <Tag color={mode === 'external_carrier' ? 'orange' : 'blue'}>
          {mode === 'external_carrier'
            ? t('staffOutboundShipments.modeExternal', 'External')
            : t('staffOutboundShipments.modePlatform', 'Platform')}
        </Tag>
      ),
    },
    {
      title: t('staffOutboundShipments.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('staffOutboundShipments.columns.carrier', 'Carrier / Tracking'),
      key: 'carrier',
      render: (_: unknown, record) => (
        <div style={{ fontFamily: SANS_FONT, fontSize: 12 }}>
          <div>{record.externalCarrierName ?? record.providerCode}</div>
          {record.carrierTrackingNumber && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              {record.carrierTrackingNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('staffOutboundShipments.columns.createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {date ? formatDateTime(date) : '—'}
        </span>
      ),
    },
  ]

  return (
    <Table<WarehouseStaffOutboundShipmentListItemDto>
      rowKey="shipmentId"
      columns={columns}
      dataSource={data?.items ?? []}
      loading={isLoading}
      onRow={(record) => ({
        onClick: () => navigate(`/warehouse-staff/outbound/shipments/${record.shipmentId}`),
        style: { cursor: 'pointer' },
      })}
      locale={{
        emptyText: (
          <Empty
            description={t('staffOutboundShipments.empty', 'No booked shipments yet.')}
          />
        ),
      }}
      pagination={{
        current: data?.metadata?.currentPage ?? page,
        pageSize: data?.metadata?.pageSize ?? pageSize,
        total: data?.metadata?.totalCount ?? 0,
        showSizeChanger: true,
        onChange: (p, ps) => {
          setPage(p)
          setPageSize(ps)
        },
      }}
    />
  )
}

export default function OutboundQueuePage() {
  const { t } = useTranslation('warehouse')
  const [activeTab, setActiveTab] = useState<'ready' | 'booked'>('ready')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('staffOutboundQueue.title', 'Outbound Queue')}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontFamily: SANS_FONT, fontSize: 13 }}>
          {t('staffOutboundQueue.subtitle', 'Orders ready to be packed and shipped from warehouse')}
        </Typography.Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'ready' | 'booked')}
        items={[
          {
            key: 'ready',
            label: t('staffOutboundQueue.tabs.ready', 'Ready to Book'),
            children: <ReadyToBookTab />,
          },
          {
            key: 'booked',
            label: t('staffOutboundQueue.tabs.booked', 'Booked Shipments'),
            children: <BookedShipmentsTab />,
          },
        ]}
      />
    </div>
  )
}
