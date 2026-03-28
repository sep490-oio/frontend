import { useEffect } from 'react'
import { Alert, Button, Typography } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useLocation } from 'react-router'
import { usePendingTerms } from '../api'

interface TermsAcceptanceGateProps {
  /** Term type to check: "platform", "seller", "bidder" */
  termType: string
  /** Title shown in the alert banner */
  title: string
  /** Description of why terms acceptance is required */
  description: string
  /** Content to render (always rendered, with alert banner above when terms pending) */
  children: React.ReactNode
  /** Callback when pending status changes — parent can use to disable actions */
  onPendingChange?: (hasPending: boolean) => void
  /** When true, redirect to focused terms page instead of showing banner */
  redirect?: boolean
}

/**
 * Terms acceptance gate with two modes:
 * - Banner mode (default): shows alert banner + renders children
 * - Redirect mode: navigates to /me/terms?type=X&returnTo=Y when terms pending
 */
export function TermsAcceptanceGate({
  termType,
  title,
  description,
  children,
  onPendingChange,
  redirect = false,
}: TermsAcceptanceGateProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = usePendingTerms(termType)

  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  useEffect(() => {
    onPendingChange?.(hasPending)
  }, [hasPending, onPendingChange])

  // Redirect mode: navigate to focused terms page
  useEffect(() => {
    if (redirect && hasPending && !location.pathname.startsWith('/me/terms')) {
      navigate(`/me/terms?type=${termType}&returnTo=${encodeURIComponent(location.pathname)}`)
    }
  }, [redirect, hasPending, termType, navigate, location.pathname])

  // In redirect mode, don't render banner (redirect handles it)
  if (redirect && hasPending) {
    return null
  }

  return (
    <>
      {hasPending && (
        <Alert
          type="warning"
          showIcon
          banner
          icon={<FileProtectOutlined />}
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <Typography.Text strong>{title}</Typography.Text>
                <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                  {description}
                </Typography.Text>
              </div>
              <Link to={`/me/terms?type=${termType}&returnTo=${encodeURIComponent(location.pathname)}`}>
                <Button
                  type="primary"
                  size="small"
                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                >
                  {t('reviewTerms', 'Review & Accept Terms')}
                </Button>
              </Link>
            </div>
          }
        />
      )}
      {children}
    </>
  )
}
