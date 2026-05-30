import { useState, useEffect } from 'react'
import { Button, Card, List, Flex, Pagination, Spin, Empty, Typography, Tag, Tooltip, Space, Input } from 'antd'
import { EyeOutlined, QrcodeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { useMyShipments } from '@/features/order/api'
import type { BuyerShipmentListItemDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERIF_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'
import { getServerNowMs } from '@/utils/time'

function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - getServerNowMs()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

function DecisionCountdown({ endsAt }: { endsAt: string }) {
  const [display, setDisplay] = useState(() => formatCountdown(endsAt))
  useEffect(() => {
    const interval = setInterval(() => setDisplay(formatCountdown(endsAt)), 60_000)
    return () => clearInterval(interval)
  }, [endsAt])
  const isExpired = new Date(endsAt).getTime() <= getServerNowMs()
  return (
    <Tooltip title={`Decision window ends: ${formatDateTime(endsAt)}`}>
      <Tag icon={<ClockCircleOutlined />} color={isExpired ? 'default' : 'warning'} style={{ fontSize: 12 }}>
        {display}
      </Tag>
    </Tooltip>
  )
}

/**
 * Unified buyer shipment list. Consumes `useMyShipments`, which merges
 * seller-direct and warehouse-booked outbound shipments into one feed.
 * Row-click routing is kind-aware:
 *   - seller_direct     → existing `/me/shipments/:shipmentId` detail.
 *   - warehouse_outbound → `/me/orders/:orderId` (order detail is already
 *     the authoritative surface for warehouse shipments).
 */
export default function MyDirectShipmentsListPage() {
  const { t } = useTranslation(['order', 'common'])
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState<string>('')

  const { data, isLoading } = useMyShipments(
    { pageNumber: page, pageSize, search: search || undefined },
    { refetchInterval: 60000 },
  )

  const openRow = (row: BuyerShipmentListItemDto) => {
    if (row.shipmentKind === 'seller_direct') {
      navigate(`/me/shipments/${row.shipmentId}`)
    } else {
      navigate(`/me/outbound-shipments/${row.shipmentId}`)
    }
  }

  const renderShipmentCard = (row: BuyerShipmentListItemDto) => {
    const kindLabel = row.shipmentKind === 'seller_direct'
      ? t('order:shipmentFeed.kindDirect', 'Direct')
      : t('order:shipmentFeed.kindWarehouse', 'Warehouse')
    const kindColor = row.shipmentKind === 'seller_direct' ? 'blue' : 'geekblue'
    return (
      <Card
        key={`${row.shipmentKind}:${row.shipmentId}`}
        style={{ borderRadius: 10, marginBottom: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Flex vertical gap={12}>
          <Flex gap={12} align="center" wrap="wrap">
            {row.itemImageUrl && (
              <img
                src={row.itemImageUrl}
                alt={row.itemTitle ?? ''}
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }}
              />
            )}
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text strong ellipsis style={{ fontSize: 15 }}>
                {row.itemTitle ?? row.orderNumber}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {row.orderNumber}
              </Typography.Text>
            </Flex>
          </Flex>

          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex gap={8} align="center" wrap="wrap">
              <Tag color={kindColor}>{kindLabel}</Tag>
              <StatusBadge status={row.status} />
              {row.carrierName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {row.carrierName}
                  {row.carrierTrackingNumber && ` / ${row.carrierTrackingNumber}`}
                </Typography.Text>
              )}
              {row.internalTrackingCode && (
                <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  · {row.internalTrackingCode}
                </Typography.Text>
              )}
              {row.decisionWindowEndsAt && (
                <DecisionCountdown endsAt={row.decisionWindowEndsAt} />
              )}
              {row.shipmentKind === 'warehouse_outbound' &&
                (row.status === 'delivered' || row.status === 'in_transit') && (
                  <Tag icon={<QrcodeOutlined />} color="cyan">
                    {t('order:shipmentFeed.scanQrToReceive', 'Scan QR to receive')}
                  </Tag>
                )}
            </Flex>
            <Flex gap={8} wrap="wrap">
              <Button icon={<EyeOutlined />} onClick={() => openRow(row)}>
                {t('order:shipmentFeed.viewShipment', 'View shipment')}
              </Button>
              <Button type="link" onClick={() => navigate(`/me/orders/${row.orderId}`)}>
                {t('order:viewOrder', 'View order')}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, margin: 0 }}>
          {t('order:shipmentFeed.title', 'My Shipments')}
        </h1>
        <Space>
          <Input.Search
            allowClear
            placeholder={t('order:shipmentFeed.searchPlaceholder', 'Search order / tracking / title')}
            onSearch={(v) => {
              setSearch(v)
              setPage(1)
            }}
            style={{ width: 280 }}
          />
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            size="large"
            onClick={() => navigate('/me/shipments/scan')}
          >
            {t('order:directShipment.scanParcelQr', 'Scan Parcel QR')}
          </Button>
        </Space>
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty description={t('order:shipmentFeed.empty', 'No shipments yet')} />
      ) : (
        <List dataSource={data.items} renderItem={renderShipmentCard} split={false} />
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <Pagination
          current={data?.metadata?.currentPage ?? page}
          pageSize={data?.metadata?.pageSize ?? pageSize}
          total={data?.metadata?.totalCount ?? 0}
          onChange={(p, ps) => {
            setPage(p)
            setPageSize(ps)
          }}
          showSizeChanger
        />
      </div>
    </div>
  )
}
