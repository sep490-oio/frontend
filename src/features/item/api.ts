import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ItemDto,
  ItemMediaDto,
  CreateItemRequest,
  CategoryDto,
  ItemQuestionDto,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Items ────────────────────────────────────────────────────────────

export function useMyItems(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.items.my(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/my', { params })
      return res.data
    },
  })
}

export function useItemById(id: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ItemDto>(`/items/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateItemRequest) => {
      const res = await apiClient.post<ItemDto>('/items', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: CreateItemRequest & { id: string }) => {
      const res = await apiClient.put<ItemDto>(`/items/${id}`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(variables.id) })
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
    },
  })
}

export function useSubmitItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, verifyByPlatform }: { id: string; verifyByPlatform: boolean }) => {
      const res = await apiClient.post<ItemDto>(`/items/${id}/submit`, { verifyByPlatform })
      return res.data
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
    },
  })
}

export function useActivateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/items/${id}/activate`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

export function useConfirmInspectedCondition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<ItemDto>(`/items/${id}/confirm-inspected-condition`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

// ── Categories ───────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const res = await apiClient.get<{ items: CategoryDto[] }>('/categories')
      return res.data.items
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — categories rarely change
  })
}

// ── Questions ────────────────────────────────────────────────────────

export function useItemQuestions(itemId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.items.questions(itemId, params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemQuestionDto>>(`/items/${itemId}/questions`, { params })
      return res.data
    },
    enabled: !!itemId,
    refetchInterval: 30000, // 30 seconds polling
  })
}

export function useAskQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, question }: { itemId: string; question: string }) => {
      const res = await apiClient.post<ItemQuestionDto>(`/items/${itemId}/questions`, { question })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.questions(variables.itemId) })
    },
  })
}

export function useAnswerQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, questionId, answer }: { itemId: string; questionId: string; answer: string }) => {
      const res = await apiClient.post<ItemQuestionDto>(`/items/${itemId}/questions/${questionId}/answer`, { answer })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.questions(variables.itemId) })
    },
  })
}

// ── Media ─────────────────────────────────────────────────────────────

// Add media to item
export function useAddItemMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, mediaUploadId, isPrimary, sortOrder }: { itemId: string; mediaUploadId: string; isPrimary?: boolean; sortOrder?: number }) => {
      const res = await apiClient.post<ItemMediaDto>(`/items/${itemId}/media`, { mediaUploadId, isPrimary, sortOrder })
      return res.data
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// Remove media from item
export function useRemoveItemMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, mediaId }: { itemId: string; mediaId: string }) => {
      await apiClient.delete(`/items/${itemId}/media/${mediaId}`)
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// Set primary image
export function useSetPrimaryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, mediaId }: { itemId: string; mediaId: string }) => {
      await apiClient.post(`/items/${itemId}/media/${mediaId}/primary`)
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// Reorder media
export function useReorderItemMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, mediaIds }: { itemId: string; mediaIds: string[] }) => {
      await apiClient.post(`/items/${itemId}/media/reorder`, { mediaIds })
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// Choose item shipping
export function useChooseItemShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, shippingOptionId }: { itemId: string; shippingOptionId: string }) => {
      await apiClient.post(`/items/${itemId}/shipping`, { shippingOptionId })
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// Resubmit rejected item
export function useResubmitItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.post(`/items/${itemId}/resubmit`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}
