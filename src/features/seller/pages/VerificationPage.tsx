import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Spin,
  App,
  Divider,
  Descriptions,
  Alert,
  Timeline,
  Image,
  Row,
  Col,
} from 'antd'
import { ArrowLeftOutlined, FileOutlined, LockOutlined, CheckCircleOutlined, FileAddOutlined, CloseCircleOutlined } from '@ant-design/icons'
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
import { SANS_FONT } from '@/styles/tokens'

const { Text } = Typography

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px 16px 48px' : '0 24px 48px', width: '100%', boxSizing: 'border-box' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/seller')}
          style={{ marginBottom: 16, minHeight: 40, paddingLeft: 0, color: 'var(--color-text-secondary)' }}
        >
          {tc('action.back', 'Back to Seller Center')}
        </Button>
        <Typography.Title 
          level={2} 
          style={{ 
            margin: 0, 
            fontFamily: SANS_FONT, 
            fontWeight: 600,
            fontSize: isMobile ? 24 : 32,
            color: 'var(--color-text-primary)'
          }}
        >
          {t('verification', 'Identity Verification')}
        </Typography.Title>
        <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 16, marginTop: 4, display: 'block' }}>
          {t('verificationSubtitle', 'Verify your identity to unlock selling features')}
        </Typography.Text>
      </div>

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
                action={
                  <Button size="small" onClick={() => refetchDetail()} style={{ minHeight: 32 }}>
                    {tc('action.retry', 'Retry')}
                  </Button>
                }
                style={{ marginTop: 16, borderRadius: 12 }}
              />
            )}

            {/* Document management for pending verifications */}
            {activeVerification && activeVerification.status === IdentityVerificationStatus.Pending && (
              <>
                <Card
                  title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('documents', 'Upload Documents')}</span>}
                  style={{ 
                    marginTop: 24, 
                    borderRadius: 24, 
                    border: '1px solid var(--color-border)', 
                    background: 'var(--color-bg-container)',
                    backdropFilter: 'var(--oio-blur)',
                    WebkitBackdropFilter: 'var(--oio-blur)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
                >
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
                    <div style={{ marginTop: 24 }}>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        size="large"
                        block
                        onClick={() => handleSubmit(activeVerification.id)}
                        loading={submitVerification.isPending}
                        disabled={!allFilled}
                        style={{ 
                          height: 52, 
                          background: 'var(--color-accent)', 
                          borderColor: 'var(--color-accent)',
                          borderRadius: 12,
                          fontWeight: 600,
                          fontSize: 16
                        }}
                      >
                        {t('submitVerification', 'Submit for Review')}
                      </Button>
                      {!allFilled && (
                        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13 }}>
                          <LockOutlined style={{ marginRight: 6 }} />
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
              <Card 
                style={{ 
                  marginTop: 24, 
                  borderRadius: 24, 
                  border: '1px solid var(--color-border)', 
                  background: 'var(--color-bg-container)',
                  backdropFilter: 'var(--oio-blur)',
                  WebkitBackdropFilter: 'var(--oio-blur)',
                  boxShadow: 'var(--shadow-md)'
                }} 
                styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
              >
                {activeVerification.document && (
                  <>
                    <Typography.Title level={5} style={{ fontSize: 16, fontFamily: SANS_FONT, fontWeight: 600, marginBottom: 16 }}>
                      {t('documentInfo', 'Document Information')}
                    </Typography.Title>
                    {isMobile ? (
                      // Mobile: stacked rows
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                          { label: t('idType', 'ID Type'), value: activeVerification.document.idType },
                          { label: t('idNumber', 'ID Number'), value: activeVerification.document.idNumber },
                        ].map((item) => (
                          <div key={item.label}>
                            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Descriptions column={2} size="small" layout="vertical">
                        <Descriptions.Item label={<span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{t('idType', 'ID Type')}</span>}>
                          <span style={{ fontSize: 15, fontWeight: 500 }}>{activeVerification.document.idType}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label={<span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>{t('idNumber', 'ID Number')}</span>}>
                          <span style={{ fontSize: 15, fontWeight: 500 }}>{activeVerification.document.idNumber}</span>
                        </Descriptions.Item>
                      </Descriptions>
                    )}
                    <Divider style={{ margin: '20px 0' }} />
                  </>
                )}

                {activeVerification.documents && activeVerification.documents.length > 0 && (
                  <>
                    <Typography.Title level={5} style={{ fontSize: 16, fontFamily: SANS_FONT, fontWeight: 600, marginBottom: 16 }}>
                      {t('documents', 'Documents')}
                    </Typography.Title>
                    <Row gutter={[16, 16]}>
                      {activeVerification.documents.map((doc) => {
                        const isImage = /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(doc.secureUrl);
                        return (
                          <Col xs={24} sm={12} md={8} key={doc.id || doc.documentType}>
                            <Card 
                              size="small" 
                              hoverable 
                              style={{ borderRadius: 16, overflow: 'hidden' }}
                              styles={{ body: { padding: 12 } }}
                            >
                              {isImage ? (
                                <Image
                                  src={doc.secureUrl}
                                  alt={doc.documentType}
                                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }}
                                />
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  aspectRatio: '16/9', 
                                  background: 'var(--color-bg-surface)', 
                                  borderRadius: 8, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer">
                                    <FileOutlined style={{ fontSize: 32, color: 'var(--color-accent)' }} />
                                  </a>
                                </div>
                              )}
                              <div style={{ marginTop: 12 }}>
                                <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
                                  {isImage ? doc.documentType : (
                                    <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)' }}>
                                      {doc.documentType}
                                    </a>
                                  )}
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  {formatDateTime(doc.uploadedAt)}
                                </Typography.Text>
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                    <Divider style={{ margin: '20px 0' }} />
                  </>
                )}

                <Typography.Title level={5} style={{ fontSize: 16, fontFamily: SANS_FONT, fontWeight: 600, marginBottom: 20 }}>
                  {t('timeline', 'Timeline')}
                </Typography.Title>
                <Timeline
                  items={[
                    { 
                      color: 'green', 
                      dot: <FileAddOutlined style={{ fontSize: 16 }} />,
                      children: <div style={{ fontSize: 14, paddingBottom: 12 }}><Text strong>{t('created', 'Created')}</Text><br/><Text type="secondary">{formatDateTime(activeVerification.createdAt)}</Text></div> 
                    },
                    ...(activeVerification.submittedAt ? [{ 
                      color: 'blue' as const, 
                      dot: <SendOutlined style={{ fontSize: 16 }} />,
                      children: <div style={{ fontSize: 14, paddingBottom: 12 }}><Text strong>{t('submitted', 'Submitted')}</Text><br/><Text type="secondary">{formatDateTime(activeVerification.submittedAt)}</Text></div> 
                    }] : []),
                    ...(activeVerification.verifiedAt ? [{ 
                      color: 'green' as const, 
                      dot: <CheckCircleOutlined style={{ fontSize: 16 }} />,
                      children: <div style={{ fontSize: 14, paddingBottom: 12 }}><Text strong>{t('verified', 'Verified')}</Text><br/><Text type="secondary">{formatDateTime(activeVerification.verifiedAt)}</Text></div> 
                    }] : []),
                    ...(activeVerification.rejectionReason ? [{ 
                      color: 'red' as const, 
                      dot: <CloseCircleOutlined style={{ fontSize: 16 }} />,
                      children: <div style={{ fontSize: 14, paddingBottom: 12 }}><Text strong style={{ color: 'var(--color-danger)' }}>{t('rejected', 'Rejected')}</Text><br/><Text type="danger">{activeVerification.rejectionReason}</Text></div> 
                    }] : []),
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
