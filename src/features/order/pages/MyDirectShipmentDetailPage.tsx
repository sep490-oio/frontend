import { useParams, useNavigate, Link } from 'react-router'
import {
  Card,
  Descriptions,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  QRCode,
  Flex,
} from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useMyDirectShipment } from '@/features/order/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SERIF_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

/**
 * Buyer-facing read-only detail page for a direct shipment. Acts as the
 * QR-scan deep-link destination: renders the QR payload, tracking metadata,
 * status, and timestamps. All buyer mutations (acknowledge, accept, dispute)
 * stay on /me/orders/:id — this page is intentionally action-free.
 */
export default function MyDirectShipmentDetailPage() {
  const { shipmentId = '' } = useParams<{ shipmentId: string }>()
  const { t } = useTranslation(['order', 'common'])
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const { data: shipment, isLoading, error } = useMyDirectShipment(shipmentId)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !shipment) {
    return <Alert type="error" showIcon message={t('shipmentNotFound', 'Shipment not found')} />
  }

  const qrPayload = shipment.qrPayload || shipment.qrCodeUrl || shipment.internalTrackingCode

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px' }}>
      {(() => {
        const awaitingReceipt =
          shipment.status === 'delivered' && !shipment.buyerReceivedPackageAt
        return (
          <Space style={{ marginBottom: 16 }} wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate(-1); }}>
              {tc('action.back', 'Back')}
            </Button>
            {awaitingReceipt ? (
              <Link to={`/me/shipments/${shipment.id}/receive`}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                >
                  {t('directShipment.openOrderActions', 'Open Delivery Actions')}
                </Button>
              </Link>
            ) : (
              <Link to={`/me/orders/${shipment.orderId}`}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                >
                  {t('directShipment.openOrderActions', 'Open Delivery Actions')}
                </Button>
              </Link>
            )}
            <Button type="link" onClick={() => navigate('/me/shipments')}>
              {t('directShipment.viewAllMyShipments', 'View all my shipments')}
            </Button>
          </Space>
        )
      })()}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t(
          'directShipment.openOrderActionsHint',
          'Acknowledge, accept, or report an issue from the order page.',
        )}
        action={
          <Button 
            size="small" 
            icon={<QrcodeOutlined />} 
            onClick={() => navigate('/me/shipments/scan')}
          >
            {t('directShipment.scanParcelQr', 'Scan Parcel QR')}
          </Button>
        }
      />

      <Typography.Title level={2} style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>
        {t('directShipment.shipmentDetail', 'Shipment Detail')} #{shipment.shipmentIdDisplay}
      </Typography.Title>

      <Flex gap={16} wrap="wrap" align="flex-start">
        {/* QR card */}
        <Card style={{ width: 280 }}>
          <Flex vertical align="center" gap={12}>
            <QRCode value={qrPayload} size={220} />
            <Typography.Text
              copyable={{ text: qrPayload }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                wordBreak: 'break-all',
                textAlign: 'center',
              }}
            >
              {qrPayload}
            </Typography.Text>
          </Flex>
        </Card>

        {/* Details card */}
        <Card style={{ flex: '1 1 420px', minWidth: 320 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('statusLabel', 'Status')}>
              <StatusBadge status={shipment.status} />
            </Descriptions.Item>
            <Descriptions.Item
              label={t('directShipment.internalTracking', 'Internal Tracking')}
            >
              <Typography.Text copyable style={{ fontFamily: 'var(--font-mono)' }}>
                {shipment.internalTrackingCode}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('directShipment.externalCarrier', 'External Carrier')}>
              {shipment.externalCarrierName ?? (
                <Typography.Text type="secondary">
                  {t('notYetAvailable', 'Chưa có')}
                </Typography.Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('directShipment.externalTracking', 'External Tracking')}>
              {shipment.externalTrackingCode ?? (
                <Typography.Text type="secondary">
                  {t('notYetAvailable', 'Chưa có')}
                </Typography.Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('createdAt', 'Created')}>
              {formatDateTime(shipment.createdAt)}
            </Descriptions.Item>
            {shipment.deliveredAt && (
              <Descriptions.Item label={t('directShipment.deliveredAt', 'Delivered At')}>
                {formatDateTime(shipment.deliveredAt)}
              </Descriptions.Item>
            )}
            {shipment.buyerReceivedPackageAt && (
              <Descriptions.Item
                label={t('directShipment.buyerReceivedAt', 'Buyer Received At')}
              >
                {formatDateTime(shipment.buyerReceivedPackageAt)}
              </Descriptions.Item>
            )}
            {shipment.buyerAcceptedAt && (
              <Descriptions.Item
                label={t('directShipment.buyerAcceptedAt', 'Buyer Accepted At')}
              >
                {formatDateTime(shipment.buyerAcceptedAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Flex>
    </div>
  )
}
