import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Button, Space, Spin, Alert, Modal, Input, App, Image } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminVerificationDetail, useApproveVerification, useRejectVerification } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { IdentityVerificationStatus } from '@/types/enums'

export default function AdminVerificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const { data: verification, isLoading, error } = useAdminVerificationDetail(id!)
  const approveVerification = useApproveVerification()
  const rejectVerification = useRejectVerification()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !verification) return <Alert type="error" message={t('common.error')} showIcon />

  const handleApprove = async () => {
    try {
      await approveVerification.mutateAsync(id!)
      message.success(t('verifications.approveSuccess'))
      navigate('/admin/verifications')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectVerification.mutateAsync({ id: id!, reason: rejectReason })
      message.success(t('verifications.rejectSuccess'))
      setRejectModalOpen(false)
      navigate('/admin/verifications')
    } catch {
      message.error(t('common.error'))
    }
  }

  const isPending = verification.status === IdentityVerificationStatus.Pending

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/verifications')}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('verificationDetail.title')}
      </Typography.Title>

      <Card title={t('verificationDetail.info')} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label={t('common.id')}>{verification.id}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.user')}>{verification.userId}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.type')}>{verification.verificationType}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.idType')}>{verification.document?.idType ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('verificationDetail.idNumber')}>{verification.document?.idNumber ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.status')}>
            <StatusBadge status={verification.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('verifications.submittedAt')}>
            {verification.submittedAt ? formatDateTime(verification.submittedAt) : '-'}
          </Descriptions.Item>
          {verification.verifiedAt && (
            <Descriptions.Item label={t('verificationDetail.approvedAt')}>
              {formatDateTime(verification.verifiedAt)}
            </Descriptions.Item>
          )}
          {verification.rejectionReason && (
            <Descriptions.Item label={t('verificationDetail.rejectedAt')}>
              {verification.rejectionReason}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Documents */}
      {verification.documents && verification.documents.length > 0 && (
        <Card title={t('verificationDetail.documents')} style={{ marginBottom: 24 }}>
          <Space wrap size="large">
            {verification.documents.map((doc) => (
              <div key={doc.id} style={{ textAlign: 'center' }}>
                <Image
                  src={doc.secureUrl}
                  width={200}
                  style={{ borderRadius: 8 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary">{doc.documentType}</Typography.Text>
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* Actions */}
      {isPending && (
        <Space>
          <Button type="primary" onClick={handleApprove} loading={approveVerification.isPending}>
            {t('verifications.approve')}
          </Button>
          <Button danger onClick={() => setRejectModalOpen(true)}>
            {t('verifications.reject')}
          </Button>
        </Space>
      )}

      {/* Reject modal */}
      <Modal
        title={t('verifications.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectVerification.isPending}
      >
        <Typography.Text strong>{t('verificationDetail.rejectReason')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('verificationDetail.rejectReasonPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  )
}
