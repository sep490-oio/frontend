import { Row, Col, Skeleton, Alert, Button, App, Card, Typography, List, Tag, Space } from 'antd'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  useInboundShipmentById,
  useInboundShipments,
  useCancelInbound,
  useSetExternalTracking,
  useUpdateExternalStatus,
  useInboundShipmentQr,
} from '@/features/warehouse/api'
import { ShipmentHeader } from '@/features/warehouse/components/ShipmentHeader'
import { ShipmentStepper } from '@/features/warehouse/components/ShipmentStepper'
import { ShipmentActionPanel } from '@/features/warehouse/components/ShipmentActionPanel'
import { ShipmentOverview } from '@/features/warehouse/components/ShipmentOverview'
import { useItemById } from '@/features/item/api'

export default function InboundDetailPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { isMobile } = useBreakpoint()
  const isDesktop = !isMobile

  const { data: shipment, isLoading, error, refetch } = useInboundShipmentById(id ?? '')
  const cancelInbound = useCancelInbound()
  const setTracking = useSetExternalTracking()
  const updateStatus = useUpdateExternalStatus()
  const { data: qrCodeUrl } = useInboundShipmentQr(id ?? '')
  const { data: itemData } = useItemById(shipment?.itemId ?? '')

  // Fetch sibling shipments in the same package
  const { data: siblingsData } = useInboundShipments(
    shipment?.clientOrderCode ? { search: shipment.clientOrderCode, pageSize: 50 } : undefined,
  )
  const siblingShipments = shipment?.clientOrderCode
    ? (siblingsData?.items ?? []).filter((s) => s.id !== id)
    : []

  const handleCancel = async (reason?: string) => {
    if (!id) return
    try {
      await cancelInbound.mutateAsync({ id, reason })
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

  const handleAdvanceStatus = async (status: string) => {
    if (!id) return
    try {
      await updateStatus.mutateAsync({ shipmentId: id, status })
      message.success(t('statusAdvanced', 'Status updated'))
    } catch {
      message.error(t('statusError', 'Failed to update status'))
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
      qrData={qrCodeUrl}
      onCancel={handleCancel}
      onSetTracking={handleSetTracking}
      onAdvanceStatus={handleAdvanceStatus}
      cancelLoading={cancelInbound.isPending}
      trackingLoading={setTracking.isPending}
      advanceLoading={updateStatus.isPending}
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
          <ShipmentOverview
            shipment={shipment}
            itemInfo={itemData ? {
              title: itemData.title,
              imageUrl: (itemData.images?.find((m) => m.isPrimary) ?? itemData.images?.[0])?.url,
              condition: itemData.condition,
            } : undefined}
          />

          {/* Other items in this package */}
          {siblingShipments.length > 0 && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                {t('otherItemsInPackage', 'Other items in this package')} ({siblingShipments.length})
              </Typography.Text>
              <List
                size="small"
                dataSource={siblingShipments}
                renderItem={(s) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={() => navigate(`${prefix}/warehouse/inbound/${s.id}`)}
                  >
                    <Space>
                      <Typography.Text>{s.itemTitle ?? s.id.slice(0, 12)}</Typography.Text>
                      <StatusBadge status={s.status} size="small" />
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}
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
