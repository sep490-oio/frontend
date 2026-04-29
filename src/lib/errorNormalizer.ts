import axios from 'axios'

/**
 * Mirrors the backend `ErrorNotification` record sent over SignalR
 * (see `OIO/src/core/OIO.Application/Context/AuctionContext/Hubs/IAuctionHubClient.cs`).
 * Field casing follows JSON serialization (camelCase).
 */
export type ErrorNotification = {
  code?: string
  message?: string
  errors?: Record<string, string[]> | string[] | null
}

/**
 * Normalize any unknown error/payload into a user-readable message.
 * Priority: detail → message → title → first validation error → fallback.
 * Never returns "[object Object]" — guards against object coercion that
 * would leak through `String(obj)` or `new Error(obj)` on the FE.
 */
export function normalizeErrorMessage(input: unknown, fallback: string): string {
  if (input == null) return fallback
  if (typeof input === 'string') return input.trim() || fallback

  // Error instance
  if (input instanceof Error) {
    return input.message || fallback
  }

  // Axios error (has response / isAxiosError flag)
  if (axios.isAxiosError(input)) {
    const data = input.response?.data
    if (data) {
      const fromData = extractFromObject(data, fallback)
      if (fromData !== fallback) return fromData
    }
    return input.message || fallback
  }

  // Plain object — Axios ProblemDetails, SignalR ErrorNotification, validation dict
  if (typeof input === 'object') {
    return extractFromObject(input as Record<string, unknown>, fallback)
  }

  return fallback
}

function extractFromObject(obj: unknown, fallback: string): string {
  if (!obj || typeof obj !== 'object') return fallback
  const record = obj as Record<string, unknown>

  // ProblemDetails / SignalR ErrorNotification priority: detail → message → title
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.title === 'string' && record.title.trim()) return record.title

  // Validation dictionary: { errors: { field: ['msg1', 'msg2'] } } or array
  const errors = record.errors
  if (errors && typeof errors === 'object') {
    if (Array.isArray(errors)) {
      const first = errors.find((e) => typeof e === 'string' && e.trim())
      if (typeof first === 'string') return first
    } else {
      for (const v of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          const firstMsg = v.find((m) => typeof m === 'string' && m.trim())
          if (typeof firstMsg === 'string') return firstMsg
        } else if (typeof v === 'string' && v.trim()) {
          return v
        }
      }
    }
  }

  return fallback
}
