import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_URL, STORAGE_KEYS } from '@/utils/constants'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request queue for token refresh
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
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // For 2FA verify endpoint, use the separate 2FA temp token
  if (config.url?.includes('/auth/two-factor')) {
    const twoFaToken = localStorage.getItem(STORAGE_KEYS.TWO_FA_TOKEN)
    if (twoFaToken) {
      config.headers.Authorization = `Bearer ${twoFaToken}`
    }
  } else {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  config.headers['X-Correlation-Id'] = crypto.randomUUID()
  return config
})

// Response interceptor — silent JWT refresh + queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
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
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (!refreshToken) {
        throw new Error('No refresh token')
      }

      const deviceId = getDeviceId()
      // BE requires ExpiredTokenAllowed policy — must send the expired access token
      const expiredAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
        deviceId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(expiredAccessToken ? { Authorization: `Bearer ${expiredAccessToken}` } : {}),
        },
      })

      const newAccessToken = data.accessToken as string
      const newRefreshToken = data.refreshToken as string

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)

      processQueue(null, newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)

      // Logout: clear tokens and redirect
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      window.location.href = '/login'

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
    headers: { ...config?.headers, 'Idempotency-Key': crypto.randomUUID() },
  })
}

export function idempotentPut<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof apiClient.put>[2]) {
  return apiClient.put<T>(url, data, {
    ...config,
    headers: { ...config?.headers, 'Idempotency-Key': crypto.randomUUID() },
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
