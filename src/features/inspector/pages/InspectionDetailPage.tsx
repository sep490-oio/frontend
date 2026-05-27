import { useState } from 'react'
import {
  Typography,
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
  Grid,
  Tooltip,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  InboxOutlined,
  TagOutlined,
} from '@ant-design/icons'
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

// ── Helpers ──────────────────────────────────────────────────────────

function CopyableId({ id, length = 12 }: { id: string; length?: number }) {
  const short = id.length > length ? `${id.slice(0, length)}…` : id
  return (
    <Tooltip title={id}>
      <code
        style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          background: 'var(--color-bg-surface)',
          padding: '2px 6px',
          borderRadius: 4,
          wordBreak: 'break-all',
        }}
        onClick={() => {
          void navigator.clipboard.writeText(id)
          message.success('Copied')
        }}
      >
        {short} <CopyOutlined style={{ fontSize: 10, opacity: 0.6 }} />
      </code>
    </Tooltip>
  )
}

interface InfoFieldProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

function InfoField({ icon, label, children }: InfoFieldProps) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 16, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export default function InspectionDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('inspector')
  const { isMobile } = useBreakpoint()
  const screens = Grid.useBreakpoint()

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

  // ── Terminal states (unchanged logic, refined styling) ──────────
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

  // ── Layout values ──────────────────────────────────────────────────
  const isDesktop = !!screens.md
  const itemImage = shipment.itemImageUrl
  const canSubmit = !!condition && capturedPhotos.length > 0

  return (
    <div style={{
      maxWidth: 840,
      margin: '0 auto',
      padding: isMobile ? '0 12px' : '0 16px',
      paddingBottom: isMobile ? 80 : 32,
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: isMobile ? 16 : 24,
        paddingTop: isMobile ? 12 : 0,
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/inspector/queue')}
          style={{ color: 'var(--color-text-secondary)', padding: 4 }}
        />
        <Typography.Title
          level={isMobile ? 4 : 3}
          style={{ margin: 0, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)' }}
        >
          {t('inspector:inspectionDetail.title', 'Inspect Shipment')}
        </Typography.Title>
      </div>

      {/* ── Item Summary Card ── */}
      <div
        className="oio-widget"
        style={{
          display: 'flex',
          gap: isMobile ? 12 : 20,
          alignItems: 'center',
          padding: isMobile ? 12 : 20,
          marginBottom: isMobile ? 12 : 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Title level={isMobile ? 5 : 4} style={{ margin: 0, fontFamily: SERIF_FONT, marginBottom: 4 }}>
            {shipment.itemTitle ?? t('inspector:inspectionDetail.untitledItem', 'Untitled item')}
          </Typography.Title>
          <CopyableId id={shipment.itemId} />
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={shipment.status} />
          </div>
        </div>
      </div>

      {/* ── Photos & Media ── */}
      {((shipment.itemImageUrls && shipment.itemImageUrls.length > 0) || itemImage || (shipment.receiptPhotos && shipment.receiptPhotos.length > 0)) && (
        <div
          className="oio-widget"
          style={{
            padding: isMobile ? 12 : 20,
            marginBottom: isMobile ? 12 : 20,
          }}
        >
          <Typography.Text strong style={{ display: 'block', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            {t('inspector:inspectionDetail.photosAndMedia', 'Photos & Media')}
          </Typography.Text>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24 }}>
            {/* Seller Photos */}
            {((shipment.itemImageUrls && shipment.itemImageUrls.length > 0) || itemImage) && (
              <div style={{ flex: 1 }}>
                <Typography.Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                  {t('inspector:inspectionDetail.itemPhotosSeller', 'Item Photos (From Seller)')}
                </Typography.Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Image.PreviewGroup>
                    {(shipment.itemImageUrls && shipment.itemImageUrls.length > 0 
                        ? shipment.itemImageUrls 
                        : (itemImage ? [itemImage] : [])
                      ).map((url, idx) => (
                      <div key={idx} style={{ display: 'inline-block', flexShrink: 0 }}>
                        <Image
                          src={url}
                          alt={`${shipment.itemTitle} ${idx + 1}`}
                          width={isMobile ? 72 : 100}
                          height={isMobile ? 72 : 100}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                        />
                      </div>
                    ))}
                  </Image.PreviewGroup>
                </div>
              </div>
            )}

            {/* Receipt Photos */}
            {shipment.receiptPhotos && shipment.receiptPhotos.length > 0 && (
              <div style={{ flex: 1 }}>
                <Typography.Text style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                  {t('inspector:inspectionDetail.receiptPhotosWarehouse', 'Warehouse Receipt Photos')}
                </Typography.Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Image.PreviewGroup>
                    {shipment.receiptPhotos.map((url, idx) => (
                      <div key={idx} style={{ display: 'inline-block', flexShrink: 0 }}>
                        <Image
                          src={url}
                          alt={`Receipt photo ${idx + 1}`}
                          width={isMobile ? 72 : 100}
                          height={isMobile ? 72 : 100}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                        />
                      </div>
                    ))}
                  </Image.PreviewGroup>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Shipment Information Grid ── */}
      <div
        className="oio-widget"
        style={{
          padding: isMobile ? 12 : 20,
          marginBottom: isMobile ? 12 : 20,
        }}
      >
        <Typography.Text strong style={{
          display: 'block',
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-text-secondary)',
          marginBottom: 16,
        }}>
          {t('inspector:inspectionDetail.shipmentInfo', 'Shipment Information')}
        </Typography.Text>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 14 : 18,
        }}>
          <InfoField icon={<TagOutlined />} label={t('inspector:inspectionDetail.shipmentId', 'Shipment ID')}>
            <CopyableId id={shipment.id} />
          </InfoField>
          <InfoField icon={<EnvironmentOutlined />} label={t('inspector:inspectionDetail.provider', 'Provider')}>
            {shipment.providerCode}
          </InfoField>
          <InfoField icon={<UserOutlined />} label={t('inspector:inspectionDetail.sender', 'Sender')}>
            {shipment.senderName}
          </InfoField>
          <InfoField icon={<PhoneOutlined />} label={t('inspector:inspectionDetail.phone', 'Phone')}>
            {shipment.senderPhone}
          </InfoField>
          <InfoField icon={<InboxOutlined />} label={t('inspector:inspectionDetail.weight', 'Weight')}>
            {shipment.weightGrams}g
          </InfoField>
          <InfoField icon={<CalendarOutlined />} label={t('inspector:inspectionDetail.arrived', 'Arrived')}>
            {shipment.arrivedAt ? formatDateTime(shipment.arrivedAt) : '—'}
          </InfoField>
          {shipment.carrierTrackingNumber && (
            <InfoField icon={<TagOutlined />} label="Tracking">
              <CopyableId id={shipment.carrierTrackingNumber} length={20} />
            </InfoField>
          )}
          <InfoField icon={<CalendarOutlined />} label={t('inspector:inspectionDetail.created', 'Created')}>
            {formatDateTime(shipment.createdAt)}
          </InfoField>
        </div>
        {shipment.notes && (
          <div style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'var(--color-bg-surface)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}>
            <strong>{t('inspector:inspectionDetail.notes', 'Notes')}:</strong> {shipment.notes}
          </div>
        )}

      </div>

      {/* ── Package Information (from Warehouse Receipt) ── */}
      {shipment.warehousePackage && (
        <div
          className="oio-widget"
          style={{
            padding: isMobile ? 12 : 20,
            marginBottom: isMobile ? 12 : 20,
          }}
        >
          <Typography.Text strong style={{
            display: 'block',
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-secondary)',
            marginBottom: 16,
          }}>
            {t('inspector:inspectionDetail.warehousePackageInfo', 'Warehouse Package Info')}
          </Typography.Text>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <InfoField icon={<InboxOutlined />} label={t('inspector:inspectionDetail.packageStatus', 'Package Status')}>
              <StatusBadge status={shipment.warehousePackage.status} />
            </InfoField>
            {shipment.warehousePackage.storageLocationLabel && (
              <InfoField icon={<EnvironmentOutlined />} label={t('inspector:inspectionDetail.storageLocation', 'Storage Location')}>
                {shipment.warehousePackage.storageLocationLabel}
              </InfoField>
            )}
          </div>

          {shipment.warehousePackage.media && shipment.warehousePackage.media.length > 0 && (
            <div>
              <Typography.Text strong style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                {t('inspector:inspectionDetail.warehousePhotos', 'Warehouse Photos')}
              </Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Image.PreviewGroup>
                  {shipment.warehousePackage.media.map(m => (
                    <div key={m.id} style={{ display: 'inline-block', flexShrink: 0 }}>
                      <Image
                        src={m.secureUrl}
                        alt={m.fileName || 'Warehouse Photo'}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inspection Form ── */}
      <div
        className="oio-widget"
        style={{
          padding: isMobile ? 12 : 20,
          marginBottom: isMobile ? 12 : 20,
        }}
      >
        <Typography.Text strong style={{
          display: 'block',
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-text-secondary)',
          marginBottom: 16,
        }}>
          {t('inspector:inspectionDetail.inspectionForm', 'Inspection Form')}
        </Typography.Text>

        {/* Condition + Notes — side by side on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: isMobile ? 16 : 20,
          marginBottom: isMobile ? 16 : 24,
        }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              {t('inspector:inspectionDetail.conditionLabel', 'Condition on Arrival')} *
            </Typography.Text>
            <Select
              value={condition || undefined}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
              placeholder={t('inspector:inspectionDetail.selectCondition', 'Select condition')}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              {t('inspector:inspectionDetail.notesLabel', 'Inspection Notes')}
            </Typography.Text>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('inspector:inspectionDetail.notesPlaceholder', 'Add any notes about the item condition, packaging, etc.')}
              rows={isMobile ? 3 : 4}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Evidence Photos */}
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
            {t('inspector:inspectionDetail.photos', 'Evidence Photos')} *
          </Typography.Text>
          <div style={{ maxWidth: isDesktop ? 560 : '100%' }}>
            <MultiCaptureUploader
              maxPhotos={10}
              step="item_photo"
              facingMode="environment"
              onPhotosChange={setCapturedPhotos}
              instruction={t('inspector:inspectionDetail.captureInstruction', 'Take clear photos of the item from multiple angles')}
            />
          </div>
        </div>

        {/* Desktop submit button */}
        {!isMobile && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="large"
              onClick={openDecisionModal}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? 'var(--color-accent)' : undefined,
                borderColor: canSubmit ? 'var(--color-accent)' : undefined,
                minWidth: 200,
                height: 48,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {t('inspector:inspectionDetail.submitInspection', 'Submit Inspection')}
            </Button>
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Bottom CTA ── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'var(--color-bg-container)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
          }}>
            📷 {capturedPhotos.length}/10
          </span>
          <Button
            type="primary"
            size="large"
            block
            onClick={openDecisionModal}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? 'var(--color-accent)' : undefined,
              borderColor: canSubmit ? 'var(--color-accent)' : undefined,
              height: 44,
              fontWeight: 600,
            }}
          >
            {t('inspector:inspectionDetail.submitInspection', 'Submit Inspection')}
          </Button>
        </div>
      )}

      {/* ── Decision modal ── */}
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
