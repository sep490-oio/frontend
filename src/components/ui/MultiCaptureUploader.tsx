import { useState, useCallback } from 'react'
import { Button, Flex, Typography } from 'antd'
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import type { CaptureMetadata, CaptureStep } from '@/types/capture'

export interface CapturedPhoto {
  blob: Blob
  metadata: Partial<CaptureMetadata>
  previewUrl: string
}

interface MultiCaptureUploaderProps {
  maxPhotos?: number
  step?: CaptureStep
  facingMode?: 'user' | 'environment'
  onPhotosChange: (photos: CapturedPhoto[]) => void
  instruction?: string
}

export function MultiCaptureUploader({
  maxPhotos = 10,
  step = 'item_photo',
  facingMode = 'environment',
  onPhotosChange,
  instruction,
}: MultiCaptureUploaderProps) {
  const { t } = useTranslation('common')
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
      const updated = [...prev, newPhoto]
      onPhotosChange(updated)
      if (updated.length >= maxPhotos) {
        setShowCamera(false)
      }
      return updated
    })
  }, [maxPhotos, onPhotosChange])

  const handleRemove = useCallback((index: number) => {
    setPhotos((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      const updated = prev.filter((_, i) => i !== index)
      onPhotosChange(updated)
      if (updated.length < maxPhotos) {
        setShowCamera(true)
      }
      return updated
    })
  }, [maxPhotos, onPhotosChange])

  return (
    <Flex vertical gap={16}>
      {/* Counter */}
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        <CameraOutlined style={{ marginRight: 4 }} />
        {t('photoCaptured', '{{count}} / {{max}} photos captured', { count: photos.length, max: maxPhotos })}
      </Typography.Text>

      {/* Captured photos grid */}
      {photos.length > 0 && (
        <Flex wrap="wrap" gap={12}>
          {photos.map((photo, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: 120,
                height: 90,
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
        </Flex>
      )}

      {/* Camera viewfinder */}
      {showCamera && canCapture && (
        <SecureCaptureUploader
          step={step}
          facingMode={facingMode}
          overlayType="document"
          onCapture={handleCapture}
          instruction={instruction || t('captureItemPhoto', 'Take a clear photo of your item')}
        />
      )}

      {/* Re-open camera button when closed manually */}
      {!showCamera && canCapture && (
        <Button
          icon={<CameraOutlined />}
          onClick={() => setShowCamera(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          {t('captureMore', 'Capture more photos')}
        </Button>
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
