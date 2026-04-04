import { useState } from 'react'
import { Card, Button, Typography, Flex, Image, Tag, Steps, Space, Modal } from 'antd'
import { DeleteOutlined, CheckCircleOutlined, CameraOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { VerificationDocumentDto } from '@/types'

interface SlotConfig {
  type: string
  label: string
  required: boolean
  accept: string
}

const SLOT_CONFIGS: Record<string, SlotConfig[]> = {
  government_id: [
    { type: 'id_front', label: 'ID Front', required: true, accept: 'image/*' },
    { type: 'id_back', label: 'ID Back', required: false, accept: 'image/*' },
    { type: 'selfie', label: 'Selfie', required: true, accept: 'image/*' },
  ],
  passport: [
    { type: 'id_front', label: 'Passport Page', required: true, accept: 'image/*' },
    { type: 'selfie', label: 'Selfie', required: true, accept: 'image/*' },
  ],
  business_owner: [
    { type: 'business_license', label: 'Business License', required: true, accept: 'image/*,.pdf' },
    { type: 'id_front', label: 'ID Front', required: true, accept: 'image/*' },
  ],
  manual: [
    { type: 'other', label: 'Document', required: true, accept: 'image/*,.pdf' },
  ],
}

const STEP_GUIDES: Record<string, { title: string; tips: string[] }> = {
  id_front: {
    title: 'Capture ID Front',
    tips: [
      'Place your ID on a flat, well-lit surface',
      'Make sure all text and photo are clearly visible',
      'Avoid glare and shadows on the card',
    ],
  },
  id_back: {
    title: 'Capture ID Back',
    tips: [
      'Flip your ID card over',
      'Ensure the barcode/MRZ zone is fully visible',
      'Keep the card flat and steady',
    ],
  },
  selfie: {
    title: 'Take a Selfie',
    tips: [
      'Face the camera directly with a neutral expression',
      'Ensure good lighting on your face — no harsh shadows',
      'Remove glasses, hats, or face coverings',
      'Hold the phone at eye level',
    ],
  },
  business_license: {
    title: 'Capture Business License',
    tips: [
      'Ensure the full document is visible',
      'All text must be legible',
    ],
  },
  other: {
    title: 'Capture Document',
    tips: ['Ensure the full document is clearly visible'],
  },
}

export function getRequiredSlots(verificationType: string): string[] {
  const slots = SLOT_CONFIGS[verificationType] ?? SLOT_CONFIGS.manual
  return slots.filter((s) => s.required).map((s) => s.type)
}

interface VerificationDocumentSlotsProps {
  verificationType: string
  documents: VerificationDocumentDto[]
  onUpload: (file: File, documentType: string) => Promise<void>
  onDelete: (docId: string) => void
  uploadLoading: boolean
}

export function VerificationDocumentSlots({
  verificationType,
  documents,
  onUpload,
  onDelete,
  uploadLoading: _uploadLoading,
}: VerificationDocumentSlotsProps) {
  const { t } = useTranslation('seller')
  const { isMobile } = useBreakpoint()
  const slots = SLOT_CONFIGS[verificationType] ?? SLOT_CONFIGS.manual
  const [activeStep, setActiveStep] = useState(0)
  const [cameraOpen, setCameraOpen] = useState(false)

  const getDocForSlot = (type: string) =>
    documents.find((d) => d.documentType === type)

  const currentSlot = slots[activeStep]
  const currentDoc = currentSlot ? getDocForSlot(currentSlot.type) : undefined
  const guide = currentSlot ? (STEP_GUIDES[currentSlot.type] ?? STEP_GUIDES.other) : STEP_GUIDES.other

  const handleCaptured = (blob: Blob) => {
    const file = new File([blob], `${currentSlot.type}.jpg`, { type: 'image/jpeg' })
    setCameraOpen(false)
    void onUpload(file, currentSlot.type).then(() => {
      // Auto-advance to next incomplete slot
      const nextIncomplete = slots.findIndex((s, i) => i > activeStep && !getDocForSlot(s.type))
      if (nextIncomplete !== -1) {
        setActiveStep(nextIncomplete)
      }
    })
  }

  return (
    <Flex vertical gap={20}>
      {/* Step indicator */}
      <Steps
        current={activeStep}
        size="small"
        direction={isMobile ? 'vertical' : 'horizontal'}
        items={slots.map((slot, idx) => {
          const doc = getDocForSlot(slot.type)
          return {
            title: t(`docSlot.${slot.type}`, slot.label),
            description: doc ? t('captured', 'Captured') : slot.required ? t('required', 'Required') : t('optional', 'Optional'),
            status: doc ? 'finish' as const : idx === activeStep ? 'process' as const : 'wait' as const,
            icon: doc ? <CheckCircleOutlined style={{ color: 'var(--color-success)' }} /> : undefined,
          }
        })}
        onChange={(step) => setActiveStep(step)}
        style={{ maxWidth: isMobile ? undefined : 500 }}
      />

      {/* Active document slot */}
      {currentSlot && (
        <Card
          style={{
            maxWidth: isMobile ? undefined : 480,
            borderColor: currentDoc ? 'rgba(74, 124, 89, 0.3)' : currentSlot.required ? 'rgba(196, 146, 61, 0.3)' : 'var(--color-border)',
            background: currentDoc ? 'rgba(74, 124, 89, 0.04)' : undefined,
          }}
        >
          <Flex vertical gap={16}>
            {/* Header */}
            <Flex vertical align="center" gap={6}>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {t(`docSlot.${currentSlot.type}`, currentSlot.label)}
              </Typography.Text>
              <Tag color={currentSlot.required ? 'warning' : 'default'} style={{ fontSize: 11 }}>
                {currentSlot.required ? t('required', 'Required') : t('recommended', 'Recommended')}
              </Tag>
            </Flex>

            {currentDoc ? (
              /* Captured state */
              <Flex vertical align="center" gap={12}>
                {currentDoc.secureUrl && (
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={currentDoc.secureUrl}
                      alt={currentSlot.label}
                      width="100%"
                      style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                      preview
                    />
                    <div style={{ position: 'absolute', top: 6, left: 6 }}>
                      <LiveCapturedBadge size="small" />
                    </div>
                  </div>
                )}
                <Flex align="center" gap={4}>
                  <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 14 }} />
                  <Typography.Text style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 500 }}>
                    {t('photoCaptured', 'Photo captured')}
                  </Typography.Text>
                </Flex>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(currentDoc.id)}
                >
                  {t('retake', 'Retake')}
                </Button>
              </Flex>
            ) : (
              /* Not captured — show guide + open camera button */
              <Flex vertical gap={12}>
                {/* Tips */}
                <div style={{
                  background: 'var(--color-bg-surface)',
                  borderRadius: 8,
                  padding: isMobile ? 12 : 16,
                }}>
                  <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                    {guide.title}
                  </Typography.Text>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {guide.tips.map((tip, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Open camera button */}
                <Button
                  type="primary"
                  size="large"
                  icon={<CameraOutlined />}
                  onClick={() => setCameraOpen(true)}
                  block
                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', height: 48 }}
                >
                  {t('openCamera', 'Open Camera')}
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
      )}

      {/* Navigation */}
      <Space>
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => s - 1)}
        >
          {t('previous', 'Previous')}
        </Button>
        <Button
          icon={<ArrowRightOutlined />}
          disabled={activeStep === slots.length - 1}
          onClick={() => setActiveStep((s) => s + 1)}
        >
          {t('next', 'Next')}
        </Button>
      </Space>

      {/* Fullscreen Camera Modal */}
      {currentSlot && (
        <Modal
          open={cameraOpen}
          onCancel={() => setCameraOpen(false)}
          footer={null}
          closable
          centered={!isMobile}
          width={isMobile ? '100vw' : 600}
          styles={{
            body: { padding: 0, overflow: 'hidden' },
            wrapper: isMobile ? { overflow: 'hidden' } : undefined,
          }}
          style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0, height: '100dvh' } : { borderRadius: 12, overflow: 'hidden' }}
          destroyOnClose
        >
          <div style={{ background: '#000', height: isMobile ? '100dvh' : 'auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Guide header inside modal */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              textAlign: 'center',
            }}>
              <Typography.Text style={{ color: '#fff', fontSize: 15, fontWeight: 600, display: 'block' }}>
                {t(`docSlot.${currentSlot.type}`, currentSlot.label)}
              </Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {guide.tips[0]}
              </Typography.Text>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SecureCaptureUploader
                step={currentSlot.type as 'id_front' | 'id_back' | 'selfie'}
                facingMode={currentSlot.type === 'selfie' ? 'user' : 'environment'}
                overlayType={currentSlot.type === 'selfie' ? 'face' : 'document'}
                onCapture={(blob) => handleCaptured(blob)}
                instruction={guide.tips[0]}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Thumbnail summary of all docs */}
      {documents.length > 0 && (
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {t('capturedDocuments', 'Captured documents')}
          </Typography.Text>
          <Flex gap={8} wrap="wrap">
            {slots.map((slot) => {
              const doc = getDocForSlot(slot.type)
              if (!doc?.secureUrl) return null
              return (
                <div
                  key={slot.type}
                  onClick={() => setActiveStep(slots.indexOf(slot))}
                  style={{
                    position: 'relative',
                    width: 72,
                    height: 54,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: activeStep === slots.indexOf(slot)
                      ? '2px solid var(--color-accent)'
                      : '2px solid var(--color-success)',
                    cursor: 'pointer',
                  }}
                >
                  <img src={doc.secureUrl} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: 9,
                    textAlign: 'center',
                    padding: '1px 0',
                  }}>
                    {slot.label}
                  </div>
                </div>
              )
            })}
          </Flex>
        </div>
      )}
    </Flex>
  )
}
