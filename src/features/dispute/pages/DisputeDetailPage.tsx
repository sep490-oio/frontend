import { useCallback, useEffect, useRef, useState } from 'react'
import { Typography, Card, Tag, Space, Spin, Empty, Button, Input, List, Divider, Avatar, Tooltip, Progress, Upload, Alert, Image } from 'antd'
import { SendOutlined, PaperClipOutlined, UserOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons'
import DisputeAttachmentRenderer from '@/components/ui/DisputeAttachmentRenderer'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { useDisputeThread, useDisputeMessages, useSendDisputeMessage, useMarkDisputeRead } from '@/features/dispute/api'
import { useDisputeHub } from '@/features/dispute/hooks/useDisputeHub'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useCurrentUser } from '@/features/user/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DisputeStatus } from '@/types/enums'
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



export default function DisputeDetailPage() {
  const { t } = useTranslation('dispute')
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
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
  const mediaUpload = useMediaUpload('dispute_attachment')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Combine API messages with hub real-time messages
  const apiMessages = messagesData?.messages ?? []
  const hubMessageIds = new Set(hub.messages.map((m) => m.id))
  const allMessages: DisputeMessageDto[] = [
    ...apiMessages.filter((m) => !hubMessageIds.has(m.id)),
    ...hub.messages,
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Track other participants' read states (from hub broadcasts)
  const [otherReadStates, setOtherReadStates] = useState<Record<string, string>>({}) // userId → lastReadAt
  useEffect(() => {
    if (hub.readState && hub.readState.userId !== currentUser?.id) {
      setOtherReadStates((prev) => ({
        ...prev,
        [hub.readState!.userId]: hub.readState!.lastReadAt,
      }))
    }
  }, [hub.readState, currentUser?.id])

  // Find which participants have "seen" up to each message
  const getSeenBy = useCallback((msg: DisputeMessageDto) => {
    if (msg.senderId !== currentUser?.id) return [] // only show "seen" on own messages
    const seenParticipants: string[] = []
    for (const [userId, lastReadAt] of Object.entries(otherReadStates)) {
      if (new Date(lastReadAt) >= new Date(msg.createdAt)) {
        const participant = dispute?.participants.find((p) => p.userId === userId)
        seenParticipants.push(participant?.displayName ?? participant?.role ?? userId.slice(0, 8))
      }
    }
    return seenParticipants
  }, [otherReadStates, currentUser?.id, dispute?.participants])

  // Mark as read when new messages arrive from others
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const handleFileUpload = async (file: File) => {
    try {
      const result = await mediaUpload.upload(file)
      setUploadedFiles((prev) => [...prev, { id: result.mediaUploadId, name: file.name }])
    } catch {
      // error is already tracked in mediaUpload.error
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
  const currentUpdatedAt = hub.disputeMeta?.updatedAt ?? dispute?.meta?.updatedAt
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500, padding: isMobile ? 16 : 0 }}>
      {/* Dispute info header */}
      <Card size="small" style={{ marginBottom: isMobile ? 8 : 16 }}>
        <Space wrap size={isMobile ? 'small' : 'middle'} direction={isMobile ? 'vertical' : 'horizontal'}>
          <Typography.Text strong>{t('dispute', 'Dispute')}: </Typography.Text>
          <Typography.Text copyable style={{ fontSize: 12 }}>
            {dispute.meta.id ?? dispute.meta.disputeId}
          </Typography.Text>
          <Divider type="vertical" />
          <Space size={4}>
            <Typography.Text type="secondary">{t('status', 'Status')}:</Typography.Text>
            <Tag color={STATUS_COLOR_MAP[currentStatus ?? ''] ?? 'default'}>
              {t(`statusLabel.${currentStatus}`, currentStatus ?? '')}
            </Tag>
          </Space>
          <Divider type="vertical" />
          <Space size={4}>
            <Typography.Text type="secondary">{t('participants', 'Participants')}:</Typography.Text>
            <Avatar.Group size="small" max={{ count: 5 }}>
              {dispute.participants.map((p) => (
                <Tooltip key={p.userId} title={`${p.displayName ?? p.userId.slice(0, 8)} (${p.role})`}>
                  <Avatar src={p.avatarUrl} icon={<UserOutlined />} size="small" />
                </Tooltip>
              ))}
            </Avatar.Group>
          </Space>
          {currentUpdatedAt && (
            <>
              <Divider type="vertical" />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('lastUpdated', 'Updated')}: {dayjs(currentUpdatedAt).format('DD/MM/YYYY HH:mm')}
              </Typography.Text>
            </>
          )}
        </Space>
      </Card>

      {/* Resolution banner for terminal states */}
      {isTerminal && (
        <Alert
          type={currentStatus === DisputeStatus.Resolved ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: isMobile ? 8 : 16 }}
          message={
            currentStatus === DisputeStatus.Resolved
              ? t('disputeResolved', 'This dispute has been resolved')
              : currentStatus === DisputeStatus.Cancelled
                ? t('disputeCancelled', 'This dispute was cancelled')
                : t('disputeClosedTitle', 'This dispute is closed')
          }
          description={
            <Space direction="vertical" size={4}>
              {dispute.meta.resolvedAt && (
                <Typography.Text type="secondary">
                  {t('resolvedOn', 'Resolved on')}: {dayjs(dispute.meta.resolvedAt).format('DD/MM/YYYY HH:mm')}
                </Typography.Text>
              )}
              {dispute.meta.title && (
                <Typography.Text>
                  {t('disputeTitle', 'Title')}: {dispute.meta.title}
                </Typography.Text>
              )}
            </Space>
          }
        />
      )}

      {/* Message list */}
      <Card
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        styles={{
          body: {
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '8px' : '16px',
          },
        }}
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
            renderItem={(msg: DisputeMessageDto) => {
              const isSender = msg.senderId === currentUser?.id
              return (
                <div style={{
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: isSender ? 'row-reverse' : 'row',
                  gap: 8,
                  alignItems: 'flex-start',
                }}>
                  <Avatar src={msg.senderAvatarUrl} icon={<UserOutlined />} size="small" style={{ flexShrink: 0 }} />
                  <div style={{
                    maxWidth: '70%',
                    background: isSender ? 'var(--color-accent-light, #e6f7ff)' : 'var(--color-bg-card, #f5f5f5)',
                    borderRadius: 12,
                    borderTopRightRadius: isSender ? 4 : 12,
                    borderTopLeftRadius: isSender ? 12 : 4,
                    padding: '8px 12px',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <Typography.Text strong style={{ fontSize: 12, color: isSender ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                        {msg.senderDisplayName || msg.senderId.slice(0, 8)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                        {dayjs(msg.createdAt).format('HH:mm')}
                      </Typography.Text>
                    </div>
                    {msg.message && (
                      <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                        {msg.message}
                      </Typography.Paragraph>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Image.PreviewGroup>
                          <Space direction="vertical" size={4}>
                            {msg.attachments.map((att) => (
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
                      const seenBy = getSeenBy(msg)
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

      {/* Message input area */}
      <Card size="small" style={{ marginTop: 8 }}>
        {/* Uploaded file chips */}
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
        {/* Upload progress */}
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
    </div>
  )
}
