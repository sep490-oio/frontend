import { Card, Button, Typography, Flex, Image, Tag } from 'antd'
import { DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { SecureCaptureUploader } from '@/components/ui/SecureCaptureUploader'
import { useTranslation } from 'react-i18next'
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
  const slots = SLOT_CONFIGS[verificationType] ?? SLOT_CONFIGS.manual

  const getDocForSlot = (type: string) =>
    documents.find((d) => d.documentType === type)

  return (
    <Flex gap={12} wrap="wrap">
      {slots.map((slot) => {
        const doc = getDocForSlot(slot.type)
        return (
          <Card
            key={slot.type}
            size="small"
            style={{
              width: 200,
              borderColor: doc ? 'rgba(74, 124, 89, 0.3)' : slot.required ? 'rgba(196, 146, 61, 0.3)' : 'var(--color-border)',
              background: doc ? 'rgba(74, 124, 89, 0.04)' : undefined,
            }}
          >
            <Flex vertical align="center" gap={8}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {t(`docSlot.${slot.type}`, slot.label)}
              </Typography.Text>
              <Tag color={slot.required ? 'warning' : 'default'} style={{ fontSize: 10 }}>
                {slot.required ? t('required', 'Required') : t('recommended', 'Recommended')}
              </Tag>

              {doc ? (
                <>
                  {doc.secureUrl && (
                    <Image
                      src={doc.secureUrl}
                      alt={slot.label}
                      width={160}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      preview
                    />
                  )}
                  <Flex align="center" gap={4}>
                    <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 12 }} />
                    <Typography.Text style={{ fontSize: 11, color: 'var(--color-success)' }}>
                      {t('uploaded', 'Uploaded')}
                    </Typography.Text>
                  </Flex>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(doc.id)}
                  >
                    {t('remove', 'Remove')}
                  </Button>
                </>
              ) : (
                <SecureCaptureUploader
                  step={slot.type as 'id_front' | 'id_back' | 'selfie'}
                  facingMode={slot.type === 'selfie' ? 'user' : 'environment'}
                  overlayType={slot.type === 'selfie' ? 'face' : 'document'}
                  onCapture={(blob) => {
                    const file = new File([blob], `${slot.type}.jpg`, { type: 'image/jpeg' })
                    void onUpload(file, slot.type)
                  }}
                />
              )}
            </Flex>
          </Card>
        )
      })}
    </Flex>
  )
}
