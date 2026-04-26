import { useState } from 'react'
import { Button, Card, List, Flex, Pagination, Spin, Empty, Tabs, Typography, Tag } from 'antd'
import { EyeOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { useSellerDirectShipments } from '@/features/order/api'
import type { SellerDirectShipmentListItem } from '@/types'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SANS_FONT } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: 'draft', label: 'draft' },
  { key: 'carrier_booked', label: 'carrierBooked' },
  { key: 'picked_up', label: 'pickedUp' },
  { key: 'on_delivering', label: 'onDelivering' },
  { key: 'delivered', label: 'delivered' },
  { key: 'accepted', label: 'accepted' },
  { key: 'disputed', label: 'disputed' },
  { key: 'completed', label: 'completed' },
] as const

/**
 * Seller direct-ship shipments list.
 *
 * Lists every SellerDirectShipment owned by the current seller via the
 * dedicated seller-scoped endpoint. Row CTAs link to the detail page which
 * owns all progression actions (dispatch details, handover proofs, etc.).
 */
export default function SellerDirectShipmentsListPage() {
  const { t } = useTranslation(['order', 'common'])
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusKey, setStatusKey] = useState<string>('all')

  const status = statusKey === 'all' ? undefined : statusKey

  const { data, isLoading } = useSellerDirectShipments(
    { pageNumber: page, pageSize, status },
    { refetchInterval: 60000 },
  )

  const renderShipmentCard = (shipment: SellerDirectShipmentListItem) => {
    const recipient = shipment.recipient
    const hasRecipient = recipient && (recipient.recipientName || recipient.composedAddress)

    return (
      <Card
        key={shipment.shipmentId}
        style={{ 
          borderRadius: 16, 
          marginBottom: 16, 
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
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

          {hasRecipient && (
            <div
              style={{
                background: 'var(--color-bg-surface)',
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: SANS_FONT,
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {recipient?.recipientName ?? '—'}
                {recipient?.phoneNumber && (
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, fontWeight: 400 }}>
                    · {recipient.phoneNumber}
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                {recipient?.composedAddress ?? '—'}
              </div>
            </div>
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
              {shipment.orderNumber && (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
                >
                  · {shipment.orderNumber}
                </Typography.Text>
              )}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                · {shipment.internalTrackingCode}
              </Typography.Text>
              {shipment.externalCarrierName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {shipment.externalCarrierName}
                  {shipment.externalTrackingCode && ` / ${shipment.externalTrackingCode}`}
                </Typography.Text>
              )}
              {shipment.manualReviewRequired && (
                <Tag icon={<WarningOutlined />} color="warning">
                  {t('order:directShipment.manualReview.badge', 'Manual review')}
                </Tag>
              )}
            </Flex>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/seller/shipments/${shipment.shipmentId}`)}
            >
              {t('order:directShipment.viewShipment', 'View Shipment')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="oio-serif" style={{ fontWeight: 400, fontSize: isMobile ? 24 : 32, marginBottom: 16, color: 'var(--color-text-primary)' }}>
        {t('order:directShipment.sellerListTitle', 'Direct Shipments')}
      </h1>

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
        <Empty description={t('order:directShipment.noShipments', 'No direct shipments')} />
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
