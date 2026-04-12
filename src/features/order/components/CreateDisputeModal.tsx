import { useState } from 'react'
import { Modal, Form, Select, Input, App } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  useCreateOrderDispute,
  useCreateAuctionDispute,
  useCreateShipmentDispute,
  useCreateWarehouseItemDispute,
  useCreatePaymentDispute,
} from '@/features/dispute/api'

export type DisputeTargetType = 'order' | 'auction' | 'shipment' | 'warehouse_item' | 'payment'

export interface CreateDisputeModalProps {
  targetType: DisputeTargetType
  targetId: string
  orderId?: string
  auctionId?: string
  open: boolean
  onClose: () => void
  prefillDomain?: string
  prefillCaseType?: string
}

const DOMAIN_OPTIONS = [
  { value: 'order', label: 'Order' },
  { value: 'auction', label: 'Auction' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipment', label: 'Shipment' },
  { value: 'warehouse_item', label: 'Warehouse Item' },
]

const CASE_TYPE_MAP: Record<string, { value: string; label: string }[]> = {
  order: [
    { value: 'item_not_as_described', label: 'Item not as described' },
    { value: 'item_damaged', label: 'Item damaged' },
    { value: 'item_not_received', label: 'Item not received' },
    { value: 'wrong_item', label: 'Wrong item' },
    { value: 'other', label: 'Other' },
  ],
  auction: [
    { value: 'bid_manipulation', label: 'Bid manipulation' },
    { value: 'counterfeit', label: 'Counterfeit' },
    { value: 'misrepresentation', label: 'Misrepresentation' },
    { value: 'other', label: 'Other' },
  ],
  payment: [
    { value: 'unauthorized_charge', label: 'Unauthorized charge' },
    { value: 'double_charge', label: 'Double charge' },
    { value: 'refund_not_received', label: 'Refund not received' },
    { value: 'other', label: 'Other' },
  ],
  shipment: [
    { value: 'lost_in_transit', label: 'Lost in transit' },
    { value: 'damaged_in_transit', label: 'Damaged in transit' },
    { value: 'delivery_issue', label: 'Delivery issue' },
    { value: 'other', label: 'Other' },
  ],
  warehouse_item: [
    { value: 'item_damaged', label: 'Item damaged' },
    { value: 'item_missing', label: 'Item missing' },
    { value: 'wrong_item', label: 'Wrong item' },
    { value: 'other', label: 'Other' },
  ],
}

export function CreateDisputeModal({
  targetType,
  targetId,
  orderId,
  auctionId,
  open,
  onClose,
  prefillDomain,
  prefillCaseType,
}: CreateDisputeModalProps) {
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const createOrderDispute = useCreateOrderDispute()
  const createAuctionDispute = useCreateAuctionDispute()
  const createShipmentDispute = useCreateShipmentDispute()
  const createWarehouseItemDispute = useCreateWarehouseItemDispute()
  const createPaymentDispute = useCreatePaymentDispute()

  const [domain, setDomain] = useState(prefillDomain ?? (targetType === 'warehouse_item' ? 'warehouse_item' : targetType))
  const [caseType, setCaseType] = useState(prefillCaseType ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isPending =
    createOrderDispute.isPending ||
    createAuctionDispute.isPending ||
    createShipmentDispute.isPending ||
    createWarehouseItemDispute.isPending ||
    createPaymentDispute.isPending

  const reset = () => {
    setDomain(prefillDomain ?? (targetType === 'warehouse_item' ? 'warehouse_item' : targetType))
    setCaseType(prefillCaseType ?? '')
    setTitle('')
    setDescription('')
  }

  const caseTypeOptions = CASE_TYPE_MAP[domain] ?? CASE_TYPE_MAP['order']!

  const handleSubmit = async () => {
    if (!domain || !caseType || !title.trim() || description.trim().length < 20) return

    const payload = { domain, caseType, title: title.trim(), description: description.trim() }

    try {
      let result: { id: string }

      switch (targetType) {
        case 'order':
          result = await createOrderDispute.mutateAsync({ orderId: orderId ?? targetId, ...payload })
          break
        case 'auction':
          result = await createAuctionDispute.mutateAsync({ auctionId: auctionId ?? targetId, ...payload })
          break
        case 'shipment':
          result = await createShipmentDispute.mutateAsync({ shipmentId: targetId, ...payload })
          break
        case 'warehouse_item':
          result = await createWarehouseItemDispute.mutateAsync({ warehouseItemId: targetId, ...payload })
          break
        case 'payment':
          result = await createPaymentDispute.mutateAsync({ paymentId: targetId, ...payload })
          break
        default:
          return
      }

      message.success(t('disputeCreated', 'Dispute created successfully'))
      reset()
      onClose()
      navigate(`/me/disputes/${result.id}`)
    } catch {
      message.error(t('disputeError', 'Failed to create dispute'))
    }
  }

  return (
    <Modal
      title={t('openDispute', 'Report Issue / Open Dispute')}
      open={open}
      onCancel={() => {
        reset()
        onClose()
      }}
      onOk={handleSubmit}
      okText={tc('action.confirm', 'Confirm')}
      okButtonProps={{
        danger: true,
        loading: isPending,
        disabled: !domain || !caseType || !title.trim() || description.trim().length < 20,
      }}
      centered
    >
      <Form layout="vertical">
        <Form.Item label={t('disputeDomain', 'Domain')} required>
          <Select
            value={domain || undefined}
            onChange={(val) => {
              setDomain(val)
              setCaseType('')
            }}
            placeholder={t('selectDomain', 'Select domain')}
            options={DOMAIN_OPTIONS}
          />
        </Form.Item>
        <Form.Item label={t('disputeCaseType', 'Case Type')} required>
          <Select
            value={caseType || undefined}
            onChange={(val) => setCaseType(val)}
            placeholder={t('selectCaseType', 'Select case type')}
            options={caseTypeOptions}
          />
        </Form.Item>
        <Form.Item label={t('disputeTitle', 'Title')} required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('disputeTitlePlaceholder', 'Brief summary of the issue')}
            maxLength={200}
            showCount
          />
        </Form.Item>
        <Form.Item
          label={t('disputeDescription', 'Description')}
          required
          help={
            description.trim().length > 0 && description.trim().length < 20
              ? t('disputeDescriptionMinLength', 'Please enter at least 20 characters')
              : undefined
          }
          validateStatus={
            description.trim().length > 0 && description.trim().length < 20
              ? 'error'
              : undefined
          }
        >
          <Input.TextArea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('disputeDescriptionPlaceholder', 'Describe the issue in detail (min. 20 characters)...')}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/**
 * @deprecated Use CreateDisputeModal instead. This alias exists for backwards compatibility.
 */
export function OrderDisputeModal({
  orderId,
  open,
  onClose,
}: {
  orderId: string
  open: boolean
  onClose: () => void
  redirectPath?: string
}) {
  return (
    <CreateDisputeModal
      targetType="order"
      targetId={orderId}
      orderId={orderId}
      open={open}
      onClose={onClose}
    />
  )
}
