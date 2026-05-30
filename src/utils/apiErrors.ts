import i18n from '@/app/i18n'

/**
 * Shape of the ASP.NET ProblemDetails response body.
 * The `code` field comes from `extensions["code"]` on the BE.
 */
interface ProblemDetailsResponse {
  title?: string
  detail?: string
  status?: number
  code?: string
  errors?: Record<string, string[]>
  metadata?: Record<string, unknown>
}

/**
 * Extract a user-friendly, localized error message from an Axios error.
 *
 * Resolution order:
 *   1. Map `response.data.code` → i18n key in `errors` namespace
 *   2. Fall back to `response.data.detail` (the BE English message)
 *   3. Fall back to the provided `fallback` string
 *
 * Usage:
 *   ```ts
 *   catch (err) {
 *     message.error(getApiErrorMessage(err, t('defaultError', 'Something went wrong')))
 *   }
 *   ```
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = i18n.t('errors:generic', 'Đã xảy ra lỗi. Vui lòng thử lại.'),
): string {
  const data = extractProblemDetails(error)
  if (!data) return fallback

  // 1. Try mapping the error code to an i18n key
  if (data.code) {
    const i18nKey = `errors:${data.code}`
    const translated = i18n.t(i18nKey, { defaultValue: '' })
    if (translated && translated !== i18nKey && translated !== '') {
      return translated
    }
  }

  // 2. Fall back to the detail message from BE
  if (data.detail) return data.detail

  // 3. Generic fallback
  return fallback
}

/**
 * Extract the error code string from an Axios error.
 * Useful for conditional logic based on error type.
 */
export function getApiErrorCode(error: unknown): string | undefined {
  return extractProblemDetails(error)?.code ?? undefined
}

/**
 * Extract ProblemDetails from an Axios error response.
 */
function extractProblemDetails(error: unknown): ProblemDetailsResponse | null {
  if (!error || typeof error !== 'object') return null

  // Axios error shape
  const axiosErr = error as { response?: { data?: ProblemDetailsResponse } }
  if (axiosErr.response?.data) return axiosErr.response.data

  return null
}
