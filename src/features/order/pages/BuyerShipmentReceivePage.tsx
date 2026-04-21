import { useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router'
import {
  Card,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Radio,
  Input,
  Form,
  App,
  Descriptions,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useMyDirectShipment, useSubmitProofOfDelivery } from '@/features/order/api'
import { BuyerReceiptEvidenceSection } from '@/components/ui/BuyerReceiptEvidenceSection'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PackageCondition } from '@/types'

const CONDITIONS: PackageCondition[] = [
  'sealed_intact',
  'outer_damage',
  'wet_or_torn',
  'tamper_suspected',
  'wrong_parcel',
  'other',
]

/**
 * Buyer proof-of-delivery form. Reached either from the QR scan flow
 * (with a validated token in the query string) or from a direct order-page
 * link. Uploads delivery photos, captures package condition, and submits
 * the proof-of-delivery payload to the backend.
 */
export default function BuyerShipmentReceivePage() {
  const { shipmentId = '' } = useParams<{ shipmentId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useTranslation(['order', 'common'])
  const { message } = App.useApp()
  const navigate = useNavigate()

  const { data: shipment, isLoading, error } = useMyDirectShipment(shipmentId)

  const [condition, setCondition] = useState<PackageCondition>('sealed_intact')
  const [notes, setNotes] = useState('')

  const submitProof = useSubmitProofOfDelivery()

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

  const alreadyReceipted = !!shipment.buyerReceivedPackageAt || shipment.buyerDeliveryPhotos?.length > 0
  const notesRequired = condition !== 'sealed_intact'
  // Backend tightens the allowed source states for the proof-of-delivery
  // transition. Mirror that gate on the FE so the buyer sees an explanation
  // instead of submitting a doomed form.
  const notReadyStatuses = ['draft', 'carrier_booked']
  const terminalStatuses = ['accepted', 'disputed', 'completed']
  const shipmentNotReady = notReadyStatuses.includes(shipment.status)
  const shipmentTerminal = terminalStatuses.includes(shipment.status)
  const shipmentBlocked = shipmentNotReady || shipmentTerminal

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 12px' }}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('action.back', 'Back', { ns: 'common' })}
        </Button>
      </Space>

      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        {t('directShipment.receive.title', 'Confirm Parcel Receipt')}
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('directShipment.shipmentDetail', 'Shipment')}>
            <Typography.Text strong>{shipment.shipmentIdDisplay}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('statusLabel', 'Status')}>
            <StatusBadge status={shipment.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('directShipment.externalTracking', 'External Tracking')}>
            {shipment.externalTrackingCode ?? (
              <Typography.Text type="secondary">{t('notYetAvailable', 'Chưa có')}</Typography.Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('order', 'Order')}>
            <Link to={`/me/orders/${shipment.orderId}`}>{shipment.orderId}</Link>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {shipmentBlocked && (
        <Alert
          type={shipmentTerminal ? 'info' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            shipmentTerminal
              ? t('directShipment.receive.blocked.terminal', 'Order completed or disputed')
              : t(
                  'directShipment.receive.blocked.notReady',
                  'Shipment not ready for receipt confirmation',
                )
          }
          description={
            shipmentTerminal
              ? t(
                  'directShipment.receive.blocked.terminalDesc',
                  'Cannot submit proof of delivery for a shipment in this state.',
                )
              : t(
                  'directShipment.receive.blocked.notReadyDesc',
                  'Seller has not confirmed handoff to carrier. Please wait for shipment dispatch.',
                )
          }
        />
      )}

      {alreadyReceipted && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('directShipment.receive.alreadySubmitted', 'Proof of delivery already submitted')}
          action={
            <Button type="primary" onClick={() => navigate(`/me/orders/${shipment.orderId}`)}>
              {t('directShipment.openOrderActions', 'Open Delivery Actions')}
            </Button>
          }
        />
      )}

      {!alreadyReceipted && (
        <>
          <Card title={t('directShipment.receive.conditionTitle', 'Package Condition')} style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Form.Item
                label={t('directShipment.receive.conditionLabel', 'Package Condition')}
                required
              >
                <Radio.Group
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {CONDITIONS.map((c) => (
                    <Radio key={c} value={c}>
                      {t(`directShipment.conditions.${c}`, c)}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label={t('directShipment.receive.notesLabel', 'Notes')}
                required={notesRequired}
                help={
                  notesRequired
                    ? t('directShipment.receive.notesRequired', 'Required when the package is not sealed & intact')
                    : undefined
                }
              >
                <Input.TextArea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('directShipment.receive.notesPlaceholder', 'Describe any issues with the package...')}
                />
              </Form.Item>
            </Form>
          </Card>

          <BuyerReceiptEvidenceSection
            title={t('directShipment.receive.formTitle', 'Delivery Evidence')}
            hasSubmittedProof={false}
            submitting={submitProof.isPending}
            onSubmit={async (deliveryPhotoMediaUploadIds) => {
              if (notesRequired && !notes.trim()) return
              const result = await submitProof.mutateAsync({
                shipmentId: shipment.id,
                orderId: shipment.orderId,
                deliveryPhotoMediaUploadIds,
                packageCondition: condition,
                conditionNotes: notes.trim() || undefined,
                source: token ? 'qr_scan' : 'order_page',
              })
              message.success(t('directShipment.receive.submitted', 'Proof of delivery submitted'))
              navigate(`/me/orders/${result.orderId}`)
            }}
          />
        </>
      )}
    </div>
  )
}
