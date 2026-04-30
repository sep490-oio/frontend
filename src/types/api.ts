export interface PagedMetadata {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface PagedList<T> {
  items: T[]
  metadata: PagedMetadata
}

export interface MoneyDto {
  amount: number
  currency: string
  symbol: string
}

export interface PaginationParams {
  pageNumber?: number
  pageSize?: number
}

export interface ApiError {
  type?: string
  status: number
  title: string
  detail?: string
  code?: string
  errors?: Record<string, string[]>
  requestId?: string
  traceId?: string
  metadata?: Record<string, unknown>
}

/**
 * Mirrors backend `ErrorNotification` SignalR payload (camelCase JSON shape).
 * See: OIO/src/core/OIO.Application/Context/AuctionContext/Hubs/IAuctionHubClient.cs
 */
export interface ErrorNotification {
  code?: string
  message?: string
  errors?: Record<string, string[]> | string[] | null
}

export interface HubCommandResult<T> {
  success: boolean
  data?: T
  /**
   * BE sends a structured `ErrorNotification` object. Kept as a union with
   * `string` for backwards compatibility with any legacy paths that may still
   * stringify the error before forwarding it to the client. Always normalize
   * via `normalizeErrorMessage` before showing to users.
   */
  error?: ErrorNotification | string | null
}
