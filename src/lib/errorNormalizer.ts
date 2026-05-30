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
 * Priority: i18n(code) → errors (i18n-aware) → detail → message → title → fallback.
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

  // 2. Validation dictionary: { errors: { field: ['msg1', 'msg2'] } } or array
  //    Checked BEFORE `detail` because 422 ProblemDetails sets `detail` to a
  //    generic string like "One or more violation errors occurred" while the
  //    actionable messages live inside the `errors` dict.
  const errors = record.errors
  if (errors && typeof errors === 'object') {
    const messages: string[] = []
    if (Array.isArray(errors)) {
      for (const e of errors) {
        if (typeof e === 'string' && e.trim()) messages.push(translateViolation(e))
      }
    } else {
      for (const [fieldKey, v] of Object.entries(errors as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          for (const m of v) {
            if (typeof m === 'string' && m.trim()) messages.push(translateViolation(m, fieldKey))
          }
        } else if (typeof v === 'string' && v.trim()) {
          messages.push(translateViolation(v, fieldKey))
        }
      }
    }
    if (messages.length > 0) return messages.join('; ')
  }

  // 3. ProblemDetails / SignalR ErrorNotification: detail → message → title
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.title === 'string' && record.title.trim()) return record.title

  return fallback
}

// ── Violation i18n ────────────────────────────────────────────────────
//
// Backend violation messages follow the ErrorCatalog.DefaultTemplate patterns:
//   "{field} must be greater than {value}."
//   "{field} must not be empty."
//   "{field} must be between {min} and {max} (inclusive)."
//
// The serialized ProblemDetails groups them under `errors`:
//   { "buyNowAmount": ["BuyNowAmount must be greater than 10000."] }
//
// We attempt i18n translation via:
//   1. Translate field name: `errors:fields.buyNowAmount` → "Buy Now Price"
//   2. Match message against known templates, extract params
//   3. Translate template: `errors:violations.greaterThan` → "{{field}} must be greater than {{value}}."
//   4. If no i18n key exists, return the raw backend message as-is.

/**
 * Known violation template patterns.
 * Each entry: [i18n key suffix, regex to match the English backend message, param names to extract]
 * Order matters — more specific patterns first.
 */
const VIOLATION_PATTERNS: Array<{
  key: string
  pattern: RegExp
  params: string[]
}> = [
  // Required
  { key: 'notNull', pattern: /must not be null/, params: [] },
  { key: 'notEmpty', pattern: /must not be empty/, params: [] },
  { key: 'notEmptyGuid', pattern: /must not be an empty GUID/, params: [] },
  { key: 'notBlank', pattern: /must not be blank/, params: [] },
  { key: 'notDefault', pattern: /must not be the (.+) value/, params: ['default'] },

  // Compare (order: between before greater/less)
  { key: 'betweenInclusive', pattern: /must be between (.+) and (.+) \(inclusive\)/, params: ['min', 'max'] },
  { key: 'betweenExclusive', pattern: /must be between (.+) and (.+) \(exclusive\)/, params: ['min', 'max'] },

  // Numeric shortcuts — BEFORE generic compare so "greater than 0" maps to "positive"
  { key: 'positive', pattern: /must be greater than 0\.?$/, params: [] },
  { key: 'negative', pattern: /must be less than 0\.?$/, params: [] },
  { key: 'nonPositive', pattern: /must be less than or equal to 0\.?$/, params: [] },
  { key: 'nonNegative', pattern: /must be greater than or equal to 0\.?$/, params: [] },
  { key: 'zero', pattern: /must be 0\.?$/, params: [] },
  { key: 'nonZero', pattern: /must not be 0\.?$/, params: [] },
  { key: 'multipleOf', pattern: /must be a multiple of (.+)/, params: ['step'] },
  { key: 'precisionScale', pattern: /must have at most (\d+) digits? in total, with up to (\d+) decimal/, params: ['precision', 'scale'] },

  // Generic compare — after numeric shortcuts
  { key: 'greaterThanOrEqual', pattern: /must be greater than or equal to (.+)/, params: ['value'] },
  { key: 'greaterThan', pattern: /must be greater than (.+)/, params: ['value'] },
  { key: 'lessThanOrEqual', pattern: /must be less than or equal to (.+)/, params: ['value'] },
  { key: 'lessThan', pattern: /must be less than (.+)/, params: ['value'] },
  { key: 'equal', pattern: /must be equal to (.+)/, params: ['value'] },
  { key: 'notEqual', pattern: /must not be equal to (.+)/, params: ['value'] },

  // Text
  { key: 'matches', pattern: /must match the required pattern\. Pattern: (.+)/, params: ['pattern'] },
  { key: 'startsWith', pattern: /must start with "(.+)"/, params: ['prefix'] },
  { key: 'endsWith', pattern: /must end with "(.+)"/, params: ['suffix'] },
  { key: 'contains', pattern: /must contain "(.+)"/, params: ['substring'] },
  { key: 'exactLength', pattern: /must be exactly (\d+) characters? long/, params: ['length'] },
  { key: 'lengthBetween', pattern: /must be between (\d+) and (\d+) characters? long/, params: ['min', 'max'] },
  { key: 'maxLength', pattern: /must be at most (\d+) characters? long/, params: ['max'] },
  { key: 'minLength', pattern: /must be at least (\d+) characters? long/, params: ['min'] },
  { key: 'format', pattern: /has an invalid format/, params: [] },

  // Collection
  { key: 'notContains', pattern: /must not contain "(.+)"/, params: ['item'] },
  { key: 'noDuplicates', pattern: /must not contain duplicate values?\. Duplicate: (.+)/, params: ['duplicate'] },
  { key: 'countBetween', pattern: /must contain between (\d+) and (\d+) item/, params: ['min', 'max'] },
  { key: 'countMin', pattern: /must contain at least (\d+) item/, params: ['min'] },
  { key: 'countMax', pattern: /must contain at most (\d+) item/, params: ['max'] },
  { key: 'inSet', pattern: /must be one of: (.+)/, params: ['set'] },
  { key: 'notInSet', pattern: /must not be one of: (.+)/, params: ['set'] },

  // Enum
  { key: 'inEnum', pattern: /must be a defined value of enum (.+)\. Value: (.+)/, params: ['enum', 'value'] },

  // Time
  { key: 'after', pattern: /must be after (.+)/, params: ['time'] },
  { key: 'before', pattern: /must be before (.+)/, params: ['time'] },
  { key: 'timeRange', pattern: /must be between (.+) and (.+)/, params: ['start', 'end'] },
  { key: 'notInPast', pattern: /must not be in the past/, params: [] },
  { key: 'notInFuture', pattern: /must not be in the future/, params: [] },
  { key: 'utc', pattern: /must be in UTC/, params: [] },
  { key: 'notOverlapping', pattern: /must not overlap with an existing range/, params: [] },
]

/**
 * Translate a single violation message string.
 *
 * @param rawMessage - The raw English message from the backend (e.g. "BuyNowAmount must be greater than 10000.")
 * @param fieldKey - The camelCase field key from the errors dict (e.g. "buyNowAmount")
 * @returns Translated message, or the raw message if no i18n key exists.
 */
function translateViolation(rawMessage: string, fieldKey?: string): string {
  // Try to translate the field name
  const translatedField = fieldKey
    ? i18n.t(`errors:fields.${fieldKey}`, { defaultValue: '' })
    : ''

  // Try to match against known violation patterns
  for (const { key, pattern, params: paramNames } of VIOLATION_PATTERNS) {
    const match = rawMessage.match(pattern)
    if (!match) continue

    const i18nKey = `errors:violations.${key}`

    // Build interpolation params
    const interpolation: Record<string, string> = {}
    if (translatedField) {
      interpolation.field = translatedField
    } else if (fieldKey) {
      // Fallback: humanize the camelCase field key → "Buy Now Amount"
      interpolation.field = humanizeFieldName(fieldKey)
    } else {
      // Extract field from the raw message (everything before " must" / " has")
      const fieldMatch = rawMessage.match(/^(.+?)\s+(?:must|has)\s/)
      interpolation.field = fieldMatch?.[1] ?? fieldKey ?? ''
    }

    for (let i = 0; i < paramNames.length; i++) {
      interpolation[paramNames[i]] = match[i + 1]?.replace(/\.$/, '') ?? ''
    }

    const translated = i18n.t(i18nKey, { ...interpolation, defaultValue: '' })
    if (translated && translated !== i18nKey && translated !== '') {
      return translated
    }

    // No i18n key found — rebuild with translated field name if available
    if (translatedField && fieldKey) {
      // Extract the original field name from the start of the message
      const fieldMatch = rawMessage.match(/^(.+?)\s+(must|has)\s/)
      if (fieldMatch) {
        return rawMessage.replace(fieldMatch[1], translatedField)
      }
    }

    break // matched pattern but no translation — fall through to raw message
  }

  // No pattern matched — still try field-level translation on the raw message
  if (translatedField && fieldKey) {
    const fieldMatch = rawMessage.match(/^(.+?)\s+(must|has)\s/)
    if (fieldMatch) {
      return rawMessage.replace(fieldMatch[1], translatedField)
    }
  }

  return rawMessage
}

/**
 * Convert camelCase/PascalCase field name to human-readable form.
 * "buyNowAmount" → "Buy Now Amount"
 * "BuyNowAmount" → "Buy Now Amount"
 */
function humanizeFieldName(fieldKey: string): string {
  return fieldKey
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}
