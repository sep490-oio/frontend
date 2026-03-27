import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Spin,
  List,
  App,
  Divider,
  Descriptions,
  Alert,
  Timeline,
} from 'antd'
import { ArrowLeftOutlined, FileOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useMyVerifications,
  useVerificationById,
  useSubmitVerification,
  useUploadVerificationDocument,
  useDeleteVerificationDocument,
} from '@/features/seller/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { VerificationDocumentSlots, getRequiredSlots } from '@/features/seller/components/VerificationDocumentSlots'
import { IdentityVerificationStatus } from '@/types/enums'
import { SendOutlined } from '@ant-design/icons'
import { TermsAcceptanceGate } from '@/features/user/components/TermsAcceptanceGate'
import { VerificationStatusView } from '@/features/seller/components/VerificationStatusView'
import { VerificationWizard } from '@/features/seller/components/VerificationWizard'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { formatDateTime } from '@/utils/format'

export default function VerificationPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isMobile } = useBreakpoint()

  const { data: verifications, isLoading } = useMyVerifications()
  const submitVerification = useSubmitVerification()
  const uploadDoc = useUploadVerificationDocument()
  const deleteDoc = useDeleteVerificationDocument()
  const mediaUpload = useMediaUpload('verification_image')
  const { message } = App.useApp()
  const [showWizard, setShowWizard] = useState(false)
  const [hasPendingTerms, setHasPendingTerms] = useState(false)

  const handleFileUpload = async (verificationId: string, file: File, documentType: string) => {
    try {
      const result = await mediaUpload.upload(file)
      await uploadDoc.mutateAsync({ verificationId, mediaUploadId: result.mediaUploadId, documentType })
      message.success(t('documentUploaded', 'Document uploaded'))
    } catch {
      message.error(t('documentUploadError', 'Failed to upload document'))
    }
  }

  const handleDeleteDoc = async (verificationId: string, docId: string) => {
    try {
      await deleteDoc.mutateAsync({ id: verificationId, docId })
      message.success(t('documentDeleted', 'Document deleted'))
    } catch {
      message.error(t('documentDeleteError', 'Failed to delete document'))
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      await submitVerification.mutateAsync(id)
      message.success(t('verificationSubmitted', 'Verification submitted for review'))
    } catch {
      message.error(t('verificationSubmitError', 'Failed to submit verification'))
    }
  }

  const activeSummary = verifications?.[0]
  const { data: activeVerification, isLoading: detailLoading, error: detailError, refetch: refetchDetail } = useVerificationById(activeSummary?.id ?? '')

  const currentStatus = activeSummary?.status ?? 'none'

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seller')}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('verification', 'Identity Verification')}
      </Typography.Title>

      <TermsAcceptanceGate
        termType="platform"
        title={t('platformTermsRequired', 'Platform Terms Required')}
        description={t('platformTermsDesc', 'Please accept the platform terms before proceeding.')}
        onPendingChange={setHasPendingTerms}
        redirect
      >
        {/* Wizard mode */}
        {showWizard && (
          <VerificationWizard
            onComplete={() => {
              setShowWizard(false)
              qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
            }}
            onCancel={() => setShowWizard(false)}
          />
        )}

        {/* Status view (when not in wizard mode) */}
        {!showWizard && (
          <>
            <VerificationStatusView
              status={currentStatus}
              verification={activeVerification}
              onStartVerification={() => setShowWizard(true)}
              onResubmit={() => setShowWizard(true)}
              hasPendingTerms={hasPendingTerms}
            />

            {/* Loading state for detail */}
            {activeSummary && detailLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
              </div>
            )}

            {activeSummary && detailError && (
              <Alert
                type="error"
                showIcon
                message={t('detailLoadError', 'Failed to load verification details')}
                action={<Button size="small" onClick={() => refetchDetail()}>{tc('action.retry', 'Retry')}</Button>}
                style={{ marginTop: 16 }}
              />
            )}

            {/* Document management for pending verifications */}
            {activeVerification && activeVerification.status === IdentityVerificationStatus.Pending && (
              <>
                <Card title={t('documents', 'Upload Documents')} style={{ marginTop: 16 }}>
                  <VerificationDocumentSlots
                    verificationType={activeVerification.verificationType}
                    documents={activeVerification.documents ?? []}
                    onUpload={(file, docType) => handleFileUpload(activeVerification.id, file, docType)}
                    onDelete={(docId) => handleDeleteDoc(activeVerification.id, docId)}
                    uploadLoading={uploadDoc.isPending || mediaUpload.uploading}
                  />
                </Card>

                {/* Submit button */}
                {(() => {
                  const requiredSlots = getRequiredSlots(activeVerification.verificationType)
                  const filledSlots = new Set(activeVerification.documents?.map((d) => d.documentType) ?? [])
                  const missingSlots = requiredSlots.filter((s) => !filledSlots.has(s))
                  const allFilled = missingSlots.length === 0

                  return (
                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        size="large"
                        block
                        onClick={() => handleSubmit(activeVerification.id)}
                        loading={submitVerification.isPending}
                        disabled={!allFilled}
                        style={{ height: 48, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                      >
                        {t('submitVerification', 'Submit for Review')}
                      </Button>
                      {!allFilled && (
                        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
                          {t('missingDocuments', 'Missing required documents')}: {missingSlots.join(', ')}
                        </Typography.Text>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            {/* Read-only detail card for non-pending verifications */}
            {activeVerification && activeVerification.status !== IdentityVerificationStatus.Pending && currentStatus !== 'none' && (
              <Card style={{ marginTop: 16 }}>
                {activeVerification.document && (
                  <>
                    <Typography.Title level={5}>{t('documentInfo', 'Document Information')}</Typography.Title>
                    <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                      <Descriptions.Item label={t('idType', 'ID Type')}>
                        {activeVerification.document.idType}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('idNumber', 'ID Number')}>
                        {activeVerification.document.idNumber}
                      </Descriptions.Item>
                    </Descriptions>
                    <Divider />
                  </>
                )}

                {activeVerification.documents && activeVerification.documents.length > 0 && (
                  <>
                    <Typography.Title level={5}>{t('documents', 'Documents')}</Typography.Title>
                    <List
                      size="small"
                      dataSource={activeVerification.documents}
                      renderItem={(doc) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<FileOutlined style={{ fontSize: 18 }} />}
                            title={
                              <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                                {doc.documentType}
                              </a>
                            }
                            description={<span style={{ fontSize: 12 }}>{formatDateTime(doc.uploadedAt)}</span>}
                          />
                        </List.Item>
                      )}
                    />
                    <Divider />
                  </>
                )}

                <Typography.Title level={5}>{t('timeline', 'Timeline')}</Typography.Title>
                <Timeline
                  items={[
                    { color: 'green', children: `${t('created', 'Created')} — ${formatDateTime(activeVerification.createdAt)}` },
                    ...(activeVerification.submittedAt ? [{ color: 'blue' as const, children: `${t('submitted', 'Submitted')} — ${formatDateTime(activeVerification.submittedAt)}` }] : []),
                    ...(activeVerification.verifiedAt ? [{ color: 'green' as const, children: `${t('verified', 'Verified')} — ${formatDateTime(activeVerification.verifiedAt)}` }] : []),
                    ...(activeVerification.rejectionReason ? [{ color: 'red' as const, children: `${t('rejected', 'Rejected')} — ${activeVerification.rejectionReason}` }] : []),
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </TermsAcceptanceGate>
    </div>
  )
}
