import { useState, useCallback } from 'react'
import { Button, Card, Space, Typography, Image } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { MultiCaptureUploader, type CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { useMediaUpload } from '@/hooks/useMediaUpload'

export interface BuyerReceiptEvidenceSectionProps {
  title?: string
  description?: string
  existingPhotos?: { id: string; url: string; createdAt: string }[]
  hasSubmittedProof: boolean
  submitting?: boolean
  onSubmit: (mediaUploadIds: string[]) => void | Promise<void>
  minPhotos?: number
}

export function BuyerReceiptEvidenceSection({
  title,
  description,
  existingPhotos = [],
  hasSubmittedProof,
  submitting = false,
  onSubmit,
  minPhotos = 1,
}: BuyerReceiptEvidenceSectionProps) {
  const { t } = useTranslation('order')
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const mediaUpload = useMediaUpload('shipment_delivery_photo')

  const cardTitle = title ?? t('buyerReceiptEvidence.title', 'Confirm receipt')
  const cardDescription =
    description ??
    t('buyerReceiptEvidence.description', 'Take photos of the parcel to confirm you received it.')

  const handleSubmit = useCallback(async () => {
    if (capturedPhotos.length < minPhotos) return
    setLocalSubmitting(true)
    try {
      const files = capturedPhotos.map(
        (p, i) =>
          new File([p.blob], `receipt-${i + 1}.jpg`, {
            type: p.blob.type || 'image/jpeg',
          }),
      )
      const uploaded = await mediaUpload.uploadMultiple(files)
      const ids = uploaded.map((r) => r.mediaUploadId)
      await onSubmit(ids)
    } finally {
      setLocalSubmitting(false)
    }
  }, [capturedPhotos, minPhotos, mediaUpload, onSubmit])

  const isLoading = submitting || localSubmitting || mediaUpload.uploading
  const canConfirm = capturedPhotos.length >= minPhotos && !isLoading

  if (hasSubmittedProof) {
    return (
      <Card>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Typography.Text strong style={{ color: '#52c41a' }}>
            {t('buyerReceiptEvidence.confirmed', 'Receipt confirmed')}
          </Typography.Text>
        </Space>
        {existingPhotos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Image.PreviewGroup>
              <Space wrap>
                {existingPhotos.map((p) => (
                  <Image
                    key={p.id}
                    src={p.url}
                    alt={t('buyerReceiptEvidence.photoAlt', 'Receipt photo')}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card title={cardTitle}>
      <Typography.Paragraph type="secondary">{cardDescription}</Typography.Paragraph>
      <MultiCaptureUploader
        maxPhotos={6}
        step="item_photo"
        facingMode="environment"
        onPhotosChange={setCapturedPhotos}
        instruction={t(
          'buyerReceiptEvidence.instruction',
          'Take clear photos showing you have the parcel in hand',
        )}
      />
      <Button
        type="primary"
        style={{ marginTop: 12 }}
        loading={isLoading}
        disabled={!canConfirm}
        onClick={handleSubmit}
      >
        {t('buyerReceiptEvidence.submit', 'Confirm received')}
      </Button>
    </Card>
  )
}
