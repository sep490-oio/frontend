import { useEffect, useState } from 'react'
import { usePendingTerms } from '../api'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'

interface TermsAcceptanceGateProps {
  /** Term type to check: "platform", "seller", "bidder" */
  termType: string
  /** Title shown in the alert banner (unused — retained for call-site compat) */
  title?: string
  /** Description of why terms acceptance is required (unused — retained for call-site compat) */
  description?: string
  /** Content to render. Always rendered. */
  children: React.ReactNode
  /** Callback when pending status changes — parent can use to disable actions */
  onPendingChange?: (hasPending: boolean) => void
  /** Deprecated: redirect mode is now a no-op. The modal opens automatically when terms are pending. */
  redirect?: boolean
}

/**
 * Preview-first terms gate: auto-opens the reusable {@link TermsAcceptanceModal}
 * when the user has pending terms of the given type, and always renders children.
 * No routing, no redirects, no blocking alerts.
 */
export function TermsAcceptanceGate({
  termType,
  children,
  onPendingChange,
}: TermsAcceptanceGateProps) {
  const { data, isLoading } = usePendingTerms(termType)
  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  const [modalOpen, setModalOpen] = useState(false)
  const [autoShown, setAutoShown] = useState(false)

  useEffect(() => {
    onPendingChange?.(hasPending)
  }, [hasPending, onPendingChange])

  useEffect(() => {
    if (hasPending && !autoShown) {
      setModalOpen(true)
      setAutoShown(true)
    }
  }, [hasPending, autoShown])

  const isKnownType = termType === 'platform' || termType === 'bidder' || termType === 'seller'

  return (
    <>
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
