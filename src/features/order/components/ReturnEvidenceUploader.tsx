import { useCallback, useState } from 'react'
import { Alert, Button, Flex, Image, Typography, App } from 'antd'
import { PictureOutlined, CameraOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import type { CaptureMetadata } from '@/types/capture'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

/**
 * Shared chain-of-custody photo uploader used by both OrderReturn and
 * WarehouseToSellerShipment flows.
 *
 * Uploads each captured photo via the platform's `useMediaUpload` pipeline
 * (Cloudinary signature -> upload -> confirm). The resulting `mediaUploadId`
 * is handed to `onUpload(id)` — the caller wires that to the matching BE
 * evidence endpoint and is responsible for refreshing the parent query so
 * `existingEvidence` updates on the next render.
 *
 * Camera-only capture (live, anti-gallery) via `SecureCaptureUploader` —
 * mirrors the buyer-received-goods flow. No file-picker fallback except
 * when the device's camera API is missing (handled inside SecureCaptureUploader).
 */
export interface ReturnEvidenceItem {
  id: string
  mediaUpload: { secureUrl: string }
}

export interface ReturnEvidenceUploaderProps {
  existingEvidence: ReturnEvidenceItem[]
  category: string
  /** Soft UI cap on total photos in this category. Defaults to 5 (BE max). */
  maxPhotos?: number
  /** Minimum required to enable the gated downstream action. Defaults to 1. */
  minRequired?: number
  onUpload: (mediaUploadId: string) => Promise<void>
  /** Disable new uploads (e.g. during a parent mutation). */
  disabled?: boolean
  /** Cloudinary upload context — one of the BE's registered context strings. */
  uploadContext?: string
}

export function ReturnEvidenceUploader({
  existingEvidence,
  category,
  maxPhotos = 5,
  minRequired = 1,
  onUpload,
  disabled = false,
  uploadContext = 'shipment_delivery_photo',
}: ReturnEvidenceUploaderProps) {
  const { t } = useTranslation('order')
  const { message } = App.useApp()
  const mediaUpload = useMediaUpload(uploadContext)
  const [submitting, setSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  // BUG FIX: track locally uploaded count to avoid stale server data.
  // After onUpload succeeds the parent invalidates queries, but React Query
  // cache may not have refreshed yet — so existingEvidence.length is stale.
  const [localUploadCount, setLocalUploadCount] = useState(0)

  const photosCount = existingEvidence.length + localUploadCount
  const atMax = photosCount >= maxPhotos
  const needsMore = photosCount < minRequired

  const handleCapture = useCallback(
    async (blob: Blob, _metadata: Partial<CaptureMetadata>) => {
      if (atMax) {
        message.warning(
          t('returnEvidence.maxReached', 'Maximum {{max}} photos per category', {
            max: maxPhotos,
          }),
        )
        return
      }
      setSubmitting(true)
      try {
        // Wrap the captured Blob in a File so the upload pipeline has a name.
        const file = new File(
          [blob],
          `return-evidence-${Date.now()}.jpg`,
          { type: blob.type || 'image/jpeg' },
        )
        const result = await mediaUpload.upload(file)
        await onUpload(result.mediaUploadId)
        setLocalUploadCount((c) => c + 1)
        message.success(t('returnEvidence.uploadSuccess', 'Photo uploaded'))
        setShowCamera(false)
      } catch (err) {
        message.error(normalizeErrorMessage(err, t('returnEvidence.uploadError', 'Upload failed')))
      } finally {
        setSubmitting(false)
      }
    },
    [atMax, maxPhotos, mediaUpload, message, onUpload, t],
  )

  const isUploading = submitting || mediaUpload.uploading

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t(`returnEvidence.category.${category}`, category.replace(/_/g, ' '))}
      </Typography.Text>

      {needsMore && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message={t(
            'returnEvidence.minRequired',
            'At least {{min}} photo required before continuing',
            { min: minRequired },
          )}
        />
      )}

      {existingEvidence.length > 0 ? (
        <Image.PreviewGroup>
          <Flex gap={8} wrap="wrap" style={{ marginBottom: 8 }}>
            {existingEvidence.map((e) => (
              <div key={e.id} style={{ position: 'relative' }}>
                <Image
                  src={e.mediaUpload.secureUrl}
                  width={80}
                  height={80}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid var(--color-border-light, #d9d9d9)',
                  }}
                  preview={{ src: e.mediaUpload.secureUrl }}
                />
                <div style={{ position: 'absolute', top: 2, left: 2 }}>
                  <LiveCapturedBadge size="small" />
                </div>
              </div>
            ))}
          </Flex>
        </Image.PreviewGroup>
      ) : (
        <Flex
          align="center"
          gap={6}
          style={{
            padding: '8px 12px',
            background: 'var(--color-bg-surface, #f5f5f5)',
            borderRadius: 6,
            color: 'var(--color-text-secondary, rgba(0,0,0,0.45))',
            marginBottom: 8,
          }}
        >
          <PictureOutlined />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('returnEvidence.noPhotos', 'No photos uploaded yet')}
          </Typography.Text>
        </Flex>
      )}

      <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 8 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('returnEvidence.count', '{{count}}/{{max}} photos ({{min}} min required)', {
            count: photosCount,
            max: maxPhotos,
            min: minRequired,
          })}
        </Typography.Text>
        {!showCamera && (
          <Button
            icon={<CameraOutlined />}
            loading={isUploading}
            disabled={disabled || atMax}
            size="small"
            onClick={() => setShowCamera(true)}
          >
            {atMax
              ? t('returnEvidence.maxReachedBtn', 'Max reached')
              : t('returnEvidence.addPhoto', 'Add photo')}
          </Button>
        )}
      </Flex>

      {showCamera && !atMax && (
        <div style={{
          marginTop: 8,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <SecureCaptureUploader
            step="item_photo"
            facingMode="environment"
            overlayType="document"
            onCapture={handleCapture}
            instruction={t(
              'returnEvidence.captureInstruction',
              'Capture a clear photo — camera only (live capture)',
            )}
          />
          <div style={{ padding: '8px 0' }}>
            <Button
              size="small"
              onClick={() => setShowCamera(false)}
              disabled={isUploading}
              block
            >
              {t('returnEvidence.closeCamera', 'Close camera')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
