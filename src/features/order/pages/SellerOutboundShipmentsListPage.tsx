import { useState } from 'react'
import { Button, Card, List, Flex, Pagination, Spin, Empty, Typography, Space } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import { useSellerOutboundShipments } from '@/features/order/api'
import type { SellerOutboundShipmentDto } from '@/features/order/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERIF_FONT, SANS_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

/**
 * Seller outbound shipments list.
 *
 * Uses the seller-safe `/me/orders/seller-direct-ship/outbound-shipments`
 * endpoint directly — never the warehouse-generic `useOutboundShipments` hook.
 * Card layout instead of table so product image + recipient info + CTAs get
 * reasonable real estate on both desktop and mobile.
 */
export default function SellerOutboundShipmentsListPage() {
  const { t } = useTranslation(['warehouse', 'common'])
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useSellerOutboundShipments(
    { pageNumber: page, pageSize },
    { refetchInterval: 60000 },
  )

  const renderShipmentCard = (shipment: SellerOutboundShipmentDto) => {
    const recipient = shipment.recipient
    const hasRecipient = recipient && (recipient.recipientName || recipient.composedAddress)

    return (
      <Card
        key={shipment.shipmentId}
        style={{ borderRadius: 10, marginBottom: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Flex vertical gap={12}>
          {/* Product */}
          {shipment.item && (
            <OrderItemSummary
              item={{
                itemId: shipment.item.itemId,
                auctionId: shipment.item.auctionId,
                itemTitle: shipment.item.itemTitle,
                primaryImageUrl: shipment.item.primaryImageUrl ?? undefined,
                startingPrice: shipment.item.finalPrice,
                finalPrice: shipment.item.finalPrice,
                currency: shipment.item.currency,
              }}
              variant="row"
            />
          )}

          {/* Recipient (compact) */}
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

          {/* Meta + actions */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex gap={8} align="center" wrap="wrap">
              <StatusBadge status={shipment.status} />
              {shipment.orderNumber && (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}
                >
                  {shipment.orderNumber}
                </Typography.Text>
              )}
              {shipment.providerDisplayName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {shipment.providerDisplayName}
                </Typography.Text>
              )}
              {shipment.carrierTrackingNumber && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {shipment.carrierTrackingNumber}
                </Typography.Text>
              )}
              {shipment.dispatchedAt && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {t('warehouse:dispatchedAt', 'Dispatched')}: {formatDateTime(shipment.dispatchedAt)}
                </Typography.Text>
              )}
              {shipment.deliveredAt && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  · {t('warehouse:deliveredAt', 'Delivered')}: {formatDateTime(shipment.deliveredAt)}
                </Typography.Text>
              )}
            </Flex>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/seller/warehouse/outbound/${shipment.shipmentId}`)}
            >
              {t('warehouse:viewShipment', 'View Shipment')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, margin: 0 }}>
          {t('warehouse:outboundShipments', 'Outbound Shipments')}
        </h1>
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty description={t('warehouse:noShipments', 'No outbound shipments yet')} />
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
