import axios from 'axios'
import { API_URL, STORAGE_KEYS } from '@/utils/constants'
import { getDeviceId } from '@/lib/axios'

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
const REFRESH_TIMEOUT_MS = 10000
const TOKEN_EXPIRY_BUFFER_MS = 60000 // refresh 60s before expiry

/**
 * Check if the current access token is expired or near-expiry.
 * Returns true if token should be refreshed.
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expMs = payload.exp * 1000
    return Date.now() >= expMs - TOKEN_EXPIRY_BUFFER_MS
  } catch {
    return true // malformed token = treat as expired
  }
}

/**
 * Shared token refresh with mutex.
 * Used by both axios interceptor and SignalR.
 * Only one refresh request is in-flight at a time.
 * On failure: clears tokens and redirects to /login.
 *
 * NOTE: If auth migrates to httpOnly cookies (see axios.ts TODO),
 * this module is the single place that must change.
 */
export async function refreshToken(): Promise<string> {
  // If already refreshing, wait for the in-flight request
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  const refreshTokenStr = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (!refreshTokenStr) {
    handleRefreshFailure()
    throw new Error('No refresh token')
  }

  const deviceId = getDeviceId() ?? localStorage.getItem(STORAGE_KEYS.DEVICE_ID)
  if (!deviceId) {
    handleRefreshFailure()
    throw new Error('No device ID for refresh')
  }

  const expiredAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

  // AbortController to cancel the HTTP request if timeout fires
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn('Token refresh timeout — aborting request')
    controller.abort()
  }, REFRESH_TIMEOUT_MS)

  isRefreshing = true
  refreshPromise = axios.post(`${API_URL}/auth/refresh`, {
    refreshToken: refreshTokenStr,
    deviceId,
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: expiredAccessToken ? `Bearer ${expiredAccessToken}` : '',
    },
    signal: controller.signal,
  }).then(({ data }) => {
    const newAccessToken = data.accessToken as string
    const newRefreshToken = data.refreshToken as string
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
    return newAccessToken
  }).catch((error) => {
    handleRefreshFailure()
    throw error
  }).finally(() => {
    clearTimeout(timeoutId)
    isRefreshing = false
    refreshPromise = null
  })

  return refreshPromise
}

/**
 * Central logout on refresh failure.
 * Clears tokens and redirects to login.
 */
function handleRefreshFailure(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  window.location.href = '/login'
}
