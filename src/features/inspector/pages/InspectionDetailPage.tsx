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
} from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router'
import { useInboundShipmentById } from '@/features/warehouse/api'
import { useInspectItem } from '@/features/inspector/api'
import type { WarehouseInspectionDto } from '@/features/inspector/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'

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
  const mediaUpload = useMediaUpload('warehouse_inspection_image')

  const [condition, setCondition] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [_uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [inspectionResult, setInspectionResult] = useState<WarehouseInspectionDto | null>(null)

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

  const handleSubmit = async () => {
    if (!condition) {
      message.warning(t('inspector:inspectionDetail.selectConditionWarning', 'Please select a condition'))
      return
    }
    if (!shipmentId) return

    try {
      setUploading(true)
      // Upload all captured photos first
      const mediaIds: string[] = []
      for (const photo of capturedPhotos) {
        const file = new File([photo.blob], `inspection-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const media = await mediaUpload.upload(file)
        mediaIds.push(media.mediaUploadId)
      }
      setUploadedMediaIds(mediaIds)

      const result = await inspectMutation.mutateAsync({
        shipmentId,
        condition: condition,
        inspectionNotes: notes || undefined,
        inspectionMediaUploadIds: mediaIds.length > 0 ? mediaIds : undefined,
      })
      setInspectionResult(result)
      message.success(t('inspector:inspectionDetail.submitSuccess', 'Inspection submitted successfully'))
    } catch {
      message.error(t('inspector:inspectionDetail.submitError', 'Failed to submit inspection'))
    } finally {
      setUploading(false)
    }
  }

  if (inspectionResult) {
    return (
      <div>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#4A7C59' }} />}
          title={t('inspector:inspectionDetail.completedTitle', 'Inspection Completed')}
          subTitle={t('inspector:inspectionDetail.completedSubtitle', 'Condition: {{condition}} | Decision: {{decision}}', { condition: inspectionResult.conditionOnArrival, decision: inspectionResult.decisionStatus })}
          extra={[
            <Button
              key="queue"
              type="primary"
              onClick={() => navigate('/inspector/queue')}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('inspector:inspectionDetail.backToQueue', 'Back to Queue')}
            </Button>,
            <Button key="dashboard" onClick={() => navigate('/inspector')}>
              {t('inspector:inspectionDetail.dashboard', 'Dashboard')}
            </Button>,
          ]}
        />
        {inspectionResult.evidence.length > 0 && (
          <Card title={t('inspector:inspectionDetail.uploadedEvidence', 'Uploaded Evidence')} style={{ maxWidth: isMobile ? '100%' : 600, margin: '0 auto', padding: isMobile ? 8 : undefined }}>
            <Image.PreviewGroup>
              <Space wrap>
                {inspectionResult.evidence.map((e) => (
                  <Image key={e.id} src={e.url} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} />
                ))}
              </Space>
            </Image.PreviewGroup>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <Typography.Title
        level={2}
        style={{ marginBottom: isMobile ? 16 : 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', fontSize: isMobile ? 22 : undefined }}
      >
        {t('inspector:inspectionDetail.title', 'Inspect Shipment')}
      </Typography.Title>

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
              onClick={handleSubmit}
              loading={uploading || inspectMutation.isPending}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('inspector:inspectionDetail.submitInspection', 'Submit Inspection')}
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  )
}
