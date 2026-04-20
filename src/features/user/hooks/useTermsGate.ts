import { useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { usePendingTerms } from '../api'

/**
 * Pre-action terms gate. Preview-first UX: callers mount the shared
 * <TermsAcceptanceModal> and use `openModal()` before a gated action.
 *
 * `redirect` previously navigated to /me/terms. It was temporarily disabled
 * but has been restored to support explicit redirection flows.
 */
export function useTermsGate(termType: string) {
  const { data, isLoading } = usePendingTerms(termType)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  const openModal = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])
  const redirect = useCallback(() => {
    navigate('/me/terms', { state: { returnTo: location.pathname, type: termType } })
  }, [navigate, location.pathname, termType])

  return {
    hasPending,
    isLoading,
    modalOpen,
    openModal,
    closeModal,
    redirect,
  }
}
