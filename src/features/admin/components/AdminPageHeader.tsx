import type { ReactNode } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SANS_FONT } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface AdminPageHeaderProps {
  /** Page title text */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Label for the primary CTA button (e.g. "Create User"). Omit to hide. */
  createLabel?: string
  /** Callback when the primary CTA button is clicked */
  onCreate?: () => void
  /** Optional extra content rendered to the right of the title (filters, tabs, etc.) */
  extra?: ReactNode
}

/**
 * Standardised page header for all admin pages.
 * Ensures consistent title sizing, spacing, and CTA placement.
 */
export function AdminPageHeader({ title, subtitle, createLabel, onCreate, extra }: AdminPageHeaderProps) {
  const { isMobile } = useBreakpoint()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 16,
        marginBottom: 24,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontFamily: SANS_FONT,
            fontSize: 'var(--admin-page-title-size, 24px)',
            fontWeight: 'var(--admin-page-title-weight, 700)' as any,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: SANS_FONT,
              fontSize: 'var(--admin-body-size, 14px)',
              color: 'var(--color-text-secondary)',
              margin: '4px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {extra}
        {createLabel && onCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
            style={{
              borderRadius: 'var(--admin-action-btn-radius, 6px)',
              height: 'var(--admin-action-btn-height, 32px)',
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
