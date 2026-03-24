import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  SellerProfileDto,
  CreateSellerProfileRequest,
  VerificationDto,
  VerificationDocumentDto,
  PublicSellerItemDto,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Seller Profile ──────────────────────────────────────────────────

export function useMySellerProfile() {
  return useQuery({
    queryKey: queryKeys.seller.myProfile(),
    queryFn: async () => {
      const res = await apiClient.get<SellerProfileDto>('/me/seller-profile')
      return res.data
    },
  })
}

export function useCreateSellerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSellerProfileRequest) => {
      const res = await apiClient.post<SellerProfileDto>('/me/seller-profile', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.all })
    },
  })
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSellerProfileRequest) => {
      const res = await apiClient.put<SellerProfileDto>('/me/seller-profile', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.myProfile() })
    },
  })
}

export function useSellerById(id: string) {
  return useQuery({
    queryKey: queryKeys.seller.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<SellerProfileDto>(`/sellers/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useSellerItems(sellerId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.seller.items(sellerId, params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<PublicSellerItemDto>>(`/sellers/${sellerId}/items`, { params })
      return res.data
    },
    enabled: !!sellerId,
  })
}

// ── Verification ────────────────────────────────────────────────────

export function useMyVerifications() {
  return useQuery({
    queryKey: queryKeys.seller.verifications(),
    queryFn: async () => {
      const res = await apiClient.get('/me/verifications')
      return extractArray<VerificationDto>(res.data)
    },
  })
}

export function useCreateVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { verificationType: string }) => {
      const res = await apiClient.post<VerificationDto>('/me/verifications', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
    },
  })
}

export function useSubmitVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<VerificationDto>(`/me/verifications/${id}/submit`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
    },
  })
}

export function useUpdateVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; type?: string; idType?: string; idNumber?: string }) => {
      const res = await apiClient.put<VerificationDto>(`/me/verifications/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
    },
  })
}

export function useUploadVerificationDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<VerificationDocumentDto>(
        `/me/verifications/${id}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
    },
  })
}

export function useDeleteVerificationDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, docId }: { id: string; docId: string }) => {
      await apiClient.delete(`/me/verifications/${id}/documents/${docId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.seller.verifications() })
    },
  })
}
