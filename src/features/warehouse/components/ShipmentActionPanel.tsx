import { useState } from 'react'
import { Card, Button, Input, Popconfirm, Alert, Space, Typography } from 'antd'
import { CloseCircleOutlined, SendOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ShipmentStatus } from '@/types/enums'

interface ShipmentActionPanelProps {
  shipmentId: string
  status: string
  carrierTrackingNumber?: string
  providerCode?: string
  qrData?: string
  onCancel: () => Promise<void>
  onSetTracking: (trackingNumber: string) => Promise<void>
  cancelLoading: boolean
  trackingLoading: boolean
}

export function ShipmentActionPanel({
  status,
  carrierTrackingNumber,
  providerCode,
  qrData,
  onCancel,
  onSetTracking,
  cancelLoading,
  trackingLoading,
}: ShipmentActionPanelProps) {
  const { t } = useTranslation('warehouse')
  const [trackingInput, setTrackingInput] = useState(carrierTrackingNumber ?? '')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const canCancel = status === ShipmentStatus.AwaitingPickup
  const isExternal = providerCode === 'external'
  const canSetTracking = isExternal && (status === ShipmentStatus.AwaitingPickup || status === ShipmentStatus.InTransit)

  const handleCancel = async () => {
    await onCancel()
    setActionSuccess(t('cancelSuccess', 'Shipment cancelled successfully'))
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const handleSetTracking = async () => {
    if (!trackingInput.trim()) return
    await onSetTracking(trackingInput.trim())
    setActionSuccess(t('trackingSet', 'Tracking number updated'))
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const hasActions = canCancel || canSetTracking || !!qrData

  return (
    <div style={{ position: 'sticky', top: 24 }}>
      <Card title={t('actions', 'Actions')} size="small">
        {actionSuccess && (
          <Alert type="success" message={actionSuccess} showIcon style={{ marginBottom: 12 }} closable onClose={() => setActionSuccess(null)} />
        )}

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {/* Cancel */}
          {canCancel && (
            <Popconfirm
              title={t('cancelConfirm', 'Are you sure you want to cancel this shipment?')}
              onConfirm={handleCancel}
              okText={t('yes', 'Yes')}
              cancelText={t('no', 'No')}
              okButtonProps={{ danger: true }}
            >
              <Button block danger icon={<CloseCircleOutlined />} loading={cancelLoading}>
                {t('cancelShipment', 'Cancel Shipment')}
              </Button>
            </Popconfirm>
          )}

          {/* Tracking Number */}
          {canSetTracking && (
            <div>
              <Typography.Text style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {t('carrierTracking', 'Carrier Tracking Number')}
              </Typography.Text>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder={t('trackingNumberPlaceholder', 'Enter tracking number')}
                  size="small"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSetTracking}
                  loading={trackingLoading}
                  disabled={!trackingInput.trim()}
                  size="small"
                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                >
                  {t('update', 'Update')}
                </Button>
              </Space.Compact>
            </div>
          )}

          {/* QR Code */}
          {qrData && (
            <div style={{ textAlign: 'center' }}>
              <Typography.Text style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                {t('warehouseCheckin', 'Warehouse Check-in QR')}
              </Typography.Text>
              <img src={qrData} alt="QR Code" style={{ width: 160, height: 160, margin: '0 auto', display: 'block', borderRadius: 4 }} />
              <Button
                type="text"
                size="small"
                icon={<QrcodeOutlined />}
                style={{ marginTop: 8, fontSize: 12 }}
                onClick={() => window.open(qrData, '_blank')}
              >
                {t('enlargeQr', 'Enlarge')}
              </Button>
            </div>
          )}

          {!hasActions && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t('noActions', 'No actions available for this status.')}
            </Typography.Text>
          )}
        </Space>
      </Card>
    </div>
  )
}
