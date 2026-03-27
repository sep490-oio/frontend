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
}

export interface HubCommandResult<T> {
  success: boolean
  data?: T
  error?: string
}
