import { useState } from 'react'
import { Steps, Card, Button, Radio, Space, Typography, Flex, App, Spin } from 'antd'
import { IdcardOutlined, CameraOutlined, ShopOutlined, FileProtectOutlined, SendOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useCreateVerification, useSubmitVerification, useUploadVerificationDocument, useDeleteVerificationDocument, useVerificationById } from '@/features/seller/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { VerificationDocumentSlots, getRequiredSlots } from '@/features/seller/components/VerificationDocumentSlots'
import { VerificationType } from '@/types/enums'

interface VerificationWizardProps {
  onComplete: () => void
  onCancel: () => void
}

const TYPE_OPTIONS = [
  {
    value: VerificationType.GovernmentId,
    icon: <IdcardOutlined style={{ fontSize: 28 }} />,
    title: 'Government ID',
    description: 'National ID card or CCCD — front, back, and selfie photo',
  },
  {
    value: VerificationType.Passport,
    icon: <FileProtectOutlined style={{ fontSize: 28 }} />,
    title: 'Passport',
    description: 'Passport information page and selfie photo',
  },
  {
    value: VerificationType.BusinessOwner,
    icon: <ShopOutlined style={{ fontSize: 28 }} />,
    title: 'Business Owner',
    description: 'Business license and government ID front',
  },
]

export function VerificationWizard({ onComplete, onCancel }: VerificationWizardProps) {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedType, setSelectedType] = useState<string>('')
  const [verificationId, setVerificationId] = useState<string>('')
  const [creating, setCreating] = useState(false)

  const createVerification = useCreateVerification()
  const submitVerification = useSubmitVerification()
  const uploadDoc = useUploadVerificationDocument()
  const deleteDoc = useDeleteVerificationDocument()
  const mediaUpload = useMediaUpload('verification_image')

  const { data: verification, isLoading: detailLoading } = useVerificationById(verificationId)

  const handleNextFromType = async () => {
    if (!selectedType) return
    setCreating(true)
    try {
      const result = await createVerification.mutateAsync({ verificationType: selectedType })
      setVerificationId(result.id)
      setCurrentStep(1)
    } catch (err: unknown) {
      // If user already has a pending verification, exit wizard and show management view
      const errMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (errMsg.includes('pending') || errMsg.includes('submitted') || errMsg.includes('already')) {
        message.warning(t('alreadyHasPending', 'You already have a verification in progress. Returning to management view.'))
        onComplete() // exits wizard, invalidates queries → page shows existing verification
      } else {
        message.error(t('verificationCreateError', 'Failed to create verification'))
      }
    } finally {
      setCreating(false)
    }
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      const result = await mediaUpload.upload(file)
      await uploadDoc.mutateAsync({ verificationId, mediaUploadId: result.mediaUploadId, documentType })
      message.success(t('documentUploaded', 'Document uploaded'))
    } catch {
      message.error(t('documentUploadError', 'Failed to upload document'))
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDoc.mutateAsync({ id: verificationId, docId })
      message.success(t('documentDeleted', 'Document deleted'))
    } catch {
      message.error(t('documentDeleteError', 'Failed to delete document'))
    }
  }

  const handleSubmit = async () => {
    try {
      await submitVerification.mutateAsync(verificationId)
      message.success(t('verificationSubmitted', 'Verification submitted for review!'))
      onComplete()
    } catch {
      message.error(t('verificationSubmitError', 'Failed to submit verification'))
    }
  }

  const requiredSlots = selectedType ? getRequiredSlots(selectedType) : []
  const filledSlots = new Set(verification?.documents?.map((d) => d.documentType) ?? [])
  const allRequiredFilled = requiredSlots.every((s) => filledSlots.has(s))

  return (
    <Card>
      <Steps
        current={currentStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: t('stepType', 'Choose Type') },
          { title: t('stepDocuments', 'Upload Documents') },
          { title: t('stepReview', 'Review & Submit') },
        ]}
      />

      {/* Step 0: Choose Type */}
      {currentStep === 0 && (
        <div>
          <Typography.Title level={4} style={{ marginBottom: 16 }}>
            {t('selectVerificationType', 'Select Verification Type')}
          </Typography.Title>
          <Radio.Group value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {TYPE_OPTIONS.map((opt) => (
                <Radio key={opt.value} value={opt.value} style={{ width: '100%' }}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      borderColor: selectedType === opt.value ? 'var(--color-accent)' : undefined,
                      background: selectedType === opt.value ? 'rgba(139, 115, 85, 0.04)' : undefined,
                    }}
                  >
                    <Flex align="center" gap={16}>
                      <span style={{ color: 'var(--color-accent)' }}>{opt.icon}</span>
                      <div>
                        <Typography.Text strong>{t(`type.${opt.value}`, opt.title)}</Typography.Text>
                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {t(`typeDesc.${opt.value}`, opt.description)}
                        </Typography.Text>
                      </div>
                    </Flex>
                  </Card>
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          <Flex justify="space-between" style={{ marginTop: 24 }}>
            <Button onClick={onCancel}>{tc('action.cancel', 'Cancel')}</Button>
            <Button type="primary" onClick={handleNextFromType} disabled={!selectedType} loading={creating}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              {tc('action.next', 'Next')}
            </Button>
          </Flex>
        </div>
      )}

      {/* Step 1: Upload Documents */}
      {currentStep === 1 && (
        <div>
          <Typography.Title level={4} style={{ marginBottom: 8 }}>
            {t('uploadDocuments', 'Upload Documents')}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t('uploadDesc', 'Upload the required documents for your verification. Required documents are marked.')}
          </Typography.Paragraph>

          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : verification ? (
            <VerificationDocumentSlots
              verificationType={verification.verificationType}
              documents={verification.documents ?? []}
              onUpload={handleFileUpload}
              onDelete={handleDeleteDoc}
              uploadLoading={uploadDoc.isPending || mediaUpload.uploading}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          )}

          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 13 }}>
            {t('uploadProgress', 'Required documents')}: {requiredSlots.filter((s) => filledSlots.has(s)).length}/{requiredSlots.length}
          </Typography.Text>

          <Flex justify="space-between" style={{ marginTop: 24 }}>
            <Button onClick={() => setCurrentStep(0)}>{tc('action.back', 'Back')}</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)} disabled={!allRequiredFilled}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              {tc('action.next', 'Next')}
            </Button>
          </Flex>
        </div>
      )}

      {/* Step 2: Review & Submit */}
      {currentStep === 2 && (
        <div>
          <Typography.Title level={4} style={{ marginBottom: 16 }}>
            {t('reviewAndSubmit', 'Review & Submit')}
          </Typography.Title>

          <Card size="small" style={{ marginBottom: 16, background: 'var(--color-bg-surface)' }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Flex justify="space-between">
                <Typography.Text type="secondary">{t('verificationType', 'Type')}</Typography.Text>
                <Typography.Text strong>{selectedType}</Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text type="secondary">{t('documentsCount', 'Documents')}</Typography.Text>
                <Typography.Text strong>{verification?.documents?.length ?? 0} {t('uploaded', 'uploaded')}</Typography.Text>
              </Flex>
              {verification?.documents?.map((doc) => (
                <Flex key={doc.id} align="center" gap={8} style={{ fontSize: 13 }}>
                  <CameraOutlined style={{ color: 'var(--color-text-secondary)' }} />
                  <Typography.Text>{doc.documentType}</Typography.Text>
                </Flex>
              ))}
            </Space>
          </Card>

          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            {t('submitNote', 'Once submitted, your documents will be reviewed by our team. You will be notified of the result. This usually takes up to 24 hours.')}
          </Typography.Paragraph>

          <Flex justify="space-between" style={{ marginTop: 24 }}>
            <Button onClick={() => setCurrentStep(1)}>{tc('action.back', 'Back')}</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={submitVerification.isPending}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('submitForReview', 'Submit for Review')}
            </Button>
          </Flex>
        </div>
      )}
    </Card>
  )
}
