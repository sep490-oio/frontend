import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Spin,
  Form,
  Select,
  Timeline,
  List,
  Upload,
  App,
  Empty,
  Divider,
  Descriptions,
} from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useMyVerifications,
  useCreateVerification,
  useSubmitVerification,
  useUploadVerificationDocument,
  useDeleteVerificationDocument,
} from '@/features/seller/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { VerificationType, IdentityVerificationStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { VerificationDto } from '@/types'

const VERIFICATION_TYPE_OPTIONS = Object.entries(VerificationType).map(([label, value]) => ({
  label,
  value,
}))

const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
  [IdentityVerificationStatus.Approved]: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  [IdentityVerificationStatus.Rejected]: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  [IdentityVerificationStatus.Pending]: <ClockCircleOutlined style={{ color: '#faad14' }} />,
  [IdentityVerificationStatus.Unverified]: <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
}

export default function VerificationPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const { data: verifications, isLoading } = useMyVerifications()
  const createVerification = useCreateVerification()
  const submitVerification = useSubmitVerification()
  const uploadDoc = useUploadVerificationDocument()
  const deleteDoc = useDeleteVerificationDocument()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form] = Form.useForm()

  const handleCreate = async (values: { verificationType: string }) => {
    try {
      await createVerification.mutateAsync({ verificationType: values.verificationType })
      message.success(t('verificationCreated', 'Verification request created'))
      setShowCreateForm(false)
      form.resetFields()
    } catch {
      message.error(t('verificationCreateError', 'Failed to create verification'))
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

  const handleUpload = async (verificationId: string, file: File) => {
    try {
      await uploadDoc.mutateAsync({ id: verificationId, file })
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

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  const activeVerification = verifications?.[0]

  const buildTimeline = (v: VerificationDto) => {
    const items: { color: string; children: string }[] = [
      {
        color: 'green',
        children: `${t('created', 'Created')} - ${formatDateTime(v.createdAt)}`,
      },
    ]
    if (v.submittedAt) {
      items.push({
        color: 'blue' as const,
        children: `${t('submitted', 'Submitted')} - ${formatDateTime(v.submittedAt)}`,
      })
    }
    if (v.verifiedAt) {
      items.push({
        color: 'green' as const,
        children: `${t('verified', 'Verified')} - ${formatDateTime(v.verifiedAt)}`,
      })
    }
    if (v.rejectionReason) {
      items.push({
        color: 'red' as const,
        children: `${t('rejected', 'Rejected')} - ${v.rejectionReason}`,
      })
    }
    return items
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/me/seller')}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('verification', 'Verification')}</Typography.Title>

      {/* No verification yet */}
      {!activeVerification && !showCreateForm && (
        <Empty description={t('noVerification', 'No verification request yet')}>
          <Button type="primary" onClick={() => setShowCreateForm(true)}>
            {t('startVerification', 'Start Verification')}
          </Button>
        </Empty>
      )}

      {/* Create Form */}
      {showCreateForm && !activeVerification && (
        <Card title={t('newVerification', 'New Verification Request')}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
          >
            <Form.Item
              name="verificationType"
              label={t('verificationType', 'Verification Type')}
              rules={[{ required: true, message: t('typeRequired', 'Please select verification type') }]}
            >
              <Select
                options={VERIFICATION_TYPE_OPTIONS}
                placeholder={t('selectType', 'Select type')}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={createVerification.isPending}>
                  {tc('action.create', 'Create')}
                </Button>
                <Button onClick={() => setShowCreateForm(false)}>
                  {tc('action.cancel', 'Cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Active Verification */}
      {activeVerification && (
        <>
          {/* Status & Info */}
          <Card style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space>
                {STATUS_ICON_MAP[activeVerification.status]}
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {t('verificationStatus', 'Verification Status')}
                </Typography.Title>
              </Space>
              <StatusBadge status={activeVerification.status} />
            </Space>

            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t('type', 'Type')}>
                {activeVerification.verificationType}
              </Descriptions.Item>
              {activeVerification.fullName && (
                <Descriptions.Item label={t('fullName', 'Full Name')}>
                  {activeVerification.fullName}
                </Descriptions.Item>
              )}
              {activeVerification.autoVerified && (
                <Descriptions.Item label={t('autoVerified', 'Auto Verified')}>
                  {t('yes', 'Yes')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('attemptCount', 'Attempts')}>
                {activeVerification.attemptCount}
              </Descriptions.Item>
            </Descriptions>

            {/* Document info (nested) */}
            {activeVerification.document && (
              <>
                <Divider />
                <Typography.Title level={5}>{t('documentInfo', 'Document Information')}</Typography.Title>
                <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label={t('idType', 'ID Type')}>
                    {activeVerification.document.idType}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('idNumber', 'ID Number')}>
                    {activeVerification.document.idNumber}
                  </Descriptions.Item>
                  {activeVerification.document.issuedDate && (
                    <Descriptions.Item label={t('issuedDate', 'Issued Date')}>
                      {activeVerification.document.issuedDate}
                    </Descriptions.Item>
                  )}
                  {activeVerification.document.issuedPlace && (
                    <Descriptions.Item label={t('issuedPlace', 'Issued Place')}>
                      {activeVerification.document.issuedPlace}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {/* Address info (nested) */}
            {activeVerification.permanentAddress && (
              <>
                <Divider />
                <Typography.Title level={5}>{t('address', 'Permanent Address')}</Typography.Title>
                <Typography.Text>
                  {activeVerification.permanentAddress.fullAddress}
                </Typography.Text>
              </>
            )}

            <Divider />

            <Typography.Title level={5}>{t('timeline', 'Timeline')}</Typography.Title>
            <Timeline items={buildTimeline(activeVerification)} />
          </Card>

          {/* Documents */}
          <Card
            title={t('documents', 'Documents')}
            style={{ marginBottom: 16 }}
            extra={
              activeVerification.status === IdentityVerificationStatus.Pending && (
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUpload(activeVerification.id, file)
                    return false
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadDoc.isPending}>
                    {t('uploadDocument', 'Upload Document')}
                  </Button>
                </Upload>
              )
            }
          >
            {activeVerification.documents && activeVerification.documents.length > 0 ? (
              <List
                dataSource={activeVerification.documents}
                renderItem={(doc) => (
                  <List.Item
                    actions={
                      activeVerification.status === IdentityVerificationStatus.Pending
                        ? [
                            <Button
                              key="delete"
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteDoc(activeVerification.id, doc.id)}
                              loading={deleteDoc.isPending}
                            />,
                          ]
                        : undefined
                    }
                  >
                    <List.Item.Meta
                      avatar={<FileOutlined style={{ fontSize: 24 }} />}
                      title={
                        <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer">
                          {doc.documentType || t('document', 'Document')}
                        </a>
                      }
                      description={`${doc.verificationStatus} - ${formatDateTime(doc.uploadedAt)}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">
                {t('noDocuments', 'No documents uploaded yet')}
              </Typography.Text>
            )}
          </Card>

          {/* Submit Button */}
          {activeVerification.status === IdentityVerificationStatus.Pending && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              block
              onClick={() => handleSubmit(activeVerification.id)}
              loading={submitVerification.isPending}
              disabled={!activeVerification.documents?.length}
            >
              {t('submitVerification', 'Submit for Review')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
