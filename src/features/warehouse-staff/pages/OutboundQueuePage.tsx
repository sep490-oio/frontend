import { useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Avatar,
  Flex,
  Empty,
} from 'antd'
import { SendOutlined, PictureOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'

import { useWarehouseStaffOutboundQueue } from '@/features/warehouse/api'
import type { WarehouseStaffOutboundQueueItemDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SANS_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

export default function OutboundQueuePage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading } = useWarehouseStaffOutboundQueue({ pageNumber: page, pageSize })

  const columns: ColumnsType<WarehouseStaffOutboundQueueItemDto> = [
    {
      title: t('staffOutboundQueue.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, record: WarehouseStaffOutboundQueueItemDto) => (
        <Flex align="center" gap={12}>
          <Avatar
            shape="square"
            size={48}
            src={record.itemPrimaryImageUrl ?? undefined}
            icon={!record.itemPrimaryImageUrl ? <PictureOutlined /> : undefined}
            style={{ flexShrink: 0, borderRadius: 6 }}
          />
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {record.itemTitle}
          </span>
        </Flex>
      ),
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('staffOutboundQueue.title', 'Outbound Queue')}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontFamily: SANS_FONT, fontSize: 13 }}>
          {t('staffOutboundQueue.subtitle', 'Orders ready to be packed and shipped from warehouse')}
        </Typography.Text>
      </div>

      <Table<WarehouseStaffOutboundQueueItemDto>
        rowKey="orderId"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        locale={{
          emptyText: (
            <Empty
              description={t('staffOutboundQueue.empty', 'No orders pending outbound')}
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
    </div>
  )
}
