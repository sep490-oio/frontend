import { useEffect, useState } from 'react'
import { Alert, Button } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePendingTerms } from '../api'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'

interface TermsAcceptanceGateProps {
  /** Term type to check: "platform", "seller", "bidder" */
  termType: string
  /** Optional title override for the banner. */
  title?: string
  /** Optional description override for the banner. */
  description?: string
  /** Content to render. Always rendered. */
  children: React.ReactNode
  /** Callback when pending status changes — parent can use to disable actions. */
  onPendingChange?: (hasPending: boolean) => void
  /** Deprecated: redirect mode is a no-op; modal is triggered explicitly via the banner. */
  redirect?: boolean
}

/**
 * Preview-first terms gate. Renders an inline banner when the user has pending
 * terms of the given type. The banner carries an explicit "Review & Accept"
 * button that opens {@link TermsAcceptanceModal}. Closing the modal does NOT
 * dismiss the banner — it stays so the user has a clear recovery path. Children
 * always render; it is the caller's responsibility to disable the gated action
 * while `onPendingChange(true)`.
 */
export function TermsAcceptanceGate({
  termType,
  title,
  description,
  children,
  onPendingChange,
}: TermsAcceptanceGateProps) {
  const { t } = useTranslation('common')
  const { data, isLoading } = usePendingTerms(termType)
  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    onPendingChange?.(hasPending)
  }, [hasPending, onPendingChange])

  const isKnownType = termType === 'platform' || termType === 'bidder' || termType === 'seller'

  const titleByType: Record<string, string> = {
    platform: t('terms.type.platform', 'Platform Terms'),
    bidder: t('terms.type.bidder', 'Bidder Terms'),
    seller: t('terms.type.seller', 'Seller Agreement'),
  }
  const bannerTitle = title ?? t(
    'terms.pendingBannerTitle',
    'Action required: review updated {{type}}',
    { type: titleByType[termType] ?? termType },
  )
  const bannerDesc = description ?? t(
    'terms.pendingBannerDesc',
    'You need to review and accept the current version before you can continue here.',
  )

  return (
    <>
      {hasPending && (
        <Alert
          type="warning"
          showIcon
          icon={<FileProtectOutlined />}
          style={{ marginBottom: 16 }}
          message={bannerTitle}
          description={bannerDesc}
          action={
            <Button
              type="primary"
              size="small"
              onClick={() => setModalOpen(true)}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('terms.reviewAndAccept', 'Review & Accept')}
            </Button>
          }
        />
      )}

      {isKnownType && (
        <TermsAcceptanceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          termType={termType as 'platform' | 'bidder' | 'seller'}
        />
      )}

      {children}
    </>
  )
}
