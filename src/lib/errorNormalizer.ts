import axios from 'axios'
import i18n from '@/app/i18n'

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
 * Priority: i18n(code) → detail → message → title → first validation error → fallback.
 * Never returns "[object Object]" — guards against object coercion that
 * would leak through `String(obj)` or `new Error(obj)` on the FE.
 */
export function normalizeErrorMessage(input: unknown, fallback: string): string {
  if (input == null) return fallback
  if (typeof input === 'string') return input.trim() || fallback

  // Axios error (has response / isAxiosError flag) — must be checked
  // BEFORE `instanceof Error` because AxiosError extends Error and we need
  // to extract the structured response body (detail / message / title).
  if (axios.isAxiosError(input)) {
    const data = input.response?.data
    if (data) {
      const fromData = extractFromObject(data, fallback)
      if (fromData !== fallback) return fromData
    }
    return input.message || fallback
  }

  // Generic Error instance (non-Axios)
  if (input instanceof Error) {
    return input.message || fallback
  }

  // Plain object — Axios ProblemDetails, SignalR ErrorNotification, validation dict
  if (typeof input === 'object') {
    return extractFromObject(input as Record<string, unknown>, fallback)
  }

  return fallback
}

/**
 * Extract the error code string from an error payload.
 * Useful for conditional logic based on error type.
 */
export function getErrorCode(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') return undefined
  if (axios.isAxiosError(input)) {
    return (input.response?.data as Record<string, unknown>)?.code as string | undefined
  }
  return (input as Record<string, unknown>).code as string | undefined
}

function tryTranslateCode(code: unknown): string | null {
  if (typeof code !== 'string' || !code) return null
  const i18nKey = `errors:${code}`
  const translated = i18n.t(i18nKey, { defaultValue: '' })
  // i18next returns the key itself when no translation is found, or '' if defaultValue is ''
  if (translated && translated !== i18nKey && translated !== '') {
    return translated
  }
  return null
}

function extractFromObject(obj: unknown, fallback: string): string {
  if (!obj || typeof obj !== 'object') return fallback
  const record = obj as Record<string, unknown>

  // 1. Try i18n translation from error code (highest priority)
  const translated = tryTranslateCode(record.code)
  if (translated) return translated

  // 2. ProblemDetails / SignalR ErrorNotification: detail → message → title
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.title === 'string' && record.title.trim()) return record.title

  // 3. Validation dictionary: { errors: { field: ['msg1', 'msg2'] } } or array
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

