import { Empty, Button } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { SANS_FONT } from '@/styles/tokens'

interface AdminEmptyStateProps {
  /** Main message, e.g. "No users found" */
  message?: string
  /** Description below the message */
  description?: string
  /** Optional CTA label */
  actionLabel?: string
  /** Called when the CTA button is clicked */
  onAction?: () => void
  /** Custom icon — defaults to InboxOutlined */
  icon?: React.ReactNode
}

/**
 * Standardised empty state for admin tables and lists.
 * Ensures consistent icon sizing (80px), messaging, and optional CTA.
 */
export function AdminEmptyState({
  message = 'No data',
  description,
  actionLabel,
  onAction,
  icon,
}: AdminEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
          color: 'var(--color-text-secondary)',
          opacity: 0.3,
          marginBottom: 16,
        }}
      >
        {icon || <InboxOutlined />}
      </div>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ display: 'none' }}
        description={
          <div>
            <p
              style={{
                fontFamily: SANS_FONT,
                fontSize: 'var(--admin-section-title-size, 16px)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: '0 0 4px 0',
              }}
            >
              {message}
            </p>
            {description && (
              <p
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 'var(--admin-body-size, 14px)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}
              >
                {description}
              </p>
            )}
          </div>
        }
      >
        {actionLabel && onAction && (
          <Button type="primary" onClick={onAction} style={{ marginTop: 8, borderRadius: 6 }}>
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  )
}
