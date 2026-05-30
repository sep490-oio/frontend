import { useState, useCallback, useEffect } from 'react'
import { Button, Flex, Typography, Upload } from 'antd'
import { CameraOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { CaptureMetadata, CaptureQualityProfile, CaptureStep } from '@/types/capture'

const ALLOW_UPLOAD = String(import.meta.env.VITE_ALLOW_UPLOAD).trim() === 'true'

export interface CapturedPhoto {
  blob: Blob
  metadata: Partial<CaptureMetadata>
  previewUrl: string
}

interface MultiCaptureUploaderProps {
  maxPhotos?: number
  step?: CaptureStep
  facingMode?: 'user' | 'environment'
  /** Quality profile passed to SecureCaptureUploader. Default 'item_or_package' (lenient). */
  qualityProfile?: CaptureQualityProfile
  onPhotosChange: (photos: CapturedPhoto[]) => void
  instruction?: string
}

export function MultiCaptureUploader({
  maxPhotos = 10,
  step = 'item_photo',
  facingMode = 'environment',
  qualityProfile = 'item_or_package',
  onPhotosChange,
  instruction,
}: MultiCaptureUploaderProps) {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [showCamera, setShowCamera] = useState(true)

  const canCapture = photos.length < maxPhotos

  const handleCapture = useCallback((blob: Blob, metadata: Partial<CaptureMetadata>) => {
    const newPhoto: CapturedPhoto = {
      blob,
      metadata,
      previewUrl: URL.createObjectURL(blob),
    }
    setPhotos((prev) => {
      if (prev.length >= maxPhotos) return prev
      return [...prev, newPhoto]
    })
  }, [maxPhotos])

  const handleFileUpload = useCallback((file: File) => {
    const newPhoto: CapturedPhoto = {
      blob: file,
      metadata: { source: 'upload' } as Partial<CaptureMetadata>,
      previewUrl: URL.createObjectURL(file),
    }
    setPhotos((prev) => {
      if (prev.length >= maxPhotos) return prev
      return [...prev, newPhoto]
    })
  }, [maxPhotos])

  const handleRemove = useCallback((index: number) => {
    setPhotos((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Sync state with parent and auto-hide/show camera based on count
  useEffect(() => {
    onPhotosChange(photos)
    if (photos.length >= maxPhotos) {
      setShowCamera(false)
    } else if (photos.length === maxPhotos - 1) {
      setShowCamera(true)
    }
  }, [photos, maxPhotos, onPhotosChange])

  return (
    <Flex vertical gap={16}>
      {/* Counter */}
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        <CameraOutlined style={{ marginRight: 4 }} />
        {t('photoCaptured', '{{count}} / {{max}} photos captured', { count: photos.length, max: maxPhotos })}
      </Typography.Text>

      {/* Captured photos grid */}
      {photos.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(80px, 1fr))'
              : 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: isMobile ? 8 : 12,
          }}
        >
          {photos.map((photo, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                borderRadius: 8,
                overflow: 'hidden',
                border: '2px solid var(--color-success)',
              }}
            >
              <img
                src={photo.previewUrl}
                alt={`Captured ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: 4, left: 4 }}>
                <LiveCapturedBadge size="small" />
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(index)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 4,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 8,
                }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera viewfinder or upload option */}
      {showCamera && canCapture && (
        <>
          {ALLOW_UPLOAD && (
            <Upload
              showUploadList={false}
              accept="image/*"
              multiple
              beforeUpload={(file) => {
                if (photos.length < maxPhotos) {
                  handleFileUpload(file)
                }
                return false
              }}
            >
              <Button icon={<UploadOutlined />} style={{ marginBottom: 8 }}>
                {t('uploadPhoto', 'Upload photo')}
              </Button>
            </Upload>
          )}
          <SecureCaptureUploader
            step={step}
            facingMode={facingMode}
            overlayType="document"
            qualityProfile={qualityProfile}
            onCapture={handleCapture}
            instruction={instruction || t('captureItemPhoto', 'Take a clear photo of your item')}
          />
        </>
      )}

      {/* Re-open camera button when closed manually */}
      {!showCamera && canCapture && (
        <Flex gap={8} wrap="wrap">
          <Button
            icon={<CameraOutlined />}
            onClick={() => setShowCamera(true)}
          >
            {t('captureMore', 'Capture more photos')}
          </Button>
          {ALLOW_UPLOAD && (
            <Upload
              showUploadList={false}
              accept="image/*"
              multiple
              beforeUpload={(file) => {
                if (photos.length < maxPhotos) {
                  handleFileUpload(file)
                }
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>
                {t('uploadPhoto', 'Upload photo')}
              </Button>
            </Upload>
          )}
        </Flex>
      )}

      {/* Max reached message */}
      {!canCapture && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('maxPhotosReached', 'Maximum {{max}} photos reached. Remove a photo to capture more.', { max: maxPhotos })}
        </Typography.Text>
      )}
    </Flex>
  )
}
