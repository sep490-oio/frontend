import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { stripEmpty } from '@/lib/stripEmpty'
import type {
  ItemDto,
  ItemMediaDto,
  CreateItemRequest,
  CategoryDto,
  ItemQuestionDto,
  ItemQuestionNotification,
  PagedList,
  PaginationParams,
  SellerItemStats,
} from '@/types'

// ── Items ────────────────────────────────────────────────────────────

export function useMyItems(
  params?: PaginationParams & {
    status?: string
    search?: string
    hasInboundShipment?: boolean
    /**
     * Filters by the backend's `Item.RequiresPlatformInspection` flag.
     * true = needs platform verification, false = direct review only.
     */
    requiresPlatformInspection?: boolean
    sortBy?: string
    isDescending?: boolean
    /**
     * When false, returns only items with no active inbound shipment
     * (active = status not in [cancelled, failed]). Used by the inbound-book picker.
     */
    hasActiveInbound?: boolean
  },
) {
  return useQuery({
    queryKey: queryKeys.items.my(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/my', { params: stripEmpty((params ?? {}) as Record<string, unknown>) })
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

/**
 * Fetch all auction sessions for a given item (ordered by createdAt DESC).
 * Returns the full AuctionListItemDto[] — not paged since items rarely have >5 auctions.
 */
export function useItemAuctions(itemId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.items.detail(itemId ?? ''), 'auctions'],
    queryFn: async () => {
      const res = await apiClient.get<import('@/types').AuctionListItemDto[]>(`/items/${itemId}/auctions`)
      return res.data
    },
    enabled: !!itemId,
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
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
    },
  })
}

// TODO: PUT /items/{id} endpoint does not exist on backend — this mutation will always 404
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
      await apiClient.post(`/items/${id}/submit`, { verifyByPlatform })
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
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
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
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
    },
  })
}

// ── Public Items ────────────────────────────────────────────────────

export function usePublicItems(
  params?: PaginationParams & { 
    categoryId?: string; 
    search?: string;
    condition?: string;
    status?: string;
    sortBy?: string;
  }
) {
  return useQuery({
    queryKey: [...queryKeys.items.list(params), 'public'],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/public', { params })
      return res.data
    },
  })
}

export function useSuggestItems(q: string) {
  return useQuery({
    queryKey: ['items', 'suggest', q],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<string[]>('/search/items/suggest', { params: { q }, signal })
      return res.data
    },
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  })
}

// ── Batch Media ─────────────────────────────────────────────────────

export function useBatchAddMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, mediaUploadIds }: { itemId: string; mediaUploadIds: string[] }) => {
      const res = await apiClient.post<ItemMediaDto[]>(`/items/${itemId}/media/batch`, { mediaUploadIds })
      return res.data
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    },
  })
}

// ── Create Auction from Item ────────────────────────────────────────

export function useCreateAuctionFromItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: string; auctionType?: string }) => {
      const res = await apiClient.post(`/items/${itemId}/auctions`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

// ── Admin ────────────────────────────────────────────────────────────

export function useAdminRemoveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.post(`/items/${id}/admin-remove`, { reason })
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.detail(id) })
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

export function useCategoryById(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<CategoryDto>(`/categories/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  })
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'slug', slug],
    queryFn: async () => {
      const res = await apiClient.get<CategoryDto>(`/categories/by-slug/${slug}`)
      return res.data
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  })
}

export function useCategoryChildren(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.children(id),
    queryFn: async () => {
      const res = await apiClient.get<{ items: CategoryDto[] }>(`/categories/${id}/children`)
      return res.data.items
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  })
}

// ── Questions ────────────────────────────────────────────────────────

function toItemQuestionDto(
  incoming: ItemQuestionDto | ItemQuestionNotification,
  existing?: ItemQuestionDto,
): ItemQuestionDto {
  if ('askerId' in incoming && 'questionId' in incoming) {
    // It's a notification, map it to DTO
    return {
      id: incoming.questionId,
      itemId: incoming.itemId,
      askerId: incoming.askerId,
      question: incoming.question,
      answer: incoming.answer ?? existing?.answer,
      createdAt: incoming.createdAt,
      answeredAt:
        incoming.answer != null
          ? existing?.answeredAt ?? new Date().toISOString()
          : existing?.answeredAt,
    }
  }

  // It's already a DTO
  return incoming as ItemQuestionDto
}



function upsertQuestionPage(
  current: PagedList<ItemQuestionDto> | undefined,
  incoming: ItemQuestionDto | ItemQuestionNotification,
): PagedList<ItemQuestionDto> | undefined {
  if (!current) {
    return current
  }

  const questionId = 'questionId' in incoming ? incoming.questionId : incoming.id
  const existingIndex = current.items.findIndex((question) => question.id === questionId)
  const existingQuestion = existingIndex >= 0 ? current.items[existingIndex] : undefined
  const nextQuestion = toItemQuestionDto(incoming, existingQuestion)

  if (existingIndex >= 0) {
    return {
      ...current,
      items: current.items.map((question, index) =>
        index === existingIndex ? { ...question, ...nextQuestion } : question,
      ),
    }
  }

  const pageSize = current.metadata.pageSize || current.items.length || 1

  return {
    items: [nextQuestion, ...current.items].slice(0, pageSize),
    metadata: {
      ...current.metadata,
      totalCount: current.metadata.totalCount + 1,
      hasNext:
        current.metadata.totalCount + 1 >
        current.metadata.currentPage * pageSize,
    },
  }
}

function patchQuestionPage(
  current: PagedList<ItemQuestionDto> | undefined,
  questionId: string,
  updater: (question: ItemQuestionDto) => ItemQuestionDto,
): PagedList<ItemQuestionDto> | undefined {
  if (!current || !current.items.some((question) => question.id === questionId)) {
    return current
  }

  return {
    ...current,
    items: current.items.map((question) =>
      question.id === questionId ? updater(question) : question,
    ),
  }
}

export function upsertItemQuestionCaches(
  queryClient: QueryClient,
  itemId: string,
  incoming: ItemQuestionDto | ItemQuestionNotification,
): void {
  queryClient.setQueriesData<PagedList<ItemQuestionDto>>(
    { queryKey: queryKeys.items.questionsRoot(itemId) },
    (current) => upsertQuestionPage(current, incoming),
  )
}

export function patchItemQuestionCaches(
  queryClient: QueryClient,
  itemId: string,
  questionId: string,
  updater: (question: ItemQuestionDto) => ItemQuestionDto,
): void {
  queryClient.setQueriesData<PagedList<ItemQuestionDto>>(
    { queryKey: queryKeys.items.questionsRoot(itemId) },
    (current) => patchQuestionPage(current, questionId, updater),
  )
}

export function useItemQuestions(
  itemId: string,
  params?: PaginationParams,
  options?: { refetchInterval?: number | false; enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.items.questions(itemId, params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemQuestionDto>>(`/items/${itemId}/questions`, { params })
      return res.data
    },
    enabled: options?.enabled ?? !!itemId,
    refetchInterval: options?.refetchInterval ?? 60000,
  })
}

export function useAskQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, question }: { itemId: string; question: string }) => {
      const res = await apiClient.post<ItemQuestionDto>(`/items/${itemId}/questions`, { question })
      return res.data
    },
    onSuccess: (data, variables) => {
      upsertItemQuestionCaches(qc, variables.itemId, data)
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(variables.itemId) })
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
    onSuccess: (data, variables) => {
      if (data) {
        upsertItemQuestionCaches(qc, variables.itemId, data)
      } else {
        patchItemQuestionCaches(qc, variables.itemId, variables.questionId, (question) => ({
          ...question,
          answer: variables.answer,
          answeredAt: question.answeredAt ?? new Date().toISOString(),
        }))
      }
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(variables.itemId) })
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

// ── AI Suggest Description ────────────────────────────────────────────

export interface SuggestDescriptionRequest {
  title: string
  condition: string
  imageMediaUploadIds: string[]
  locale?: 'vi' | 'en'
}

export interface SuggestedCategory {
  id: string
  name: string
  path: string
  confidence: number
}

export interface SuggestDescriptionResponse {
  description: string
  /**
   * Indicates how to interpret `description`. The backend now returns sanitized
   * HTML (`'html'`) suitable for the Quill RichTextEditor. The field is optional
   * for forwards compatibility with older deployments that returned plain text.
   */
  descriptionFormat?: 'html' | 'plain_text'
  suggestedCategory: SuggestedCategory | null
  alternatives: SuggestedCategory[]
  warnings: string[]
}

/**
 * Convert a suggestion description into HTML safe for the Quill RichTextEditor.
 * - If the backend declares `descriptionFormat: 'html'`, pass through.
 * - If the value already looks like HTML (starts with one of our allowed tags),
 *   pass through as a forwards-compatible heuristic.
 * - Otherwise, treat as plain text: HTML-encode and wrap in a single <p>.
 *
 * This is defense-in-depth: the backend is the source of truth, but we still
 * never push raw model output into the editor.
 */
export function coerceSuggestionToEditorHtml(description: string, format?: string): string {
  if (!description) return ''
  if (format === 'html') return description
  if (looksLikeAllowedHtml(description)) return description

  const encoded = encodeHtmlEntities(description.replace(/\r\n/g, '\n').trim())
  if (!encoded) return ''
  return encoded
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function looksLikeAllowedHtml(value: string): boolean {
  const probe = value.slice(0, 200).toLowerCase().trimStart()
  return /^<\s*(p|ul|ol|strong|em|li|br)\b/.test(probe)
}

function encodeHtmlEntities(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function useSuggestDescription() {
  return useMutation({
    mutationFn: async (data: SuggestDescriptionRequest): Promise<SuggestDescriptionResponse> => {
      const res = await apiClient.post<SuggestDescriptionResponse>('/items/suggest-description', data)
      return res.data
    },
  })
}

export function mapSuggestError(err: unknown): { code: 'disabled' | 'unavailable' | 'rate' | 'other'; detail?: string } {
  const errAny = err as Record<string, unknown> | undefined
  const responseData = (errAny?.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
  const responseStatus = (errAny?.response as Record<string, unknown> | undefined)?.status as number | undefined
  const errors = responseData?.errors as Array<Record<string, unknown>> | undefined
  const code = responseData?.code ?? errors?.[0]?.code
  if (code === 'AiSuggestion.Disabled') return { code: 'disabled' }
  if (code === 'AiSuggestion.ProviderUnavailable') return { code: 'unavailable' }
  if (code === 'AiSuggestion.RateLimited' || responseStatus === 429) return { code: 'rate' }
  return { code: 'other', detail: responseData?.detail as string | undefined }
}

// Choose item shipping
export function useChooseItemShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      senderName,
      senderPhone,
      senderAddress,
      senderWard,
      senderDistrict,
      senderProvince,
      senderMetadata,
      weightGrams,
      insuranceValue,
      providerCode,
      lengthCm,
      widthCm,
      heightCm,
      externalTrackingNumber,
      externalCarrierName,
      notes,
    }: {
      itemId: string
      senderName: string
      senderPhone: string
      senderAddress: string
      senderWard: string
      senderDistrict: string
      senderProvince: string
      senderMetadata?: any
      weightGrams: number
      insuranceValue: number
      providerCode?: string
      lengthCm?: number
      widthCm?: number
      heightCm?: number
      externalTrackingNumber?: string
      externalCarrierName?: string
      notes?: string
    }) => {
      await apiClient.post(`/items/${itemId}/shipping`, {
        senderName,
        senderPhone,
        senderAddress,
        senderWard,
        senderDistrict,
        senderProvince,
        senderCarrierAddressDataJson: senderMetadata ? JSON.stringify({
          district_id: senderMetadata.id,
          ward_code: String(senderMetadata.code)
        }) : null,
        weightGrams,
        insuranceValue,
        providerCode: providerCode ?? null,
        lengthCm: lengthCm ?? undefined,
        widthCm: widthCm ?? undefined,
        heightCm: heightCm ?? undefined,
        externalTrackingNumber: externalTrackingNumber ?? null,
        externalCarrierName: externalCarrierName ?? undefined,
        notes: notes ?? undefined,
      })
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
    mutationFn: async ({ itemId, verifyByPlatform = false }: { itemId: string; verifyByPlatform?: boolean }) => {
      await apiClient.post(`/items/${itemId}/resubmit`, { verifyByPlatform })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.items.all })
      qc.invalidateQueries({ queryKey: queryKeys.items.my() })
    },
  })
}

export function useSellerItemStats() {
  return useQuery({
    queryKey: queryKeys.items.sellerStats(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<SellerItemStats>('/api/items/me/stats', { signal })
      return res.data
    }
  })
}

