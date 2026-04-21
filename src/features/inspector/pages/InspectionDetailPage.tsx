import { useState } from 'react'
import {
  Typography,
  Card,
  Descriptions,
  Select,
  Input,
  Button,
  Space,
  Spin,
  Result,
  message,
  Image,
  Modal,
  Form,
  Alert,
} from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router'
import { useInboundShipmentById } from '@/features/warehouse/api'
import { useInspectItem, useInspectItemMultipart, useReviewInspection } from '@/features/inspector/api'
import type { WarehouseInspectionDto } from '@/features/inspector/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'

type TerminalState =
  | { kind: 'approved' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'pending_seller_confirmation' }
  | { kind: 'review_failed'; inspection: WarehouseInspectionDto }

export default function InspectionDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('inspector')
  const { isMobile } = useBreakpoint()

  const CONDITION_OPTIONS = [
    { value: 'new', label: t('inspector:inspectionDetail.conditionNew', 'New') },
    { value: 'like_new', label: t('inspector:inspectionDetail.conditionLikeNew', 'Like New') },
    { value: 'very_good', label: t('inspector:inspectionDetail.conditionVeryGood', 'Very Good') },
    { value: 'good', label: t('inspector:inspectionDetail.conditionGood', 'Good') },
    { value: 'acceptable', label: t('inspector:inspectionDetail.conditionAcceptable', 'Acceptable') },
  ]
  const { data: shipment, isLoading, isError } = useInboundShipmentById(shipmentId ?? '')
  const inspectMutation = useInspectItem()
  const inspectMultipartMutation = useInspectItemMultipart()
  const reviewMutation = useReviewInspection()
  const mediaUpload = useMediaUpload('warehouse_inspection_image')
  /**
   * Feature flag: once the BE multipart inspection endpoint
   * (`POST /warehouse/inbound-shipments/{id}/inspect/multipart`) is live, flip
   * this to `true` to submit the form in a single request. Until then the
   * existing pre-upload + JSON flow remains the default to avoid 404s.
   */
  const USE_MULTIPART_INSPECTION = false

  const [condition, setCondition] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [pickedDecision, setPickedDecision] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTouched, setRejectTouched] = useState(false)
  const [terminal, setTerminal] = useState<TerminalState | null>(null)
  const [lastInspection, setLastInspection] = useState<WarehouseInspectionDto | null>(null)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <Result
        status="404"
        title={t('inspector:inspectionDetail.notFoundTitle', 'Shipment Not Found')}
        subTitle={t('inspector:inspectionDetail.notFoundSubtitle', 'The inbound shipment could not be found.')}
        extra={
          <Button onClick={() => navigate('/inspector/queue')}>{t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}</Button>
        }
      />
    )
  }

  const openDecisionModal = () => {
    if (!condition) {
      message.warning(t('inspector:inspectionDetail.selectConditionWarning', 'Please select a condition'))
      return
    }
    if (capturedPhotos.length === 0) {
      message.warning(t('inspector:inspectionDetail.photosRequired', 'Please capture at least one evidence photo'))
      return
    }
    setPickedDecision(null)
    setRejectReason('')
    setRejectTouched(false)
    setDecisionModalOpen(true)
  }

  const confirmDecision = async () => {
    if (!shipmentId || !pickedDecision) return
    if (pickedDecision === 'reject' && !rejectReason.trim()) {
      setRejectTouched(true)
      return
    }

    setSubmitting(true)
    try {
      // 1. Either submit as a single multipart call (file uploads + JSON in one
      //    request) OR pre-upload each photo via the media upload endpoint and
      //    pass back the confirmed mediaUploadIds to the legacy JSON route.
      //
      //    The multipart path requires the BE endpoint registered at
      //    `/warehouse/inbound-shipments/{id}/inspect/multipart`; gated by the
      //    `USE_MULTIPART_INSPECTION` feature flag until BE ships the handler.
      let inspection: WarehouseInspectionDto
      if (USE_MULTIPART_INSPECTION && capturedPhotos.length > 0) {
        const files = capturedPhotos.map(
          (photo, idx) =>
            new File([photo.blob], `inspection-${Date.now()}-${idx}.jpg`, { type: 'image/jpeg' }),
        )
        inspection = await inspectMultipartMutation.mutateAsync({
          shipmentId,
          condition,
          inspectionNotes: notes || undefined,
          inspectionPhotos: files,
        })
      } else {
        const mediaIds: string[] = []
        for (const photo of capturedPhotos) {
          const file = new File([photo.blob], `inspection-${Date.now()}.jpg`, { type: 'image/jpeg' })
          const media = await mediaUpload.upload(file)
          mediaIds.push(media.mediaUploadId)
        }

        inspection = await inspectMutation.mutateAsync({
          shipmentId,
          condition,
          inspectionNotes: notes || undefined,
          inspectionMediaUploadIds: mediaIds.length > 0 ? mediaIds : undefined,
        })
      }
      setLastInspection(inspection)

      // Detect condition-confirmation-required branch from inspect response.
      // Signal: decisionStatus indicates the server is waiting on the seller
      // (e.g. "pending_seller_confirmation" / "condition_confirmation_required").
      const status = (inspection.decisionStatus ?? '').toLowerCase()
      const needsSellerConfirmation =
        status.includes('seller') ||
        status.includes('condition_confirmation') ||
        status === 'condition_confirmation_required'

      if (needsSellerConfirmation) {
        setDecisionModalOpen(false)
        setTerminal({ kind: 'pending_seller_confirmation' })
        return
      }

      // 3. Review
      try {
        await reviewMutation.mutateAsync({
          shipmentId,
          decision: pickedDecision,
          reason: pickedDecision === 'reject' ? rejectReason.trim() : undefined,
        })
        setDecisionModalOpen(false)
        if (pickedDecision === 'approve') {
          setTerminal({ kind: 'approved' })
        } else {
          setTerminal({ kind: 'rejected', reason: rejectReason.trim() })
        }
      } catch (reviewErr) {
        setDecisionModalOpen(false)
        setTerminal({ kind: 'review_failed', inspection })
        message.warning(
          t(
            'inspector:inspectionDetail.reviewFailedWarning',
            'Inspection saved, but the review step failed. Please retry from the fallback review queue.',
          ),
        )
        // eslint-disable-next-line no-console
        console.warn('Review step failed after inspection succeeded', reviewErr)
      }
    } catch {
      message.error(t('inspector:inspectionDetail.submitError', 'Failed to submit inspection'))
    } finally {
      setSubmitting(false)
    }
  }

  if (terminal) {
    if (terminal.kind === 'approved') {
      return (
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#4A7C59' }} />}
          title={t('inspector:inspectionDetail.approvedTitle', 'Inspection approved')}
          subTitle={t('inspector:inspectionDetail.approvedSubtitle', 'The item has been approved for listing.')}
          extra={[
            <Button key="queue" type="primary" onClick={() => navigate('/inspector/queue')}>
              {t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}
            </Button>,
          ]}
        />
      )
    }
    if (terminal.kind === 'rejected') {
      return (
        <Result
          status="error"
          icon={<CloseCircleOutlined style={{ color: '#cf1322' }} />}
          title={t('inspector:inspectionDetail.rejectedTitle', 'Inspection rejected')}
          subTitle={
            <div>
              <div>{t('inspector:inspectionDetail.rejectedSubtitle', 'The item has been rejected.')}</div>
              {terminal.reason && (
                <div style={{ marginTop: 8 }}>
                  <Typography.Text strong>{t('inspector:inspectionDetail.reasonLabel', 'Reason')}: </Typography.Text>
                  <Typography.Text>{terminal.reason}</Typography.Text>
                </div>
              )}
            </div>
          }
          extra={[
            <Button key="queue" type="primary" onClick={() => navigate('/inspector/queue')}>
              {t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}
            </Button>,
          ]}
        />
      )
    }
    if (terminal.kind === 'pending_seller_confirmation') {
      return (
        <Result
          icon={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
          title={t('inspector:inspectionDetail.pendingSellerTitle', 'Awaiting seller condition confirmation')}
          subTitle={t(
            'inspector:inspectionDetail.pendingSellerSubtitle',
            'The inspection has been saved. The seller must confirm the condition before a final decision can be made.',
          )}
          extra={[
            <Button key="queue" type="primary" onClick={() => navigate('/inspector/queue')}>
              {t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}
            </Button>,
          ]}
        />
      )
    }
    // review_failed
    return (
      <Result
        status="warning"
        icon={<WarningOutlined style={{ color: '#faad14' }} />}
        title={t('inspector:inspectionDetail.reviewFailedTitle', 'Inspection saved — manual review required')}
        subTitle={t(
          'inspector:inspectionDetail.reviewFailedSubtitle',
          'The inspection was saved but the review step did not complete. Finish the review from the fallback review queue.',
        )}
        extra={[
          <Button key="reviews" type="primary" onClick={() => navigate('/inspector/reviews')}>
            {t('inspector:inspectionDetail.goToReviews', 'Go to Review Queue')}
          </Button>,
          <Button key="queue" onClick={() => navigate('/inspector/queue')}>
            {t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}
          </Button>,
        ]}
      />
    )
  }

  const thumbnailSize = 96
  const itemImage = shipment.itemImageUrl

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <Typography.Title
        level={2}
        style={{ marginBottom: isMobile ? 16 : 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', fontSize: isMobile ? 22 : undefined }}
      >
        {t('inspector:inspectionDetail.title', 'Inspect Shipment')}
      </Typography.Title>

      {/* Item summary card */}
      <Card style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {itemImage ? (
            <Image
              src={itemImage}
              alt={shipment.itemTitle}
              width={thumbnailSize}
              height={thumbnailSize}
              style={{ objectFit: 'cover', borderRadius: 6, background: 'var(--color-surface-muted, #f0f0f0)' }}
            />
          ) : (
            <div
              style={{
                width: thumbnailSize,
                height: thumbnailSize,
                borderRadius: 6,
                background: 'var(--color-surface-muted, #f0f0f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary, #999)',
                fontSize: 12,
              }}
            >
              {t('inspector:inspectionDetail.noImage', 'No image')}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Title level={4} style={{ margin: 0, fontFamily: SERIF_FONT }}>
              {shipment.itemTitle ?? t('inspector:inspectionDetail.untitledItem', 'Untitled item')}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {shipment.itemId}
            </Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap size="small">
                {/* declaredCondition isn't on the shipment DTO; fall back to shipment.status for context */}
                <StatusBadge status={shipment.status} />
                {/* storage location is not on shipment DTO; omit if not available */}
              </Space>
            </div>
          </div>
        </div>
      </Card>

      {/* Shipment info */}
      <Card title={t('inspector:inspectionDetail.shipmentInfo', 'Shipment Information')} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('inspector:inspectionDetail.shipmentId', 'Shipment ID')}>{shipment.id}</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.status', 'Status')}>
            <StatusBadge status={shipment.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.itemId', 'Item ID')}>{shipment.itemId}</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.provider', 'Provider')}>{shipment.providerCode}</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.sender', 'Sender')}>{shipment.senderName}</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.phone', 'Phone')}>{shipment.senderPhone}</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.weight', 'Weight')}>{shipment.weightGrams}g</Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.arrived', 'Arrived')}>
            {shipment.arrivedAt ? formatDateTime(shipment.arrivedAt) : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label={t('inspector:inspectionDetail.created', 'Created')}>{formatDateTime(shipment.createdAt)}</Descriptions.Item>
          {shipment.notes && (
            <Descriptions.Item label={t('inspector:inspectionDetail.notes', 'Notes')} span={2}>{shipment.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Inspection form */}
      <Card title={t('inspector:inspectionDetail.inspectionForm', 'Inspection Form')}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('inspector:inspectionDetail.conditionLabel', 'Condition on Arrival')} *
            </Typography.Text>
            <Select
              value={condition || undefined}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
              placeholder={t('inspector:inspectionDetail.selectCondition', 'Select condition')}
              style={{ width: '100%', maxWidth: isMobile ? '100%' : 400 }}
              size="large"
            />
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('inspector:inspectionDetail.notesLabel', 'Inspection Notes')}
            </Typography.Text>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('inspector:inspectionDetail.notesPlaceholder', 'Add any notes about the item condition, packaging, etc.')}
              rows={4}
              style={{ maxWidth: isMobile ? '100%' : 600 }}
            />
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('inspector:inspectionDetail.photos', 'Evidence Photos')} *
            </Typography.Text>
            <MultiCaptureUploader
              maxPhotos={10}
              step="item_photo"
              facingMode="environment"
              onPhotosChange={setCapturedPhotos}
              instruction={t('inspector:inspectionDetail.captureInstruction', 'Take clear photos of the item from multiple angles')}
            />
          </div>

          <div>
            <Button
              type="primary"
              size="large"
              onClick={openDecisionModal}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('inspector:inspectionDetail.submitInspection', 'Submit Inspection')}
            </Button>
          </div>
        </Space>
      </Card>

      {/* Decision modal */}
      <Modal
        title={t('inspector:inspectionDetail.decisionTitle', 'Inspection Decision')}
        open={decisionModalOpen}
        onCancel={() => !submitting && setDecisionModalOpen(false)}
        onOk={confirmDecision}
        confirmLoading={submitting}
        okText={t('inspector:inspectionDetail.confirm', 'Confirm')}
        okButtonProps={{ disabled: !pickedDecision }}
        cancelButtonProps={{ disabled: submitting }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Text>
            {t('inspector:inspectionDetail.decisionPrompt', 'Select the final decision for this inspection.')}
          </Typography.Text>
          <Space>
            <Button
              type={pickedDecision === 'approve' ? 'primary' : 'default'}
              icon={<CheckCircleOutlined />}
              onClick={() => setPickedDecision('approve')}
              style={
                pickedDecision === 'approve'
                  ? { background: 'var(--color-success, #4A7C59)', borderColor: 'var(--color-success, #4A7C59)' }
                  : undefined
              }
            >
              {t('inspector:inspectionDetail.approve', 'Approve')}
            </Button>
            <Button
              danger={pickedDecision === 'reject'}
              type={pickedDecision === 'reject' ? 'primary' : 'default'}
              icon={<CloseCircleOutlined />}
              onClick={() => setPickedDecision('reject')}
            >
              {t('inspector:inspectionDetail.reject', 'Reject')}
            </Button>
          </Space>

          {pickedDecision === 'reject' && (
            <Form layout="vertical">
              <Form.Item
                label={t('inspector:inspectionDetail.rejectReasonLabel', 'Rejection Reason')}
                required
                validateStatus={rejectTouched && !rejectReason.trim() ? 'error' : undefined}
                help={
                  rejectTouched && !rejectReason.trim()
                    ? t('inspector:inspectionDetail.rejectReasonRequired', 'Please provide a rejection reason')
                    : undefined
                }
              >
                <Input.TextArea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value)
                    if (rejectTouched) setRejectTouched(true)
                  }}
                  onBlur={() => setRejectTouched(true)}
                  rows={3}
                  placeholder={t('inspector:inspectionDetail.rejectReasonPlaceholder', 'Explain why this item is being rejected')}
                />
              </Form.Item>
            </Form>
          )}

          {lastInspection && (
            <Alert
              type="info"
              showIcon
              message={t('inspector:inspectionDetail.retryHint', 'Retrying a previously saved inspection — media will be re-uploaded.')}
            />
          )}
        </Space>
      </Modal>
    </div>
  )
}
