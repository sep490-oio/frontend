import { useState, useEffect } from 'react'
import { Button, Card, List, Flex, Pagination, Spin, Empty, Tabs, Typography, Tag, Tooltip, Space } from 'antd'
import { EyeOutlined, QrcodeOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { useMyDirectShipments } from '@/features/order/api'
import type { MyDirectShipmentListItem } from '@/types'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERIF_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: 'carrier_booked', label: 'carrierBooked' },
  { key: 'picked_up', label: 'pickedUp' },
  { key: 'on_delivering', label: 'onDelivering' },
  { key: 'delivered', label: 'delivered' },
  { key: 'accepted', label: 'accepted' },
  { key: 'disputed', label: 'disputed' },
  { key: 'completed', label: 'completed' },
] as const

function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - Date.now()
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
  const isExpired = new Date(endsAt).getTime() <= Date.now()
  return (
    <Tooltip title={`Decision window ends: ${formatDateTime(endsAt)}`}>
      <Tag icon={<ClockCircleOutlined />} color={isExpired ? 'default' : 'warning'} style={{ fontSize: 12 }}>
        {display}
      </Tag>
    </Tooltip>
  )
}

/**
 * Buyer-facing direct shipments list.
 *
 * Renders every SellerDirectShipment against the current buyer's orders.
 * Each card exposes action CTAs gated by the BE-computed flags
 * (canSubmitProofOfDelivery, canAccept, canDispute). A prominent
 * "Scan Parcel QR" button sits at the top of the page.
 */
export default function MyDirectShipmentsListPage() {
  const { t } = useTranslation(['order', 'common'])
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusKey, setStatusKey] = useState<string>('all')

  const status = statusKey === 'all' ? undefined : statusKey

  const { data, isLoading } = useMyDirectShipments(
    { pageNumber: page, pageSize, status },
    { refetchInterval: 60000 },
  )

  const renderShipmentCard = (shipment: MyDirectShipmentListItem) => {
    return (
      <Card
        key={shipment.shipmentId}
        style={{ borderRadius: 10, marginBottom: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Flex vertical gap={12}>
          {shipment.item && (
            <OrderItemSummary
              item={{
                itemId: shipment.item.itemId,
                auctionId: '',
                itemTitle: shipment.item.itemTitle,
                primaryImageUrl: shipment.item.primaryImageUrl ?? undefined,
                startingPrice: shipment.item.finalPrice,
                finalPrice: shipment.item.finalPrice,
                currency: shipment.item.currency,
              }}
              variant="row"
            />
          )}

          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex gap={8} align="center" wrap="wrap">
              <StatusBadge status={shipment.status} />
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
              >
                {shipment.shipmentIdDisplay}
              </Typography.Text>
              {shipment.sellerDisplayName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {shipment.sellerDisplayName}
                </Typography.Text>
              )}
              {shipment.externalCarrierName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {shipment.externalCarrierName}
                  {shipment.externalTrackingCode && ` / ${shipment.externalTrackingCode}`}
                </Typography.Text>
              )}
              {shipment.sellerDeclaredShippedAt && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {t('order:directShipment.shippedAt', 'Shipped')}: {formatDateTime(shipment.sellerDeclaredShippedAt)}
                </Typography.Text>
              )}
              {shipment.deliveredAt && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {t('order:directShipment.deliveredAt', 'Delivered')}: {formatDateTime(shipment.deliveredAt)}
                </Typography.Text>
              )}
              {shipment.manualReviewRequired && (
                <Tag icon={<WarningOutlined />} color="warning">
                  {t('order:directShipment.manualReview.badge', 'Manual review')}
                </Tag>
              )}
              {shipment.decisionWindowEndsAt && !shipment.buyerAcceptedAt && (
                <DecisionCountdown endsAt={shipment.decisionWindowEndsAt} />
              )}
            </Flex>
            <Flex gap={8} wrap="wrap">
              {shipment.canSubmitProofOfDelivery && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => navigate(`/me/shipments/${shipment.shipmentId}/receive`)}
                >
                  {t('order:directShipment.openDeliveryActions', 'Open Delivery Actions')}
                </Button>
              )}
              <Button
                icon={<EyeOutlined />}
                onClick={() => navigate(`/me/shipments/${shipment.shipmentId}`)}
              >
                {t('order:directShipment.viewShipment', 'View Shipment')}
              </Button>
              <Button onClick={() => navigate(`/me/orders/${shipment.orderId}`)}>
                {t('order:viewOrder', 'View Order')}
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
          {t('order:directShipment.buyerListTitle', 'My Shipments')}
        </h1>
        <Button
          type="primary"
          icon={<QrcodeOutlined />}
          size="large"
          onClick={() => navigate('/me/shipments/scan')}
        >
          {t('order:directShipment.scanParcelQr', 'Scan Parcel QR')}
        </Button>
      </Space>

      <Tabs
        activeKey={statusKey}
        onChange={(k) => {
          setStatusKey(k)
          setPage(1)
        }}
        items={STATUS_TABS.map((s) => ({
          key: s.key,
          label: t(`order:directShipment.status.${s.label}`, s.label),
        }))}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty description={t('order:directShipment.noShipments', 'No shipments yet')} />
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
