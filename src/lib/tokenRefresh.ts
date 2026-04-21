import axios from 'axios'
import { API_URL, STORAGE_KEYS } from '@/utils/constants'
import { getDeviceId } from '@/lib/axios'

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
const REFRESH_TIMEOUT_MS = 10000
const TOKEN_EXPIRY_BUFFER_MS = 60000 // refresh 60s before expiry
const LOCK_NAME = 'oio-fe:refresh-token:v1'
let warnedFallback = false

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
 * Perform the actual refresh-token network call.
 * Private helper extracted from refreshToken() so the Web-Locks wrapper
 * and the fallback path can both reuse it without duplicating logic.
 * Preserves the module-scoped mutex (isRefreshing + refreshPromise) so the
 * fallback path retains its original in-tab de-duplication behavior.
 */
async function doRefresh(): Promise<string> {
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
 * Shared token refresh with cross-tab serialization.
 * Used by both axios interceptor and SignalR.
 *
 * Uses the Web Locks API (navigator.locks) when available to serialize
 * refresh calls across tabs on the same origin. A post-lock re-check
 * avoids a second BE rotation when another tab already refreshed while
 * we were waiting for the lock.
 *
 * Falls back to the module-scoped mutex (isRefreshing + refreshPromise)
 * for browsers without Web Locks (Safari < 15.4) or test environments
 * where navigator.locks is not polyfilled. Fallback behavior is
 * identical to the pre-fix implementation.
 *
 * On failure: clears tokens and redirects to /login.
 *
 * NOTE: If auth migrates to httpOnly cookies (see axios.ts TODO),
 * this module is the single place that must change.
 */
export async function refreshToken(): Promise<string> {
  // Cross-tab serialization via Web Locks API (Chrome 69+, FF 96+, Safari 15.4+, Edge 79+)
  if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
    return navigator.locks.request(LOCK_NAME, async () => {
      // Post-lock re-check: another tab may have refreshed while we waited.
      // If the stored access token is still valid (within the 60s buffer),
      // use it instead of burning another BE rotation.
      const current = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      if (current && !isTokenExpired()) return current
      return doRefresh()
    })
  }

  // Fallback for older browsers / environments without Web Locks.
  // Preserves the original in-tab mutex (isRefreshing + refreshPromise).
  if (!warnedFallback) {
    console.warn('[tokenRefresh] navigator.locks unavailable — using in-tab fallback')
    warnedFallback = true
  }
  if (isRefreshing && refreshPromise) return refreshPromise
  return doRefresh()
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
