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
      <div style={{ fontSize: 48, color: 'var(--color-text-secondary)', lineHeight: 1, opacity: 0.5 }}>
        {icon ?? <InboxOutlined />}
      </div>
      <Typography.Text
        className="oio-serif"
        style={{ fontSize: 20, color: 'var(--color-text-primary)' }}
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
