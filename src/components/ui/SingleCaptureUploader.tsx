import { useState } from 'react'
import { Button, Flex, Modal, Typography, Upload } from 'antd'
import { CameraOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { CaptureQualityProfile } from '@/types/capture'

interface SingleCaptureUploaderProps {
  label: string
  required?: boolean
  file: File | null
  onChange: (file: File | null) => void
  allowUploadFallback: boolean
  cameraAvailable: boolean
  helpText?: string
  /** Quality profile for blur/brightness validation. Default 'item_or_package' (lenient). */
  qualityProfile?: CaptureQualityProfile
}

export function SingleCaptureUploader({
  label,
  required,
  file,
  onChange,
  allowUploadFallback,
  cameraAvailable,
  helpText,
  qualityProfile = 'item_or_package',
}: SingleCaptureUploaderProps) {
  const { t } = useTranslation('warehouse')
  const { isMobile } = useBreakpoint()
  const [open, setOpen] = useState(false)
  const [isLiveCapture, setIsLiveCapture] = useState(false)

  const previewUrl = file ? URL.createObjectURL(file) : undefined

  const handleCapture = (blob: Blob) => {
    const f = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
    onChange(f)
    setIsLiveCapture(true)
    setOpen(false)
  }

  const handleUpload = (f: File) => {
    onChange(f)
    setIsLiveCapture(false)
  }

  const showUploadButton = allowUploadFallback

  return (
    <div
      style={{
        border: '1px solid var(--color-border, #d9d9d9)',
        borderRadius: 8,
        padding: 12,
        background: 'var(--color-bg-surface, #fafafa)',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {label}
          {required && <span style={{ color: 'var(--color-error, #ff4d4f)' }}> *</span>}
        </Typography.Text>
        {file && isLiveCapture && <LiveCapturedBadge />}
      </Flex>

      {helpText && (
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          {helpText}
        </Typography.Text>
      )}

      {previewUrl ? (
        <div>
          <img
            src={previewUrl}
            alt={label}
            style={{
              width: '100%',
              maxHeight: isMobile ? '50vh' : 180,
              objectFit: 'cover',
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <Flex gap={8} wrap="wrap">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setOpen(true)}
              disabled={!cameraAvailable && !allowUploadFallback}
            >
              {t('retake', 'Retake')}
            </Button>
            {showUploadButton && (
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(f) => {
                  handleUpload(f as File)
                  return false
                }}
              >
                <Button size="small" icon={<UploadOutlined />}>
                  {t('uploadFileFallback', 'Upload file')}
                </Button>
              </Upload>
            )}
          </Flex>
          {showUploadButton && (
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              {t('uploadFallbackHint', 'Fallback for testing')}
            </Typography.Text>
          )}
        </div>
      ) : (
        <Flex vertical gap={8}>
          <Flex gap={8} wrap="wrap">
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={() => setOpen(true)}
              disabled={!cameraAvailable}
            >
              {t('openCamera', 'Open Camera')}
            </Button>
            {showUploadButton && (
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(f) => {
                  handleUpload(f as File)
                  return false
                }}
              >
                <Button icon={<UploadOutlined />}>{t('uploadFileFallback', 'Upload file')}</Button>
              </Upload>
            )}
          </Flex>
          {showUploadButton && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t('uploadFallbackHint', 'Fallback for testing')}
            </Typography.Text>
          )}
        </Flex>
      )}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
        centered={!isMobile}
        width={isMobile ? '100vw' : 640}
        styles={{
          body: { padding: isMobile ? 0 : undefined, overflow: 'hidden' },
          wrapper: isMobile ? { overflow: 'hidden' } : undefined,
        }}
        style={isMobile
          ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0, height: '100dvh' }
          : { borderRadius: 12, overflow: 'hidden' }
        }
        title={isMobile ? undefined : label}
      >
        <div style={{
          background: '#000',
          height: isMobile ? '100dvh' : 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {isMobile && (
            <div style={{
              padding: '10px 16px',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <Typography.Text style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
                {label}
              </Typography.Text>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <SecureCaptureUploader
              step="item_photo"
              facingMode="environment"
              overlayType="document"
              qualityProfile={qualityProfile}
              instruction={label}
              onCapture={(blob) => handleCapture(blob)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
