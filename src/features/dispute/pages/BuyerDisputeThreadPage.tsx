import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Typography, Card, Tag, Space, Spin, Empty, Button, Input,
  List, Alert, Tooltip, Progress, Upload, App, Image,
} from 'antd'
import {
  SendOutlined, PaperClipOutlined, UserOutlined,
  CloseCircleOutlined, CheckCircleOutlined, CheckOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import {
  useDisputeThread,
  useDisputeMessages,
  useSendDisputeMessage,
  useMarkDisputeRead,
} from '@/features/dispute/api'
import { useDisputeHub } from '@/features/dispute/hooks/useDisputeHub'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useCurrentUser } from '@/features/user/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DisputeStatus } from '@/types/enums'
import DisputeAttachmentRenderer from '@/components/ui/DisputeAttachmentRenderer'
import type { DisputeMessageDto } from '@/types'
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

function getUploadContext(file: File): string | null {
  if (file.type.startsWith('image/')) return 'dispute_attachment'
  if (file.type.startsWith('video/')) return 'dispute_attachment_video'
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'dispute_attachment_document'
  return null
}

export default function BuyerDisputeThreadPage() {
  const { t } = useTranslation('dispute')
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
  const { message: msg } = App.useApp()
  const disputeId = id ?? ''

  const { data: dispute, isLoading: isLoadingDispute } = useDisputeThread(disputeId)
  const { data: messagesData, isLoading: isLoadingMessages } = useDisputeMessages(disputeId, {
    pageSize: 100,
  })
  const sendMessage = useSendDisputeMessage()
  const markRead = useMarkDisputeRead()
  const hub = useDisputeHub(disputeId)
  const { data: currentUser } = useCurrentUser()

  const [messageText, setMessageText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([])
  const [activeUploadContext, setActiveUploadContext] = useState('dispute_attachment')
  const mediaUpload = useMediaUpload(activeUploadContext)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Combine API messages with hub real-time messages, filter external only
  const apiMessages = messagesData?.messages ?? []
  const hubMessageIds = new Set(hub.messages.map((m) => m.id))
  const allMessages: DisputeMessageDto[] = [
    ...apiMessages.filter((m) => !hubMessageIds.has(m.id)),
    ...hub.messages,
  ]
    .filter((m) => !m.isInternal)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Track other participants' read states
  const [otherReadStates, setOtherReadStates] = useState<Record<string, string>>({})
  useEffect(() => {
    if (hub.readState && hub.readState.userId !== currentUser?.id) {
      setOtherReadStates((prev) => ({
        ...prev,
        [hub.readState!.userId]: hub.readState!.lastReadAt,
      }))
    }
  }, [hub.readState, currentUser?.id])

  const getSeenBy = useCallback((m: DisputeMessageDto) => {
    if (m.senderId !== currentUser?.id) return []
    const seen: string[] = []
    for (const [userId, lastReadAt] of Object.entries(otherReadStates)) {
      if (new Date(lastReadAt) >= new Date(m.createdAt)) {
        const participant = dispute?.participants.find((p) => p.userId === userId)
        seen.push(participant?.displayName ?? participant?.role ?? userId.slice(0, 8))
      }
    }
    return seen
  }, [otherReadStates, currentUser?.id, dispute?.participants])

  // Mark as read on new messages from others
  const prevCountRef = useRef(0)
  useEffect(() => {
    if (!disputeId) return
    if (allMessages.length > prevCountRef.current) {
      const lastMsg = allMessages[allMessages.length - 1]
      if (lastMsg && lastMsg.senderId !== currentUser?.id) {
        markRead.mutate({ disputeId, lastReadMessageId: lastMsg.id })
      }
      prevCountRef.current = allMessages.length
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disputeId, allMessages.length])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const handleFileUpload = async (file: File) => {
    const context = getUploadContext(file)
    if (!context) {
      msg.error(t('unsupportedFileType', 'Only images, videos, and PDFs are supported'))
      return
    }
    setActiveUploadContext(context)
    try {
      const result = await mediaUpload.upload(file)
      setUploadedFiles((prev) => [...prev, { id: result.mediaUploadId, name: file.name }])
    } catch {
      // error tracked in mediaUpload.error
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleSend = () => {
    const trimmed = messageText.trim()
    if (!trimmed || !disputeId) return
    const attachmentIds = uploadedFiles.map((f) => f.id)
    sendMessage.mutate(
      { disputeId, message: trimmed, attachments: attachmentIds.length > 0 ? attachmentIds : undefined },
      {
        onSuccess: () => {
          setMessageText('')
          setUploadedFiles([])
          mediaUpload.reset()
        },
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Use hub meta if available, otherwise API data
  const currentStatus = hub.disputeMeta?.status ?? dispute?.meta?.status
  const terminalStatuses: DisputeStatus[] = [DisputeStatus.Resolved, DisputeStatus.Rejected, DisputeStatus.Cancelled]
  const isTerminal = terminalStatuses.includes(currentStatus as DisputeStatus)

  if (isLoadingDispute) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!dispute) {
    return <Empty description={t('notFound', 'Dispute not found')} />
  }

  const meta = dispute.meta

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500, padding: isMobile ? 16 : 0 }}>
      {/* Header */}
      <Card size="small" style={{ marginBottom: isMobile ? 8 : 16 }}>
        <Space wrap size={isMobile ? 'small' : 'middle'}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {meta.disputeNumber ?? meta.id}
          </Typography.Title>
          <Tag color={STATUS_COLOR_MAP[currentStatus ?? ''] ?? 'default'}>
            {t(`statusLabel.${currentStatus}`, currentStatus ?? '')}
          </Tag>
          {meta.domain && <Tag>{meta.domain}</Tag>}
          {meta.caseType && <Tag>{meta.caseType}</Tag>}
        </Space>
        {meta.title && (
          <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
            {meta.title}
          </Typography.Paragraph>
        )}
        {meta.description && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {meta.description}
          </Typography.Paragraph>
        )}
      </Card>

      {/* Resolution banner */}
      {isTerminal && (
        <Alert
          type={currentStatus === DisputeStatus.Resolved ? 'success' : 'info'}
          showIcon
          icon={currentStatus === DisputeStatus.Resolved ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ marginBottom: isMobile ? 8 : 16 }}
          message={
            currentStatus === DisputeStatus.Resolved
              ? t('disputeResolved', 'This dispute has been resolved')
              : currentStatus === DisputeStatus.Cancelled
                ? t('disputeCancelled', 'This dispute was cancelled')
                : t('disputeClosedTitle', 'This dispute is closed')
          }
          description={
            meta.resolvedAt ? (
              <Typography.Text type="secondary">
                {t('resolvedOn', 'Resolved on')}: {dayjs(meta.resolvedAt).format('DD/MM/YYYY HH:mm')}
              </Typography.Text>
            ) : undefined
          }
        />
      )}

      {/* Message thread */}
      <Card
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, overflow: 'auto', padding: isMobile ? '8px' : '16px' } }}
      >
        {isLoadingMessages ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : allMessages.length === 0 ? (
          <Empty description={t('noMessages', 'No messages yet')} />
        ) : (
          <List
            dataSource={allMessages}
            renderItem={(m: DisputeMessageDto) => {
              const isSender = m.senderId === currentUser?.id
              return (
                <div style={{
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: isSender ? 'row-reverse' : 'row',
                  gap: 8,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ flexShrink: 0 }}>
                    <UserOutlined style={{ fontSize: 20 }} />
                  </span>
                  <div style={{
                    maxWidth: '70%',
                    background: isSender ? 'var(--color-accent-light, #e6f7ff)' : 'var(--color-bg-card, #f5f5f5)',
                    borderRadius: 12,
                    borderTopRightRadius: isSender ? 4 : 12,
                    borderTopLeftRadius: isSender ? 12 : 4,
                    padding: '8px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Typography.Text strong style={{ fontSize: 12, color: isSender ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                        {m.senderDisplayName || m.senderId.slice(0, 8)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                        {dayjs(m.createdAt).format('HH:mm')}
                      </Typography.Text>
                    </div>
                    {m.message && (
                      <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                        {m.message}
                      </Typography.Paragraph>
                    )}
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Image.PreviewGroup>
                          <Space direction="vertical" size={4}>
                            {m.attachments.map((att) => (
                              <DisputeAttachmentRenderer
                                key={att.id}
                                resourceType={att.resourceType}
                                format={att.format}
                                secureUrl={att.secureUrl}
                                fileName={att.fileName}
                                bytes={att.bytes}
                                durationSeconds={att.durationSeconds}
                              />
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </div>
                    )}
                    {(() => {
                      const seenBy = getSeenBy(m)
                      if (seenBy.length === 0) return null
                      return (
                        <div style={{ marginTop: 4, textAlign: 'right' }}>
                          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                            <CheckOutlined style={{ fontSize: 9, marginRight: 3, color: 'var(--color-accent)' }} />
                            {t('seenBy', 'Seen by')} {seenBy.join(', ')}
                          </Typography.Text>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Message input */}
      {!isTerminal && (
        <Card size="small" style={{ marginTop: 8 }}>
          {uploadedFiles.length > 0 && (
            <Space size={4} wrap style={{ marginBottom: 8 }}>
              {uploadedFiles.map((file) => (
                <Tag
                  key={file.id}
                  closable
                  closeIcon={<CloseCircleOutlined />}
                  onClose={() => handleRemoveFile(file.id)}
                  style={{ margin: 0 }}
                >
                  <PaperClipOutlined style={{ marginRight: 4 }} />
                  {file.name}
                </Tag>
              ))}
            </Space>
          )}
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
              accept="image/*,video/*,application/pdf"
              beforeUpload={(file) => {
                handleFileUpload(file)
                return false
              }}
              disabled={mediaUpload.uploading}
            >
              <Tooltip title={t('attachFile', 'Attach file')}>
                <Button icon={<PaperClipOutlined />} loading={mediaUpload.uploading} />
              </Tooltip>
            </Upload>
            <Input.TextArea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTerminal ? t('disputeClosed', 'This dispute is closed') : t('messagePlaceholder', 'Type a message...')}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
              disabled={isTerminal}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sendMessage.isPending}
              disabled={!messageText.trim() || isTerminal}
            >
              {t('send', 'Send')}
            </Button>
          </Space.Compact>
        </Card>
      )}
    </div>
  )
}
