import apiClient from '@/lib/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssistantConversationDto,
  AssistantMessageDto,
  SendMessageRequest,
  SendMessageResponse,
} from './types'

export const assistantQueryKeys = {
  all: ['assistant'] as const,
  conversations: () => [...assistantQueryKeys.all, 'conversations'] as const,
  messages: (conversationId: string) =>
    [...assistantQueryKeys.all, 'messages', conversationId] as const,
}

interface CreateConversationBody {
  roleContext: string
  title?: string
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: async (body: CreateConversationBody): Promise<string> => {
      const res = await apiClient.post<string>('/assistant/conversations', body)
      // BE returns the bare GUID per OkHttpResult; some serializers wrap as { value }
      const data = res.data as unknown
      if (typeof data === 'string') return data
      if (data && typeof data === 'object' && 'value' in (data as object)) {
        const v = (data as { value: unknown }).value
        if (typeof v === 'string') return v
      }
      return String(data)
    },
  })
}

export function useAssistantConversations(enabled = true) {
  return useQuery({
    queryKey: assistantQueryKeys.conversations(),
    queryFn: async () => {
      const res = await apiClient.get<{
        items: AssistantConversationDto[]
        metadata: { totalCount: number; pageSize: number; currentPage: number; totalPages: number }
      }>('/assistant/conversations')
      return res.data
    },
    enabled,
  })
}

export function useAssistantMessages(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId ? assistantQueryKeys.messages(conversationId) : ['assistant', 'messages', 'noop'],
    queryFn: async () => {
      const res = await apiClient.get<{
        items: AssistantMessageDto[]
        metadata: { totalCount: number; pageSize: number; currentPage: number; totalPages: number }
      }>(`/assistant/conversations/${conversationId}/messages`, { params: { pageSize: 50 } })
      return res.data
    },
    enabled: Boolean(conversationId),
  })
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: SendMessageRequest): Promise<SendMessageResponse> => {
      if (!conversationId) throw new Error('No conversation')
      const res = await apiClient.post<SendMessageResponse>(
        `/assistant/conversations/${conversationId}/messages`,
        body,
      )
      return res.data
    },
    onSuccess: () => {
      if (conversationId) {
        qc.invalidateQueries({ queryKey: assistantQueryKeys.messages(conversationId) })
      }
    },
  })
}

export function parseCitations(json: string | null): import('./types').AssistantCitation[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseMessageMetadata(json: string | null): {
  confidence?: number
  needsHumanSupport?: boolean
  suggestedActions?: import('./types').AssistantSuggestedAction[]
} {
  if (!json) return {}
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}
