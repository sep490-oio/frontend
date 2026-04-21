import { useEffect, type ReactNode } from 'react'
import { registerTermsGateHandler, unregisterTermsGateHandler } from '@/lib/axios'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'
import { useEnsureTermsAccepted, type GatedTermType } from '@/features/user/hooks/useEnsureTermsAccepted'
import { useAuth } from '@/hooks/useAuth'

interface TermsGateProviderProps {
  children: ReactNode
}

/**
 * Mount once inside the authenticated layout (AppLayout).
 *
 * Registers the axios 409 Terms.PendingAcceptance interceptor handler for the
 * lifetime of the authenticated session. When a gated BE command returns 409,
 * the interceptor calls this handler which:
 *   1. Derives the required term types from the response (or shows all pending).
 *   2. Opens TermsAcceptanceModal sequentially for each pending type.
 *   3. Returns true (retry) or false (abort) to the interceptor.
 *
 * Also used directly by callers via `useEnsureTermsAccepted` for pre-action FE
 * gates (F2/F3).
 */
export function TermsGateProvider({ children }: TermsGateProviderProps) {
  const { isAuthenticated } = useAuth()
  const { ensureTermsAccepted, modalType, onAccepted, onCancelled } = useEnsureTermsAccepted()

  useEffect(() => {
    if (!isAuthenticated) return

    registerTermsGateHandler(async () => {
      // When BE fires 409 Terms.PendingAcceptance we don't know which specific
      // type(s) triggered it from the response alone (BE returns a generic
      // Conflict). Show all three gated types sequentially and let the pending
      // check inside ensureTermsAccepted skip already-accepted ones.
      return ensureTermsAccepted(['platform', 'bidder', 'seller'])
    })

    return () => {
      unregisterTermsGateHandler()
    }
  }, [isAuthenticated, ensureTermsAccepted])

  return (
    <>
      {children}

      {/* Shared modal driven by useEnsureTermsAccepted — one instance for all gate calls */}
      {modalType && (
        <TermsAcceptanceModal
          open
          termType={modalType as GatedTermType}
          onClose={onCancelled}
          onAccepted={onAccepted}
        />
      )}
    </>
  )
}
