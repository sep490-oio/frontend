import { useState } from 'react'
import { Modal, Form, Select, Input, App } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  useCreateOrderDispute,
  useCreateAuctionDispute,
  useCreateShipmentDispute,
  useCreateWarehouseItemDispute,
  useCreatePaymentDispute,
} from '@/features/dispute/api'
import type { DisputeEligibilityDto, DisputeTargetType } from '@/types/dispute'

export type { DisputeTargetType } from '@/types/dispute'

export interface CreateDisputeModalProps {
  targetType: DisputeTargetType
  targetId: string
  orderId?: string
  auctionId?: string
  open: boolean
  onClose: () => void
  eligibility: DisputeEligibilityDto
}

export function CreateDisputeModal({
  targetType,
  targetId,
  orderId,
  auctionId,
  open,
  onClose,
  eligibility,
}: CreateDisputeModalProps) {
  const { t } = useTranslation('dispute')
  const { t: to } = useTranslation('order')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const createOrderDispute = useCreateOrderDispute()
  const createAuctionDispute = useCreateAuctionDispute()
  const createShipmentDispute = useCreateShipmentDispute()
  const createWarehouseItemDispute = useCreateWarehouseItemDispute()
  const createPaymentDispute = useCreatePaymentDispute()

  const allowedDomains = eligibility.allowedDomains ?? []
  const allowedCaseTypesByDomain = eligibility.allowedCaseTypes ?? {}

  // Lazy init: auto-select the only allowed domain on first render.
  // Caller must remount the modal (e.g. via `key` or conditional render) when eligibility changes.
  const [domain, setDomain] = useState<string>(() =>
    allowedDomains.length === 1 ? allowedDomains[0]! : '',
  )
  const [caseType, setCaseType] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const domainOptions = allowedDomains.map((d) => ({
    value: d,
    label: t(`domain.${d}`, d),
  }))

  const caseTypeOptions = (allowedCaseTypesByDomain[domain] ?? []).map((ct) => ({
    value: ct,
    label: t(`caseType.${ct}`, ct),
  }))

  const isPending =
    createOrderDispute.isPending ||
    createAuctionDispute.isPending ||
    createShipmentDispute.isPending ||
    createWarehouseItemDispute.isPending ||
    createPaymentDispute.isPending

  const reset = () => {
    setDomain(allowedDomains.length === 1 ? allowedDomains[0]! : '')
    setCaseType('')
    setTitle('')
    setDescription('')
  }

  const mapErrorToMessage = (err: unknown): string => {
    const code =
      (err as { response?: { data?: { code?: string } } })?.response?.data?.code ??
      (err as { code?: string })?.code
    if (typeof code === 'string' && code.startsWith('Dispute.')) {
      return t(`reasonCode.${code}`, to('disputeError', 'Failed to create dispute'))
    }
    return to('disputeError', 'Failed to create dispute')
  }

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

      message.success(to('disputeCreated', 'Dispute created successfully'))
      reset()
      onClose()
      navigate(`/me/disputes/${result.id}`)
    } catch (err) {
      message.error(mapErrorToMessage(err))
    }
  }

  return (
    <Modal
      title={to('openDispute', 'Report Issue / Open Dispute')}
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
        <Form.Item label={to('disputeDomain', 'Domain')} required>
          <Select
            value={domain || undefined}
            size={isMobile ? 'large' : 'middle'}
            disabled={allowedDomains.length <= 1}
            onChange={(val) => {
              setDomain(val)
              setCaseType('')
            }}
            placeholder={to('selectDomain', 'Select domain')}
            options={domainOptions}
          />
        </Form.Item>
        <Form.Item label={to('disputeCaseType', 'Case Type')} required>
          <Select
            value={caseType || undefined}
            size={isMobile ? 'large' : 'middle'}
            disabled={!domain || caseTypeOptions.length === 0}
            onChange={(val) => setCaseType(val)}
            placeholder={to('selectCaseType', 'Select case type')}
            options={caseTypeOptions}
          />
        </Form.Item>
        <Form.Item label={to('disputeTitle', 'Title')} required>
          <Input
            value={title}
            size={isMobile ? 'large' : 'middle'}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={to('disputeTitlePlaceholder', 'Brief summary of the issue')}
            maxLength={200}
            showCount
          />
        </Form.Item>
        <Form.Item
          label={to('disputeDescription', 'Description')}
          required
          help={
            description.trim().length > 0 && description.trim().length < 20
              ? to('disputeDescriptionMinLength', 'Please enter at least 20 characters')
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
            size={isMobile ? 'large' : 'middle'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={to('disputeDescriptionPlaceholder', 'Describe the issue in detail (min. 20 characters)...')}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
