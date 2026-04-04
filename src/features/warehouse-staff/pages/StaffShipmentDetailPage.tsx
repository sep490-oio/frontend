import { Row, Col, Spin, Alert, Button, App, Flex } from 'antd'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
// ArrowLeftOutlined removed — back button is in ShipmentHeader
import {
  useInboundShipmentById,
  useUpdateExternalStatus,
} from '@/features/warehouse/api'
import { useItemById } from '@/features/item/api'
import { ShipmentHeader } from '@/features/warehouse/components/ShipmentHeader'
import { ShipmentStepper } from '@/features/warehouse/components/ShipmentStepper'
import { ShipmentOverview } from '@/features/warehouse/components/ShipmentOverview'

export default function StaffShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { message } = App.useApp()

  const { data: shipment, isLoading, error } = useInboundShipmentById(id ?? '')
  const updateStatus = useUpdateExternalStatus()
  const { data: itemData } = useItemById(shipment?.itemId ?? '')

  const isExternal = shipment?.providerCode === 'external'
  const canConfirmArrival =
    isExternal &&
    (shipment?.status === 'awaiting_pickup' || shipment?.status === 'in_transit' || shipment?.status === 'seller_claims_arrived')

  const handleConfirmArrival = () => {
    if (!id) return
    updateStatus.mutate(
      { shipmentId: id, status: 'arrived' },
      {
        onSuccess: () => {
          message.success(t('scan.arrivalConfirmed', 'Arrival confirmed'))
        },
        onError: () => {
          message.error(t('scan.arrivalError', 'Failed to confirm arrival'))
        },
      },
    )
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 300 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (error || !shipment) {
    return (
      <Alert
        type="error"
        message={t('error.notFound', 'Shipment not found')}
        description={t('error.notFoundDesc', 'The shipment could not be loaded.')}
        showIcon
      />
    )
  }

  return (
    <div>
      <ShipmentHeader
        clientOrderCode={shipment.clientOrderCode}
        status={shipment.status}
        providerCode={shipment.providerCode}
        shipmentMode={shipment.shipmentMode}
        externalCarrierName={shipment.externalCarrierName}
        updatedAt={shipment.updatedAt}
        backTo="/warehouse-staff/receiving"
        backLabel={t('action.backToReceiving', 'Back to Receiving')}
      />

      <ShipmentStepper status={shipment.status} />

      {canConfirmArrival && (
        <Flex style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            loading={updateStatus.isPending}
            onClick={handleConfirmArrival}
          >
            {t('scan.confirmArrival', 'Confirm Arrival')}
          </Button>
        </Flex>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <ShipmentOverview
            shipment={shipment}
            itemInfo={itemData ? {
              title: itemData.title,
              imageUrl: (itemData.images?.find((m) => m.isPrimary) ?? itemData.images?.[0])?.url,
              condition: itemData.condition,
            } : undefined}
          />
        </Col>
      </Row>
    </div>
  )
}
