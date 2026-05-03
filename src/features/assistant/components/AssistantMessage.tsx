import { useMemo } from 'react'
import { Tag, Button, Space } from 'antd'
import { LinkOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { parseCitations, parseMessageMetadata } from '../api'
import type { AssistantMessageDto } from '../types'

/**
 * Same-origin path guard. Blocks protocol-relative URLs (`//evil.com`)
 * which React Router would treat as external. Defense in depth — the BE
 * already filters these in AssistantChatService.BuildSuggestedActions.
 */
function isSafeInternalRoute(url: string | null | undefined): url is string {
  return Boolean(url) && url!.startsWith('/') && !url!.startsWith('//')
}

interface Props {
  message: AssistantMessageDto
}

export function AssistantMessage({ message }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAssistant = message.sender === 'assistant'
  const citations = useMemo(() => parseCitations(message.citations), [message.citations])
  const metadata = useMemo(() => parseMessageMetadata(message.metadata), [message.metadata])
  const actions = metadata.suggestedActions ?? []

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexDirection: isAssistant ? 'row' : 'row-reverse',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isAssistant ? 'var(--color-accent, #c4933d)' : 'var(--color-text-secondary, #888)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 14,
        }}
        aria-hidden
      >
        {isAssistant ? <RobotOutlined /> : <UserOutlined />}
      </div>
      <div style={{ maxWidth: '85%' }}>
        <div
          style={{
            background: isAssistant
              ? 'var(--color-bg-elevated, #f7f6f3)'
              : 'var(--color-accent, #c4933d)',
            color: isAssistant ? 'var(--color-text-primary)' : '#fff',
            padding: '10px 14px',
            borderRadius: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {message.content}
        </div>

        {isAssistant && metadata.needsHumanSupport && (
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-warning, #d97706)' }}>
            {t(
              'assistant:needsHumanSupport',
              'Bạn có thể cần liên hệ hỗ trợ con người để nhận trợ giúp đầy đủ.',
            )}
          </div>
        )}

        {isAssistant && citations.length > 0 && (
          <Space size={[4, 4]} wrap style={{ marginTop: 8 }}>
            {citations.map((c, idx) => (
              <Tag
                key={idx}
                icon={<LinkOutlined />}
                color="default"
                style={{ cursor: isSafeInternalRoute(c.sourceUrl) ? 'pointer' : 'default' }}
                onClick={() => {
                  if (isSafeInternalRoute(c.sourceUrl)) navigate(c.sourceUrl)
                }}
              >
                {c.title}
              </Tag>
            ))}
          </Space>
        )}

        {isAssistant && actions.length > 0 && (
          <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
            {actions
              .filter((action) => isSafeInternalRoute(action.deepLink))
              .map((action, idx) => (
                <Button
                  key={idx}
                  size="small"
                  type="default"
                  onClick={() => navigate(action.deepLink)}
                >
                  {action.label}
                </Button>
              ))}
          </Space>
        )}
      </div>
    </div>
  )
}
