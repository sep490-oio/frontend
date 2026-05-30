import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { DisputeEligibilityDto, DisputeTargetType } from '@/types/dispute'

export function useDisputeEligibility(
  targetType: DisputeTargetType,
  entityId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery<DisputeEligibilityDto>({
    queryKey: ['disputeEligibility', targetType, entityId],
    queryFn: async () => {
      const { data } = await apiClient.get<DisputeEligibilityDto>('/disputes/eligibility', {
        params: { targetType, entityId },
      })
      return data
    },
    enabled: !!entityId && (options?.enabled ?? true),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
