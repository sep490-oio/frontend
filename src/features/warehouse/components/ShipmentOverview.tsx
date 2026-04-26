import { Card, Typography, Timeline, Flex, Button, App } from 'antd'
import { CopyOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel, getModeLabel, formatWeight } from '../utils/shipmentLabels'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

interface TrackingEvent {
  status?: string
  location?: string
  timestamp?: string
  notes?: string
  eventTime?: string
  normalizedStatus?: string
  reasonDescription?: string
}

interface ItemInfo {
  title: string
  imageUrl?: string
  condition?: string
}

interface ShipmentOverviewProps {
  itemInfo?: ItemInfo
  shipment: {
    clientOrderCode: string
    itemId?: string
    providerCode?: string
    shipmentMode?: string
    carrierTrackingNumber?: string
    shippingFee?: number
    insuranceValue?: number
    createdAt: string
    updatedAt?: string
    expectedArrivalAt?: string
    arrivedAt?: string
    senderName?: string
    senderPhone?: string
    senderAddress?: string
    senderWard?: string
    senderDistrict?: string
    senderProvince?: string
    weightGrams?: number
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    notes?: string
    trackingEvents: TrackingEvent[]
  }
  currency?: string
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <Flex justify="space-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>{label}</Typography.Text>
      <Typography.Text style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value}</Typography.Text>
    </Flex>
  )
}

export function ShipmentOverview({ shipment, itemInfo, currency = 'VND' }: ShipmentOverviewProps) {
  const { t } = useTranslation('warehouse')
  const { message } = App.useApp()

  const fullAddress = [shipment.senderAddress, shipment.senderWard, shipment.senderDistrict, shipment.senderProvince]
    .filter(Boolean)
    .join(', ')

  const dimensionsText = [shipment.lengthCm, shipment.widthCm, shipment.heightCm]
    .filter((v) => v != null)
    .map((v) => `${v}cm`)
    .join(' × ')

  return (
    <>
      {/* Item Info */}
      {itemInfo && (
        <Card 
          title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 16 }}>{t('overview.itemInfo', 'Item Information')}</span>} 
          size="small" 
          style={{ 
            marginBottom: 16,
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            borderRadius: 24,
            border: '1px solid var(--color-border)',
          }}
        >
          <Flex gap={12} align="start">
            {itemInfo.imageUrl && (
              <img
                src={itemInfo.imageUrl}
                alt={itemInfo.title}
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
              />
            )}
            <Flex vertical gap={4} style={{ flex: 1 }}>
              <Typography.Text strong style={{ fontSize: 14 }}>{itemInfo.title}</Typography.Text>
              {itemInfo.condition && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('overview.declaredCondition', 'Declared condition')}: {itemInfo.condition}
                </Typography.Text>
              )}
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Overview */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 12,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
        }}
      >
        <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
          {t('overview', 'Overview')}
        </Typography.Text>
        <StatRow label={t('provider', 'Carrier')} value={getProviderLabel(shipment.providerCode)} />
        <StatRow label={t('shipmentMode', 'Mode')} value={getModeLabel(shipment.shipmentMode)} />
        {shipment.carrierTrackingNumber && (
          <StatRow label={t('trackingNumber', 'Tracking')} value={shipment.carrierTrackingNumber} />
        )}
        <StatRow label={t('shippingFee', 'Shipping Fee')} value={formatCurrency(shipment.shippingFee ?? 0, currency)} />
        <StatRow label={t('insuranceValue', 'Insurance')} value={formatCurrency(shipment.insuranceValue ?? 0, currency)} />
        <StatRow label={t('created', 'Created')} value={formatDateTime(shipment.createdAt)} />
        {shipment.expectedArrivalAt && (
          <StatRow label={t('expectedArrival', 'ETA')} value={formatDateTime(shipment.expectedArrivalAt)} />
        )}
        {shipment.arrivedAt && (
          <StatRow label={t('arrivedAt', 'Arrived')} value={formatDateTime(shipment.arrivedAt)} />
        )}
        {shipment.itemId && (
          <StatRow
            label={t('itemRef', 'Item Ref')}
            value={
              <Flex align="center" gap={4}>
                <span style={{ fontFamily: MONO_FONT, fontSize: 11 }}>{shipment.itemId}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{ fontSize: 11 }} />}
                  onClick={() => { void navigator.clipboard.writeText(shipment.itemId!); message.success('Copied') }}
                  style={{ padding: 0, height: 16, width: 16 }}
                />
              </Flex>
            }
          />
        )}
      </Card>

      {/* Sender & Pickup */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 12,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
        }}
      >
        <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
          {t('senderInfo', 'Sender & Pickup')}
        </Typography.Text>
        {shipment.senderName && (
          <Flex align="center" gap={8} style={{ marginBottom: 6, fontSize: 13 }}>
            <UserOutlined style={{ color: 'var(--color-text-secondary)' }} />
            <span>{shipment.senderName}</span>
          </Flex>
        )}
        {shipment.senderPhone && (
          <Flex align="center" gap={8} style={{ marginBottom: 6, fontSize: 13 }}>
            <PhoneOutlined style={{ color: 'var(--color-text-secondary)' }} />
            <span>{shipment.senderPhone}</span>
          </Flex>
        )}
        {fullAddress && (
          <Flex align="start" gap={8} style={{ fontSize: 13 }}>
            <EnvironmentOutlined style={{ color: 'var(--color-text-secondary)', marginTop: 2 }} />
            <span>{fullAddress}</span>
          </Flex>
        )}
      </Card>

      {/* Package */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 12,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
        }}
      >
        <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
          {t('package', 'Package')}
        </Typography.Text>
        <Flex gap={24}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{t('weight', 'Weight')}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 16 }}>{formatWeight(shipment.weightGrams)}</Typography.Text>
          </div>
          {dimensionsText && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{t('dimensions', 'Dimensions')}</Typography.Text>
              <Typography.Text strong style={{ fontSize: 16 }}>{dimensionsText}</Typography.Text>
            </div>
          )}
        </Flex>
        {shipment.notes && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {t('notes', 'Notes')}: {shipment.notes}
          </Typography.Text>
        )}
      </Card>

      {/* Activity Timeline */}
      <Card 
        size="small"
        style={{ 
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
        }}
      >
        <Typography.Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
          {t('activity', 'Activity')}
        </Typography.Text>
        {shipment.trackingEvents.length > 0 ? (
          <Timeline
            items={shipment.trackingEvents.map((event) => ({
              children: (
                <div>
                  <StatusBadge status={event.normalizedStatus ?? event.status ?? 'unknown'} size="small" />
                  {event.location && <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{event.location}</Typography.Text>}
                  {(event.eventTime || event.timestamp) && <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{formatDateTime(event.eventTime ?? event.timestamp ?? '')}</Typography.Text>}
                  {(event.notes || event.reasonDescription) && <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{event.notes ?? event.reasonDescription}</Typography.Text>}
                </div>
              ),
            }))}
          />
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('noTrackingYet', 'Shipment has been booked but no carrier updates yet.')}
          </Typography.Text>
        )}
      </Card>
    </>
  )
}
