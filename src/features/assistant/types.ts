export interface AssistantConversationDto {
  id: string
  roleContext: string
  title: string
  createdAt: string
  lastMessageAt: string
}

export interface AssistantMessageDto {
  id: string
  conversationId: string
  sender: 'user' | 'assistant' | 'system'
  content: string
  /** JSON-encoded array of {title, sourceUrl} */
  citations: string | null
  /** JSON-encoded object with {confidence, needsHumanSupport, suggestedActions} */
  metadata: string | null
  createdAt: string
}

export interface AssistantCitation {
  title: string
  sourceUrl: string | null
}

export interface AssistantSuggestedAction {
  label: string
  deepLink: string
}

export interface AssistantPageContext {
  route: string
  entityType?: string
  entityId?: string
}

export interface SendMessageRequest {
  userText: string
  locale?: string
  page?: AssistantPageContext
}

export interface SendMessageResponse {
  messageId: string
  answer: string
  citations: AssistantCitation[]
  suggestedActions: AssistantSuggestedAction[]
  confidence: number
  needsHumanSupport: boolean
}

export type AssistantSender = AssistantMessageDto['sender']
