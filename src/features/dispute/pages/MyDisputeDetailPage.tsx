import { useState } from 'react'
import {
  Typography, Card, Tag, Space, Spin, Empty, Button, Input, Image,
  Upload, Tooltip, Progress, Alert, App,
} from 'antd'
import {
  SendOutlined, PaperClipOutlined, CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import DisputeAttachmentRenderer from '@/components/ui/DisputeAttachmentRenderer'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import {
  useMyDisputeDetail,
  useAddBuyerDisputeMessage,
  useAddBuyerDisputeEvidence,
} from '@/features/dispute/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DisputeStatus } from '@/types/enums'
import type { DisputeMessageV2Dto } from '@/types'
import dayjs from 'dayjs'

const STATUS_COLOR_MAP: Record<string, string> = {
  [DisputeStatus.Open]: 'blue',
  [DisputeStatus.AwaitingRespondent]: 'gold',
  [DisputeStatus.AwaitingEvidence]: 'gold',
  [DisputeStatus.UnderReview]: 'orange',
  [DisputeStatus.AwaitingInternalReview]: 'orange',
  [DisputeStatus.AwaitingResolutionApproval]: 'purple',
  [DisputeStatus.Resolved]: 'green',
  [DisputeStatus.Rejected]: 'red',
  [DisputeStatus.Cancelled]: 'default',
}

const TERMINAL_STATUSES = [DisputeStatus.Resolved, DisputeStatus.Rejected, DisputeStatus.Cancelled] as string[]

export default function MyDisputeDetailPage() {
  const { t } = useTranslation('dispute')
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
  const { message: msg } = App.useApp()
  const disputeId = id ?? ''

  const { data: dispute, isLoading } = useMyDisputeDetail(disputeId)
  const addMessage = useAddBuyerDisputeMessage()
  const addEvidence = useAddBuyerDisputeEvidence()
  const mediaUpload = useMediaUpload('dispute_attachment')

  const [messageText, setMessageText] = useState('')

  const isTerminal = TERMINAL_STATUSES.includes(dispute?.status ?? '')

  const handleSendMessage = async () => {
    const trimmed = messageText.trim()
    if (!trimmed || !disputeId) return
    try {
      await addMessage.mutateAsync({ id: disputeId, content: trimmed })
      setMessageText('')
    } catch {
      msg.error(t('sendError', 'Failed to send message'))
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const result = await mediaUpload.upload(file)
      await addEvidence.mutateAsync({ id: disputeId, mediaUploadId: result.mediaUploadId })
      msg.success(t('evidenceUploaded', 'Evidence uploaded'))
      mediaUpload.reset()
    } catch {
      msg.error(t('uploadError', 'Failed to upload evidence'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!dispute) {
    return <Empty description={t('notFound', 'Dispute not found')} />
  }

  const renderMessage = (m: DisputeMessageV2Dto) => (
    <div key={m.id} style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--color-bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--color-accent, #1677ff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          {m.authorDisplayName}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
          {dayjs(m.createdAt).format('DD/MM/YYYY HH:mm')}
        </Typography.Text>
      </div>
      <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
        {m.content}
      </Typography.Paragraph>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isMobile ? 16 : 0 }}>
      {/* Header */}
      <Card size="small">
        <Space wrap size="middle">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {dispute.disputeNumber}
          </Typography.Title>
          <Tag color={STATUS_COLOR_MAP[dispute.status] ?? 'default'}>{t(`statusLabel.${dispute.status}`, dispute.status)}</Tag>
          {dispute.domain && <Tag>{dispute.domain}</Tag>}
        </Space>
        {dispute.title && (
          <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
            {dispute.title}
          </Typography.Paragraph>
        )}
        {dispute.description && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {dispute.description}
          </Typography.Paragraph>
        )}
      </Card>

      {/* Resolution banner */}
      {isTerminal && (
        <Alert
          type={dispute.status === DisputeStatus.Resolved ? 'success' : 'info'}
          showIcon
          icon={dispute.status === DisputeStatus.Resolved ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          message={
            dispute.status === DisputeStatus.Resolved
              ? t('disputeResolved', 'This dispute has been resolved')
              : dispute.status === DisputeStatus.Cancelled
                ? t('disputeCancelled', 'This dispute was cancelled')
                : t('disputeClosedTitle', 'This dispute is closed')
          }
        />
      )}

      {/* Message thread */}
      <Card
        size="small"
        title={t('messages', 'Messages')}
        style={{ flex: 1 }}
        styles={{ body: { maxHeight: 500, overflow: 'auto' } }}
      >
        {(dispute.messages ?? []).length === 0 ? (
          <Empty description={t('noMessages', 'No messages yet')} />
        ) : (
          dispute.messages.map(renderMessage)
        )}
      </Card>

      {/* Evidence gallery */}
      {(dispute.evidence ?? []).length > 0 && (
        <Card size="small" title={t('evidence', 'Evidence')}>
          <Image.PreviewGroup>
            <Space wrap>
              {dispute.evidence.map((e) => (
                <DisputeAttachmentRenderer
                  key={e.id}
                  resourceType={e.resourceType}
                  format={e.format}
                  secureUrl={e.secureUrl ?? ''}
                  fileName={e.fileName}
                  bytes={e.bytes}
                  durationSeconds={e.durationSeconds}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* Message input + evidence upload */}
      {!isTerminal && (
        <Card size="small">
          {mediaUpload.uploading && (
            <Progress percent={Math.round(mediaUpload.progress)} size="small" style={{ marginBottom: 8 }} />
          )}
          {mediaUpload.error && (
            <Typography.Text type="danger" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
              {mediaUpload.error}
            </Typography.Text>
          )}
          <Space.Compact style={{ width: '100%' }}>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleFileUpload(file)
                return false
              }}
              disabled={mediaUpload.uploading}
            >
              <Tooltip title={t('addEvidence', 'Add evidence')}>
                <Button icon={<PaperClipOutlined />} loading={mediaUpload.uploading} />
              </Tooltip>
            </Upload>
            <Input.TextArea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('messagePlaceholder', 'Type a message...')}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={addMessage.isPending}
              disabled={!messageText.trim()}
            >
              {t('send', 'Send')}
            </Button>
          </Space.Compact>
        </Card>
      )}
    </div>
  )
}
