import { useState } from 'react'
import { Card, Button, Input, Popconfirm, Alert, Space, Typography } from 'antd'
import { CloseCircleOutlined, SendOutlined, QrcodeOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ShipmentStatus } from '@/types/enums'

// Seller: AwaitingPickup→InTransit, InTransit→SellerClaimsArrived
const SELLER_NEXT_STATUS: Partial<Record<string, string>> = {
  [ShipmentStatus.AwaitingPickup]: ShipmentStatus.InTransit,
  [ShipmentStatus.InTransit]: ShipmentStatus.SellerClaimsArrived,
}
const SELLER_NEXT_LABEL: Partial<Record<string, string>> = {
  [ShipmentStatus.AwaitingPickup]: 'Mark as In Transit',
  [ShipmentStatus.InTransit]: 'Mark as Arrived',
}

// Staff: AwaitingPickup→InTransit, InTransit→Arrived, SellerClaimsArrived→Arrived
const STAFF_NEXT_STATUS: Partial<Record<string, string>> = {
  [ShipmentStatus.AwaitingPickup]: ShipmentStatus.InTransit,
  [ShipmentStatus.InTransit]: ShipmentStatus.Arrived,
  [ShipmentStatus.SellerClaimsArrived]: ShipmentStatus.Arrived,
}
const STAFF_NEXT_LABEL: Partial<Record<string, string>> = {
  [ShipmentStatus.AwaitingPickup]: 'Mark as In Transit',
  [ShipmentStatus.InTransit]: 'Confirm Arrival',
  [ShipmentStatus.SellerClaimsArrived]: 'Confirm Arrival',
}

interface ShipmentActionPanelProps {
  shipmentId: string
  status: string
  carrierTrackingNumber?: string
  providerCode?: string
  qrData?: string
  isStaff?: boolean
  onCancel: (reason?: string) => Promise<void>
  onSetTracking: (trackingNumber: string) => Promise<void>
  onAdvanceStatus?: (status: string) => Promise<void>
  cancelLoading: boolean
  trackingLoading: boolean
  advanceLoading?: boolean
}

export function ShipmentActionPanel({
  status,
  carrierTrackingNumber,
  providerCode,
  qrData,
  isStaff = false,
  onCancel,
  onSetTracking,
  onAdvanceStatus,
  cancelLoading,
  trackingLoading,
  advanceLoading,
}: ShipmentActionPanelProps) {
  const { t } = useTranslation('warehouse')
  const [trackingInput, setTrackingInput] = useState(carrierTrackingNumber ?? '')
  const [cancelReason, setCancelReason] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const canCancel = status === ShipmentStatus.AwaitingPickup
  const isExternal = providerCode === 'external'
  const canSetTracking = isExternal && (status === ShipmentStatus.AwaitingPickup || status === ShipmentStatus.InTransit)
  const nextStatusMap = isStaff ? STAFF_NEXT_STATUS : SELLER_NEXT_STATUS
  const nextLabelMap = isStaff ? STAFF_NEXT_LABEL : SELLER_NEXT_LABEL
  const nextStatus = isExternal ? nextStatusMap[status] : undefined
  const canAdvance = isExternal && !!nextStatus && !!onAdvanceStatus

  const showSuccess = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const handleCancel = async () => {
    await onCancel(cancelReason.trim() || undefined)
    setCancelReason('')
    showSuccess(t('cancelSuccess', 'Shipment cancelled successfully'))
  }

  const handleSetTracking = async () => {
    if (!trackingInput.trim()) return
    await onSetTracking(trackingInput.trim())
    showSuccess(t('trackingSet', 'Tracking number updated'))
  }

  const handleAdvance = async () => {
    if (!nextStatus || !onAdvanceStatus) return
    await onAdvanceStatus(nextStatus)
    showSuccess(t('statusAdvanced', 'Status updated'))
  }

  const hasActions = canCancel || canSetTracking || canAdvance || !!qrData

  return (
    <div style={{ position: 'sticky', top: 'var(--navbar-offset-desktop)' }}>
      <Card 
        title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 18 }}>{t('actions', 'Actions')}</span>} 
        size="small"
        style={{
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {actionSuccess && (
          <Alert type="success" message={actionSuccess} showIcon style={{ marginBottom: 12 }} closable onClose={() => setActionSuccess(null)} />
        )}

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {/* Cancel */}
          {canCancel && (
            <div>
              <Input.TextArea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('cancelReasonPlaceholder', 'Reason for cancellation (optional)')}
                rows={2}
                style={{ marginBottom: 8 }}
              />
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
            </div>
          )}

          {/* Tracking Number (external only) */}
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

          {/* Manual Status Advance (external only) */}
          {canAdvance && (
            <Popconfirm
              title={t('advanceConfirm', 'Advance shipment status?')}
              onConfirm={handleAdvance}
              okText={t('yes', 'Yes')}
              cancelText={t('no', 'No')}
            >
              <Button
                block
                type="primary"
                icon={<ArrowRightOutlined />}
                loading={advanceLoading}
                style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
              >
                {t(`advanceTo.${nextStatus}`, nextLabelMap[status] ?? 'Advance')}
              </Button>
            </Popconfirm>
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
