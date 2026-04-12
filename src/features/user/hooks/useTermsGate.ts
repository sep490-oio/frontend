import { useCallback, useState } from 'react'
import { usePendingTerms } from '../api'

/**
 * Pre-action terms gate. Preview-first UX: callers mount the shared
 * <TermsAcceptanceModal> and use `openModal()` before a gated action.
 *
 * `redirect` is kept as a no-op for backwards compatibility — it previously
 * navigated to /me/terms, which broke in-flight actions and confused users.
 */
export function useTermsGate(termType: string) {
  const { data, isLoading } = usePendingTerms(termType)
  const [modalOpen, setModalOpen] = useState(false)

  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  const openModal = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])
  const redirect = useCallback(() => {
    // no-op: retained so existing call sites stay type-safe while the app
    // migrates to the modal flow.
  }, [])

  return {
    hasPending,
    isLoading,
    modalOpen,
    openModal,
    closeModal,
    redirect,
  }
}
