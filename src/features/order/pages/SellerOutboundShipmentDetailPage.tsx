import { useParams, useNavigate } from 'react-router'
import { Card, Descriptions, Spin, Alert, Button, Space, Typography, Timeline } from 'antd'
import { ArrowLeftOutlined, LinkOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { useSellerOutboundShipmentById } from '@/features/order/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERIF_FONT, SANS_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

/**
 * Seller outbound shipment detail page.
 *
 * Reads from the seller-safe endpoint which returns a rich DTO with product,
 * recipient, and order context — never from the warehouse-generic read hook.
 *
 * i18n: uses explicit namespace:key form everywhere so `t('status')` never
 * collides with any enum map that resolves to an object.
 */
export default function SellerOutboundShipmentDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['warehouse', 'common'])

  const { data: shipment, isLoading, error } = useSellerOutboundShipmentById(id)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/seller/warehouse/outbound')
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('common:action.back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="error"
          showIcon
          message={t('warehouse:shipmentNotFound', 'Shipment not found or you do not have access to it.')}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('common:action.back', 'Back')}
        </Button>
      </Space>

      <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, marginBottom: 16 }}>
        {t('warehouse:outboundShipment', 'Outbound Shipment')}
      </h1>

      {/* Product block — top of the page */}
      {shipment.item && (
        <Card style={{ marginBottom: 16 }}>
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
            variant="card"
            linkToAuction
          />
        </Card>
      )}

      {/* Recipient block */}
      {shipment.recipient && (
        <Card title={t('warehouse:recipient', 'Recipient')} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: SANS_FONT, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {shipment.recipient.recipientName ?? '—'}
              {shipment.recipient.phoneNumber && (
                <span style={{ color: 'var(--color-text-secondary)', marginLeft: 12, fontWeight: 400 }}>
                  · {shipment.recipient.phoneNumber}
                </span>
              )}
            </div>
            <div style={{ color: 'var(--color-text-secondary)' }}>
              {shipment.recipient.composedAddress ?? '—'}
            </div>
          </div>
        </Card>
      )}

      {/* Shipment metadata block */}
      <Card title={t('warehouse:shipmentDetails', 'Shipment Details')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('warehouse:orderNumber', 'Order Number')}>
            <Button
              type="link"
              icon={<LinkOutlined />}
              style={{ padding: 0, fontFamily: 'var(--font-mono)' }}
              onClick={() => navigate(`/seller/orders/${shipment.orderId}`)}
            >
              {shipment.orderNumber || shipment.orderId.slice(0, 8)}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label={t('common:tableHeader.status', 'Status')}>
            <StatusBadge status={shipment.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouse:provider', 'Provider')}>
            {shipment.providerDisplayName ?? shipment.providerCode ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouse:shipmentMode', 'Shipment Mode')}>
            {shipment.shipmentMode}
          </Descriptions.Item>
          {shipment.carrierTrackingNumber && (
            <Descriptions.Item label={t('warehouse:trackingNumber', 'Tracking Number')} span={2}>
              <Typography.Text copyable>{shipment.carrierTrackingNumber}</Typography.Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t('warehouse:shipmentId', 'Shipment ID')} span={2}>
            <Typography.Text
              copyable
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)' }}
            >
              {shipment.shipmentId}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('common:tableHeader.createdAt', 'Created At')}>
            {formatDateTime(shipment.createdAt)}
          </Descriptions.Item>
          {shipment.packedAt && (
            <Descriptions.Item label={t('warehouse:packedAt', 'Packed At')}>
              {formatDateTime(shipment.packedAt)}
            </Descriptions.Item>
          )}
          {shipment.dispatchedAt && (
            <Descriptions.Item label={t('warehouse:dispatchedAt', 'Dispatched')}>
              {formatDateTime(shipment.dispatchedAt)}
            </Descriptions.Item>
          )}
          {shipment.deliveredAt && (
            <Descriptions.Item label={t('warehouse:deliveredAt', 'Delivered')}>
              {formatDateTime(shipment.deliveredAt)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Tracking events timeline */}
      {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
        <Card title={t('warehouse:trackingTimeline', 'Tracking Timeline')} style={{ marginBottom: 16 }}>
          <Timeline
            items={shipment.trackingEvents.map((ev) => ({
              children: (
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <StatusBadge status={ev.status} size="small" />
                  </div>
                  {ev.description && (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {ev.description}
                    </div>
                  )}
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {formatDateTime(ev.occurredAt)}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      )}
    </div>
  )
}
