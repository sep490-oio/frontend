import { useMemo } from 'react'
import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  UserDto,
  UserProfileDto,
  UpdateProfileRequest,
  UserAddressDto,
  CreateAddressRequest,
  ChangePasswordRequest,
  SetPhoneNumberRequest,
  SetupTotpResponse,
  UserNotificationPreferenceDto,
  PagedList,
  PaginationParams,
} from '@/types'
import type { UserSessionDto, LoginHistoryDto } from '@/types/auth'

// ── Current User ──────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const res = await apiClient.get<UserDto>('/me')
      return res.data
    },
  })
}

export function useCurrentUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const res = await apiClient.get<UserProfileDto>('/me/profile')
      return res.data
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const res = await apiClient.put<UserProfileDto>('/me/profile', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.profile() })
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
  })
}

// ── Password ──────────────────────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await apiClient.put('/me/password', data)
    },
  })
}

// ── Phone Number ──────────────────────────────────────────────────────

export function useSetPhoneNumber() {
  return useMutation({
    mutationFn: async (data: SetPhoneNumberRequest) => {
      await apiClient.put('/me/phone', data)
    },
  })
}

export function useConfirmPhoneNumber() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { verificationCode: string }) => {
      await apiClient.post('/me/phone/confirm', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
  })
}

// ── Addresses ─────────────────────────────────────────────────────────

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.users.addresses(),
    queryFn: async () => {
      const res = await apiClient.get('/me/addresses')
      return extractArray<UserAddressDto>(res.data)
    },
  })
}

export function useAddAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAddressRequest) => {
      const res = await apiClient.post<UserAddressDto>('/me/addresses', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.addresses() })
    },
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: CreateAddressRequest & { id: string }) => {
      const res = await apiClient.put<UserAddressDto>(`/me/addresses/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.addresses() })
    },
  })
}

export function useRemoveAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/me/addresses/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.addresses() })
    },
  })
}

export function useSetDefaultAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/me/addresses/${id}/default`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.addresses() })
    },
  })
}

// ── Sessions & Login History ──────────────────────────────────────────

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.users.sessions(),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<UserSessionDto>>('/me/sessions')
      return res.data
    },
  })
}

export function useLoginHistory(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.loginHistory(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<LoginHistoryDto>>('/me/login-history', {
        params,
      })
      return res.data
    },
  })
}

// ── Two-Factor Authentication ─────────────────────────────────────────

export function useEnable2FA() {
  return useMutation({
    mutationFn: async (provider: string) => {
      await apiClient.post('/me/two-factor/enable', { provider })
    },
  })
}

export function useSetupTotp() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<SetupTotpResponse>('/me/two-factor/setup')
      return res.data
    },
  })
}

export function useConfirmTotp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { code: string }) => {
      await apiClient.post('/me/two-factor/confirm', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
  })
}

// SECURITY: BE ignores the code parameter - 2FA can be disabled without TOTP verification. Needs BE fix.
export function useDisable2FA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { code: string }) => {
      await apiClient.post('/me/two-factor/disable', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
    },
  })
}

export function useRegenerateRecoveryCodes() {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.post<{ recoveryCodes: string[] }>('/me/two-factor/recovery-codes', { code })
      return res.data
    },
  })
}

// ── Terms & Conditions ───────────────────────────────────────────────

/**
 * Computes pending terms client-side by comparing active terms with user's accepted terms.
 * Replaces the broken /me/terms/pending endpoint call.
 * @param termType - Optional filter by type (e.g., "platform", "seller", "bidder")
 */
export function usePendingTerms(termType?: string) {
  const { data: activeTerms, isLoading: activeLoading } = useQuery({
    queryKey: [...queryKeys.terms.all, 'active'],
    queryFn: async () => {
      const res = await apiClient.get<{ id: string; type: string; version: number; isActive: boolean; contentUrl?: string; fileName?: string }[]>('/terms/active')
      return res.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: acceptedTerms, isLoading: acceptedLoading } = useAcceptedTerms()

  const pendingTerms = useMemo(() => {
    if (!activeTerms || !acceptedTerms) return []
    // BE returns TermsAcceptanceDto with nested Document object
    // Handle both shapes: flat { termsId } (old) and nested { document: { id } } (actual BE response)
    const acceptedDocIds = new Set(acceptedTerms.map((a: Record<string, unknown>) => {
      // Nested shape: { document: { id } }
      if (a.document && typeof a.document === 'object' && 'id' in a.document) return (a.document as { id: string }).id
      // Flat shape: { termsId }
      if (a.termsId) return a.termsId as string
      // Fallback: { id } (acceptance ID, not document ID — skip)
      return null
    }).filter(Boolean) as string[])
    let pending = activeTerms.filter((t) => !acceptedDocIds.has(t.id))
    if (termType) {
      pending = pending.filter((t) => t.type === termType)
    }
    return pending
  }, [activeTerms, acceptedTerms, termType])

  return {
    data: { hasPending: pendingTerms.length > 0, pendingTerms },
    isLoading: activeLoading || acceptedLoading,
  }
}

export function useAcceptedTerms() {
  return useQuery({
    queryKey: queryKeys.terms.myAccepted(),
    queryFn: async () => {
      // BE returns TermsAcceptanceDto[]: { id, acceptedAt, ipAddress, userAgent, document: { id, type, version, ... } }
      const res = await apiClient.get<{ id: string; acceptedAt: string; document: { id: string; type: string; version: number } }[]>('/me/terms')
      return res.data
    },
  })
}

export function useAcceptTerm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (termDocumentId: string) => {
      await apiClient.post(`/me/terms/${termDocumentId}/accept`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.terms.myAccepted() })
      // Invalidating accepted terms causes usePendingTerms to recompute automatically
    },
  })
}

// ── Notification Preferences ──────────────────────────────────────────

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.users.notificationPrefs(),
    queryFn: async () => {
      const res = await apiClient.get<UserNotificationPreferenceDto>('/me/notification-preferences')
      return res.data
    },
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UserNotificationPreferenceDto) => {
      const res = await apiClient.put<UserNotificationPreferenceDto>('/me/notification-preferences', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.notificationPrefs() })
    },
  })
}
