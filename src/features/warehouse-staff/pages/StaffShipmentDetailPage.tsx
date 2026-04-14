import { Row, Col, Spin, Alert, Button, Flex, Grid } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useInboundShipmentById,
} from '@/features/warehouse/api'
import { useItemById } from '@/features/item/api'
import { ShipmentHeader } from '@/features/warehouse/components/ShipmentHeader'
import { ShipmentStepper } from '@/features/warehouse/components/ShipmentStepper'
import { ShipmentOverview } from '@/features/warehouse/components/ShipmentOverview'

const { useBreakpoint } = Grid

export default function StaffShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const { data: shipment, isLoading, error } = useInboundShipmentById(id ?? '')
  const { data: itemData } = useItemById(shipment?.itemId ?? '')

  const canReceive =
    shipment?.status !== 'completed' && shipment?.status !== 'cancelled' && shipment?.status !== 'failed'

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
    <div style={{ paddingBottom: isMobile ? 32 : 0 }}>
      <ShipmentHeader
        clientOrderCode={shipment.clientOrderCode}
        status={shipment.status}
        providerCode={shipment.providerCode}
        shipmentMode={shipment.shipmentMode}
        externalCarrierName={shipment.externalCarrierName}
        updatedAt={shipment.modifiedAt ?? shipment.createdAt}
        backTo="/warehouse-staff/receiving"
        backLabel={t('action.backToReceiving', 'Back to Receiving')}
      />

      <ShipmentStepper status={shipment.status} />

      {canReceive && shipment.clientOrderCode && (
        <Flex style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            size={isMobile ? 'large' : 'middle'}
            block={isMobile}
            style={{ minHeight: 44 }}
            onClick={() =>
              navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(shipment.clientOrderCode)}`)
            }
          >
            {t('scan.receiveItem', 'Receive & Store')}
          </Button>
        </Flex>
      )}

      <Row gutter={[isMobile ? 0 : 24, 16]}>
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