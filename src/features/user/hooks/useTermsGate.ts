import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { usePendingTerms } from '../api'

/**
 * Hook for pre-action terms checking.
 * Returns { hasPending, redirect } — call redirect() before mutations
 * to send the user to the focused terms page with returnTo.
 */
export function useTermsGate(termType: string) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = usePendingTerms(termType)

  const hasPending = !isLoading && !!data?.hasPending && data.pendingTerms.length > 0

  const redirect = useCallback(() => {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    navigate(`/me/terms?type=${termType}&returnTo=${returnTo}`)
  }, [navigate, location.pathname, location.search, termType])

  return { hasPending, isLoading, redirect }
}
