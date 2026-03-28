import { Row, Col, Skeleton, Alert, Button, App } from 'antd'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  useInboundShipmentById,
  useCancelInbound,
  useSetExternalTracking,
  useInboundShipmentQr,
} from '@/features/warehouse/api'
import { ShipmentHeader } from '@/features/warehouse/components/ShipmentHeader'
import { ShipmentStepper } from '@/features/warehouse/components/ShipmentStepper'
import { ShipmentActionPanel } from '@/features/warehouse/components/ShipmentActionPanel'
import { ShipmentOverview } from '@/features/warehouse/components/ShipmentOverview'

export default function InboundDetailPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
  const isDesktop = !isMobile

  const { data: shipment, isLoading, error, refetch } = useInboundShipmentById(id ?? '')
  const cancelInbound = useCancelInbound()
  const setTracking = useSetExternalTracking()
  const { data: _qrData } = useInboundShipmentQr(id ?? '')

  const handleCancel = async () => {
    if (!id) return
    try {
      await cancelInbound.mutateAsync(id)
      message.success(t('cancelSuccess', 'Shipment cancelled'))
    } catch {
      message.error(t('cancelError', 'Failed to cancel shipment'))
    }
  }

  const handleSetTracking = async (trackingNumber: string) => {
    if (!id) return
    try {
      await setTracking.mutateAsync({ shipmentId: id, trackingNumber })
      message.success(t('trackingSet', 'Tracking number updated'))
    } catch {
      message.error(t('trackingError', 'Failed to update tracking number'))
    }
  }

  // Loading state — section skeletons
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 24 }} />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
            <Skeleton active paragraph={{ rows: 4 }} style={{ marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
          <Col xs={24} md={10}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Col>
        </Row>
      </div>
    )
  }

  // Error state
  if (error || !shipment) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
        <Alert
          type="error"
          showIcon
          message={t('shipmentNotFound', 'Shipment not found')}
          description={t('shipmentLoadError', 'Failed to load shipment details. Please try again.')}
          action={<Button size="small" onClick={() => refetch()}>{tc('action.retry', 'Retry')}</Button>}
        />
      </div>
    )
  }

  const actionPanel = (
    <ShipmentActionPanel
      shipmentId={id!}
      status={shipment.status}
      carrierTrackingNumber={shipment.carrierTrackingNumber}
      providerCode={shipment.providerCode}
      qrData={id ? `/api/warehouse/inbound-shipments/${id}/qr-code` : undefined}
      onCancel={handleCancel}
      onSetTracking={handleSetTracking}
      cancelLoading={cancelInbound.isPending}
      trackingLoading={setTracking.isPending}
    />
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 12px' : '0 16px' }}>
      <ShipmentHeader
        clientOrderCode={shipment.clientOrderCode}
        status={shipment.status}
        providerCode={shipment.providerCode}
        shipmentMode={shipment.shipmentMode}
        externalCarrierName={shipment.externalCarrierName}
        updatedAt={(shipment as any).updatedAt ?? shipment.createdAt}
      />

      {/* Mobile: action panel before stepper/content */}
      {!isDesktop && <div style={{ marginBottom: 16 }}>{actionPanel}</div>}

      <ShipmentStepper status={shipment.status} />

      <Row gutter={[24, 16]}>
        {/* Left: content sections */}
        <Col xs={24} md={14}>
          <ShipmentOverview shipment={shipment} />
        </Col>

        {/* Right: sticky action panel (desktop only) */}
        {isDesktop && (
          <Col md={10}>
            {actionPanel}
          </Col>
        )}
      </Row>
    </div>
  )
}
