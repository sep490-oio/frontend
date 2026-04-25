import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_URL, STORAGE_KEYS, uuid } from '@/utils/constants'
import { refreshToken, isTokenExpired } from '@/lib/tokenRefresh'

// ── Terms-gate 409 interceptor ────────────────────────────────────────────────
// When BE returns 409 with code "Terms.PendingAcceptance", the interceptor calls
// the registered handler which opens TermsAcceptanceModal, waits for acceptance,
// then retries the original request preserving the full payload (§4.3 Scenario 2).
//
// The handler is registered by TermsGateProvider (mounted in AppLayout) so it is
// available for the lifetime of an authenticated session. Until registration the
// interceptor passes 409-Terms errors through as normal rejections (graceful
// degradation: BE gate still fires; user sees a toast).

type TermsGateHandler = (
  originalRequest: InternalAxiosRequestConfig & { _termsRetry?: boolean },
) => Promise<boolean>

let _termsGateHandler: TermsGateHandler | null = null

export function registerTermsGateHandler(handler: TermsGateHandler) {
  _termsGateHandler = handler
}

export function unregisterTermsGateHandler() {
  _termsGateHandler = null
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Axios request queue — gates retrying failed requests (separate from tokenRefresh mutex)
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

// Request interceptor — attach token + correlation ID
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // For 2FA verify endpoint, use the separate 2FA temp token
  if (config.url?.includes('/auth/two-factor')) {
    const twoFaToken = localStorage.getItem(STORAGE_KEYS.TWO_FA_TOKEN)
    if (twoFaToken) {
      config.headers.Authorization = `Bearer ${twoFaToken}`
    }
  } else if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/refresh')) {
    let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      if (isTokenExpired()) {
        try {
          token = await refreshToken()
        } catch (error) {
          // If proactive refresh fails, proceed with the expired token.
          // The response interceptor will catch the 401 or handleRefreshFailure will redirect.
        }
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  }
  config.headers['X-Correlation-Id'] = uuid()
  return config
})

// Response interceptor — silent JWT refresh + queue + Terms-gate 409 recovery
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
      _termsRetry?: boolean
    }

    // ── 409 Terms.PendingAcceptance recovery ─────────────────────────────────
    // Only intercept once per request (_termsRetry guard) and only when a
    // handler is registered (TermsGateProvider is mounted).
    if (
      error.response?.status === 409 &&
      !originalRequest._termsRetry &&
      _termsGateHandler
    ) {
      const responseData = error.response.data as { code?: string } | undefined
      if (responseData?.code === 'Terms.PendingAcceptance') {
        originalRequest._termsRetry = true
        const accepted = await _termsGateHandler(originalRequest)
        if (accepted) {
          return apiClient(originalRequest)
        }
        // User cancelled — propagate original error
        return Promise.reject(error)
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If no token exists (anonymous session), just reject — don't try refresh
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      return Promise.reject(error)
    }

    // Skip refresh for auth endpoints (login, refresh, 2FA verify)
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/two-factor')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newAccessToken = await refreshToken()
      processQueue(null, newAccessToken)
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      // logout already handled by refreshToken() -> handleRefreshFailure()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// Helper for idempotent POST/PUT requests (bid, buy-now, upload, dispute messages)
// TODO: Token storage in localStorage is vulnerable to XSS. Migrate to httpOnly cookies when backend supports it.
export function idempotentPost<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof apiClient.post>[2]) {
  return apiClient.post<T>(url, data, {
    ...config,
    headers: { ...config?.headers, 'Idempotency-Key': uuid() },
  })
}

export function idempotentPut<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof apiClient.put>[2]) {
  return apiClient.put<T>(url, data, {
    ...config,
    headers: { ...config?.headers, 'Idempotency-Key': uuid() },
  })
}

// Helper to get deviceId from localStorage or parse from JWT
export function getDeviceId(): string | null {
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID)
  if (stored) return stored
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.device_id ?? null
  } catch {
    return null
  }
}

/**
 * Safely extract array from API response.
 * Handles both bare arrays and PagedList `{ items: T[] }` responses.
 */
export function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown }).items)) {
    return (data as { items: T[] }).items
  }
  return []
}

export default apiClient
