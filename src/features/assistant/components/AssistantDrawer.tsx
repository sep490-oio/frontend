import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Drawer, Input, Button, Space, Empty, Spin, Alert } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/store'
import {
  useAssistantMessages,
  useCreateConversation,
  useSendMessage,
} from '../api'
import { usePageContext } from '../hooks/usePageContext'
import { useQuickPrompts } from '../hooks/useQuickPrompts'
import { AssistantMessage } from './AssistantMessage'
import type { AssistantMessageDto } from '../types'

const STORAGE_KEY = 'oio.assistant.conversationId'

interface Props {
  open: boolean
  onClose: () => void
}

function getRolesFromToken(token: string | null): string[] {
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles: string[] = Array.isArray(payload.role)
      ? payload.role
      : payload.role
        ? [payload.role]
        : []
    return roles.map((r) => r.toLowerCase())
  } catch {
    return []
  }
}

function deriveRoleContext(roles: string[]): string {
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('inspector') || roles.includes('warehousemanager')) return 'inspector'
  if (roles.includes('warehouse_staff')) return 'warehouse_staff'
  if (roles.includes('seller')) return 'seller'
  if (roles.length > 0) return 'buyer'
  return 'guest'
}

export function AssistantDrawer({ open, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isAuthenticated = Boolean(accessToken)
  const role = useMemo(() => deriveRoleContext(getRolesFromToken(accessToken)), [accessToken])
  const page = usePageContext()
  const quickPrompts = useQuickPrompts(page)

  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [input, setInput] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<AssistantMessageDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const createConversation = useCreateConversation()
  const messagesQuery = useAssistantMessages(conversationId)
  const sendMessage = useSendMessage(conversationId)
  const creatingRef = useRef(false)

  const createConversationMutate = createConversation.mutateAsync
  const ensureConversation = useCallback(async () => {
    if (creatingRef.current || conversationId) return
    creatingRef.current = true
    try {
      const id = await createConversationMutate({
        roleContext: role,
        title: t('assistant:title', 'Trợ lý OIO'),
      })
      setConversationId(id)
      try {
        localStorage.setItem(STORAGE_KEY, id)
      } catch {
        /* ignore */
      }
    } catch {
      setError(t('assistant:errorCreate', 'Không khởi tạo được cuộc hội thoại.'))
    } finally {
      creatingRef.current = false
    }
  }, [conversationId, createConversationMutate, role, t])

  // Auto-create on first open if we have no conversationId.
  useEffect(() => {
    if (!open || conversationId) return
    void ensureConversation()
  }, [open, conversationId, ensureConversation])

  // Drop optimistic when server messages arrive.
  useEffect(() => {
    if (!messagesQuery.data) return
    setOptimisticMessages([])
  }, [messagesQuery.data])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [open, messagesQuery.data, optimisticMessages.length, sendMessage.isPending])

  const messages = messagesQuery.data?.items ?? []
  const allMessages = [...messages, ...optimisticMessages]

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !conversationId || sendMessage.isPending) return
    setError(null)
    setInput('')

    const optimistic: AssistantMessageDto = {
      id: `optimistic-${Date.now()}`,
      conversationId,
      sender: 'user',
      content: trimmed,
      citations: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, optimistic])

    sendMessage
      .mutateAsync({
        userText: trimmed,
        locale: i18n.language || 'vi',
        page,
      })
      .catch(() => {
        setError(t('assistant:errorSend', 'Không gửi được tin nhắn. Vui lòng thử lại.'))
      })
  }

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined />
          <span>{t('assistant:title', 'Trợ lý OIO')}</span>
        </Space>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {!isAuthenticated && (
          <Alert
            type="info"
            showIcon
            message={t(
              'assistant:guestNotice',
              'Bạn đang sử dụng ở chế độ khách. Đăng nhập để hỏi về đơn hàng/dòng tiền của bạn.',
            )}
            style={{ marginBottom: 12 }}
          />
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            closable
            message={error}
            onClose={() => setError(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {messagesQuery.isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        )}

        {!messagesQuery.isLoading && allMessages.length === 0 && (
          <Empty
            description={t(
              'assistant:emptyHint',
              'Hỏi tôi về phiên đấu giá, đơn hàng, dòng tiền…',
            )}
            style={{ marginTop: 32 }}
          />
        )}

        {allMessages.map((msg) => (
          <AssistantMessage key={msg.id} message={msg} />
        ))}

        {sendMessage.isPending && (
          <div style={{ marginBottom: 12, color: 'var(--color-text-secondary)' }}>
            <Spin size="small" />{' '}
            <span style={{ marginLeft: 6 }}>{t('assistant:thinking', 'Đang trả lời…')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {allMessages.length === 0 && quickPrompts.length > 0 && (
        <div style={{ padding: '0 16px 8px', borderTop: '1px solid var(--color-border-light)', paddingTop: 12 }}>
          <Space size={[6, 6]} wrap>
            {quickPrompts.map((p) => (
              <Button
                key={p}
                size="small"
                type="default"
                onClick={() => send(p)}
                disabled={!conversationId || sendMessage.isPending}
              >
                {p}
              </Button>
            ))}
          </Space>
        </div>
      )}

      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex',
          gap: 8,
          background: 'var(--color-bg-elevated, transparent)',
        }}
      >
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('assistant:placeholder', 'Nhập câu hỏi…') as string}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          disabled={!conversationId}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sendMessage.isPending}
          disabled={!input.trim() || !conversationId}
          onClick={() => send(input)}
          aria-label={t('assistant:send', 'Gửi') as string}
        />
      </div>
    </Drawer>
  )
}
