import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'

export type GatedTermType = 'platform' | 'bidder' | 'seller'

/**
 * Returns `{ ensureTermsAccepted, modalState }`.
 *
 * `ensureTermsAccepted(termTypes)` — for each type in `termTypes`, checks
 * whether the user has a pending (unaccepted) active terms document. If any
 * are pending it opens `TermsAcceptanceModal` one at a time and waits for the
 * user to accept before proceeding to the next. Returns:
 *   - `true`  — all required terms accepted; caller may proceed with the action.
 *   - `false` — user cancelled at least one modal; caller must abort the action.
 *
 * `modalState` — the currently open modal type (or null). Mount one
 * `<TermsAcceptanceModal>` driven by this state in the calling component.
 *
 * Design: imperative promise-based API so callers can `await` before mutations
 * without restructuring their event handlers into effect-driven state machines.
 */
export function useEnsureTermsAccepted() {
  const qc = useQueryClient()
  const [modalType, setModalType] = useState<GatedTermType | null>(null)

  // Resolve promise for the currently open modal
  const resolveRef = useRef<((accepted: boolean) => void) | null>(null)

  /**
   * Called by the consuming component when the user clicks "I Accept" in the
   * currently open modal.
   */
  const onAccepted = useCallback(() => {
    resolveRef.current?.(true)
    resolveRef.current = null
    setModalType(null)
  }, [])

  /**
   * Called by the consuming component when the user closes / cancels the
   * currently open modal.
   */
  const onCancelled = useCallback(() => {
    resolveRef.current?.(false)
    resolveRef.current = null
    setModalType(null)
  }, [])

  /**
   * Main gate function. Returns a Promise that resolves true only when every
   * required term type has been accepted by the user.
   */
  const ensureTermsAccepted = useCallback(
    async (termTypes: GatedTermType[]): Promise<boolean> => {
      // Snapshot current pending state from the React Query cache so we don't
      // need to mount per-type hooks here. The cache is kept fresh by
      // usePendingTerms (5-min stale) and by TermsActivated invalidation.
      for (const termType of termTypes) {
        // Read from cache synchronously; fall back to fetching if stale/absent.
        const activeKey = [...queryKeys.terms.all, 'active']
        const acceptedKey = queryKeys.terms.myAccepted()

        const activeTerms = qc.getQueryData<{ id: string; type: string; version: number; isActive: boolean }[]>(activeKey)
        const acceptedTerms = qc.getQueryData<{ id: string; acceptedAt: string; document: { id: string; type: string; version: number } }[]>(acceptedKey)

        let isPending = false

        if (activeTerms && acceptedTerms) {
          // Compute pending client-side (mirrors usePendingTerms logic)
          const acceptedDocIds = new Set(
            acceptedTerms.map((a) => {
              if (a.document && typeof a.document === 'object' && 'id' in a.document) return a.document.id
              return null
            }).filter(Boolean) as string[],
          )
          const activeTerm = activeTerms.find((t) => t.type === termType)
          isPending = !!activeTerm && !acceptedDocIds.has(activeTerm.id)
        } else {
          // Cache miss — refetch and re-evaluate; if anything fails, be conservative and show modal
          try {
            await qc.fetchQuery({
              queryKey: activeKey,
              queryFn: async () => {
                const { default: apiClient } = await import('@/lib/axios')
                const res = await apiClient.get<{ id: string; type: string; version: number; isActive: boolean }[]>('/terms/active')
                return res.data
              },
              staleTime: 5 * 60 * 1000,
            })
            await qc.fetchQuery({
              queryKey: acceptedKey,
              queryFn: async () => {
                const { default: apiClient } = await import('@/lib/axios')
                const res = await apiClient.get<{ id: string; acceptedAt: string; document: { id: string; type: string; version: number } }[]>('/me/terms')
                return res.data
              },
              staleTime: 60 * 1000,
            })

            const freshActive = qc.getQueryData<{ id: string; type: string; version: number; isActive: boolean }[]>(activeKey) ?? []
            const freshAccepted = qc.getQueryData<{ id: string; acceptedAt: string; document: { id: string; type: string; version: number } }[]>(acceptedKey) ?? []

            const acceptedDocIds = new Set(
              freshAccepted.map((a) => a.document?.id).filter(Boolean) as string[],
            )
            const activeTerm = freshActive.find((t) => t.type === termType)
            isPending = !!activeTerm && !acceptedDocIds.has(activeTerm.id)
          } catch {
            isPending = true // conservative: show modal on error
          }
        }

        if (!isPending) continue

        // Open modal for this type and wait for resolution
        const accepted = await new Promise<boolean>((resolve) => {
          resolveRef.current = resolve
          setModalType(termType)
        })

        if (!accepted) return false
      }

      return true
    },
    [qc],
  )

  return {
    ensureTermsAccepted,
    modalType,
    onAccepted,
    onCancelled,
  }
}

