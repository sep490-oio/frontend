import { useEffect, useRef, useState } from 'react'
import { Typography, Card, Tag, Space, Spin, Empty, Button, Input, List, Divider, Avatar, Tooltip, Progress, Upload } from 'antd'
import { SendOutlined, PaperClipOutlined, UserOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { useDisputeThread, useDisputeMessages, useSendDisputeMessage, useMarkDisputeRead } from '@/features/dispute/api'
import { useDisputeHub } from '@/features/dispute/hooks/useDisputeHub'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { DisputeStatus } from '@/types/enums'
import type { DisputeMessageDto } from '@/types'
import dayjs from 'dayjs'

const STATUS_COLOR_MAP: Record<string, string> = {
  [DisputeStatus.Open]: 'blue',
  [DisputeStatus.Assigned]: 'cyan',
  [DisputeStatus.InProgress]: 'orange',
  [DisputeStatus.PendingResponse]: 'gold',
  [DisputeStatus.Resolved]: 'green',
  [DisputeStatus.Closed]: 'default',
}



export default function DisputeDetailPage() {
  const { t } = useTranslation('dispute')
  const { id } = useParams<{ id: string }>()
  const disputeId = id ?? ''

  const { data: dispute, isLoading: isLoadingDispute } = useDisputeThread(disputeId)
  const { data: messagesData, isLoading: isLoadingMessages } = useDisputeMessages(disputeId, {
    pageNumber: 1,
    pageSize: 100,
  })
  const sendMessage = useSendDisputeMessage()
  const markRead = useMarkDisputeRead()
  const hub = useDisputeHub(disputeId)

  const [messageText, setMessageText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([])
  const mediaUpload = useMediaUpload('dispute_attachment')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mark as read on open
  useEffect(() => {
    if (disputeId) {
      markRead.mutate(disputeId)
    }
  }, [disputeId])

  // Combine API messages with hub real-time messages
  const apiMessages = messagesData?.items ?? []
  const hubMessageIds = new Set(hub.messages.map((m) => m.id))
  const allMessages: DisputeMessageDto[] = [
    ...apiMessages.filter((m) => !hubMessageIds.has(m.id)),
    ...hub.messages,
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500 }}>
      {/* Dispute info header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Typography.Text strong>{t('dispute', 'Dispute')}: </Typography.Text>
          <Typography.Text copyable style={{ fontSize: 12 }}>
            {dispute.meta.disputeId}
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
                <Tooltip key={p.userId} title={`${p.role} (${p.userId.slice(0, 8)}...)`}>
                  <Avatar icon={<UserOutlined />} size="small" />
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
            padding: '16px',
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
            renderItem={(msg: DisputeMessageDto) => (
              <div style={{ marginBottom: 16 }}>
                <Space size={8} align="start">
                  <Avatar icon={<UserOutlined />} size="small" />
                  <div>
                    <Space size={8}>
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {msg.senderId.slice(0, 8)}...
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(msg.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                      </Typography.Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </Typography.Paragraph>
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <Space size={4} style={{ marginTop: 4 }} wrap>
                        <PaperClipOutlined style={{ color: '#999' }} />
                        {msg.attachments.map((attachment) => (
                          <Typography.Link key={attachment.id} href={attachment.url} target="_blank" style={{ fontSize: 12 }}>
                            {attachment.fileName ?? t('attachment', 'Attachment')}
                          </Typography.Link>
                        ))}
                      </Space>
                    )}
                  </div>
                </Space>
              </div>
            )}
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
            placeholder={t('messagePlaceholder', 'Type a message...')}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sendMessage.isPending}
            disabled={!messageText.trim()}
          >
            {t('send', 'Send')}
          </Button>
        </Space.Compact>
      </Card>
    </div>
  )
}
