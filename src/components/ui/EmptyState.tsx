import { Typography, Flex } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation('common')
  const displayTitle = title ?? t('emptyState.title')
  return (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={16}
      style={{ padding: '80px 24px', textAlign: 'center' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.05)',
        fontSize: 32,
        color: '#64748b',
        marginBottom: 8
      }}>
        {icon ?? <InboxOutlined />}
      </div>
      <Typography.Text
        style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}
      >
        {displayTitle}
      </Typography.Text>
      {description && (
        <Typography.Text
          style={{ color: 'var(--color-text-secondary)', maxWidth: 360 }}
        >
          {description}
        </Typography.Text>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </Flex>
  )
}
