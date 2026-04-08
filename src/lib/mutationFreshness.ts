import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Mutation success helper: invalidate the given root keys and wait for any
 * currently-active (mounted) queries under those keys to finish refetching
 * before the mutation promise resolves.
 *
 * Implementation note (TanStack Query v5):
 *   `invalidateQueries` already triggers a refetch of active queries by
 *   default, and the returned promise resolves after those refetches
 *   settle. Calling `refetchQueries` afterwards would double-fetch, so we
 *   rely on the single awaited `invalidateQueries` with an explicit
 *   `refetchType: 'active'` for clarity.
 *
 * Rule enforced by this helper:
 *   - mutation success must NOT resolve (and therefore toast must NOT show)
 *     until the lists the user is looking at have finished refetching.
 *   - callers pass ROOT keys (e.g. `queryKeys.admin.reviewQueueRoot()`) so
 *     that prefix matching catches every `list(params)` variant.
 *
 * For row-level actions that want zero-flicker UX, call `setQueryData` to
 * patch the cached page BEFORE calling this helper — the awaited refetch
 * then reconciles the server state without the user seeing a stale row.
 */
export async function invalidateAndRefetchActive(
  qc: QueryClient,
  keys: QueryKey[],
): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      qc.invalidateQueries({ queryKey: key, refetchType: 'active' }),
    ),
  )
}
