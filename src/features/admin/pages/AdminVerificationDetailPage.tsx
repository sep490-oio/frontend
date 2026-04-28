import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography, Descriptions, Card, Button, Space, Spin,
  Modal, Input, App, Image, Popconfirm, Grid, Drawer,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminVerificationDetail, useApproveVerification, useRejectVerification } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { IdentityVerificationStatus } from '@/types/enums'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'

const { useBreakpoint } = Grid

export default function AdminVerificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const { data: verification, isLoading, error, refetch } = useAdminVerificationDetail(id!)
  const approveVerification = useApproveVerification()
  const rejectVerification = useRejectVerification()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !verification) return <AdminErrorState message={t('common.error')} onRetry={refetch} backPath="/admin/verifications" />

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

  const isPending = verification.status === IdentityVerificationStatus.Pending ||
    verification.status === IdentityVerificationStatus.Submitted ||
    verification.status === IdentityVerificationStatus.UnderReview

  // Shared reject form content
  const RejectFormContent = (
    <>
      <Typography.Text strong>{t('verificationDetail.rejectReason')}</Typography.Text>
      <Input.TextArea
        rows={3}
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder={t('verificationDetail.rejectReasonPlaceholder')}
        style={{ marginTop: 8, fontSize: isMobile ? 16 : undefined }}
      />
    </>
  )

  return (
    <div style={{ paddingBottom: 80 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/verifications')}
          style={{ minHeight: 44 }}
        >
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('verificationDetail.title')}
      </Typography.Title>

      <Card title={t('verificationDetail.info')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size={isMobile ? 'small' : 'default'}>
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
        <Card title={t('verificationDetail.documents')} style={{ marginBottom: 16 }}>
          <Space wrap size={isMobile ? 'middle' : 'large'}>
            {verification.documents.map((doc) => (
              <div key={doc.id} style={{ textAlign: 'center' }}>
                <Image
                  src={doc.secureUrl}
                  width={isMobile ? 140 : 200}
                  style={{ borderRadius: 8 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: isMobile ? 12 : undefined }}>
                    {doc.documentType}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* Actions */}
      {isPending && (
        <Space
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: isMobile ? '100%' : undefined }}
          size={isMobile ? 8 : 'small'}
        >
          <Popconfirm
            title={t('verifications.approveConfirm', 'Are you sure you want to approve this verification?')}
            onConfirm={handleApprove}
          >
            <Button
              type="primary"
              loading={approveVerification.isPending}
              style={{ minHeight: 44, width: isMobile ? '100%' : undefined }}
            >
              {t('verifications.approve')}
            </Button>
          </Popconfirm>
          <Button
            danger
            style={{ minHeight: 44, width: isMobile ? '100%' : undefined }}
            onClick={() => setRejectModalOpen(true)}
          >
            {t('verifications.reject')}
          </Button>
        </Space>
      )}

      {/* Reject — Drawer on mobile, Modal on desktop */}
      {isMobile ? (
        <Drawer
          title={t('verifications.reject')}
          placement="bottom"
          height="auto"
          open={rejectModalOpen}
          onClose={() => { setRejectModalOpen(false); setRejectReason('') }}
          styles={{ body: { paddingBottom: 80 } }}
          extra={
            <Button
              danger
              type="primary"
              loading={rejectVerification.isPending}
              disabled={!rejectReason}
              onClick={handleReject}
              style={{ minHeight: 44 }}
            >
              {t('verifications.reject')}
            </Button>
          }
        >
          {RejectFormContent}
        </Drawer>
      ) : (
        <Modal
          title={t('verifications.reject')}
          open={rejectModalOpen}
          onOk={handleReject}
          onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
          confirmLoading={rejectVerification.isPending}
          okButtonProps={{ danger: true, style: { minHeight: 44 } }}
          cancelButtonProps={{ style: { minHeight: 44 } }}
        >
          {RejectFormContent}
        </Modal>
      )}
    </div>
  )
}
