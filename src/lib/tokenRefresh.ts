import axios from 'axios'
import { API_URL, STORAGE_KEYS } from '@/utils/constants'
import { getDeviceId } from '@/lib/axios'

let isRefreshing = false
let refreshPromise: Promise<string> | null = null
const REFRESH_TIMEOUT_MS = 10000
const TOKEN_EXPIRY_BUFFER_MS = 60000 // refresh 60s before expiry
const LOCK_NAME = 'oio-fe:refresh-token:v1'
let warnedFallback = false

let cachedToken: string | null = null
let cachedExpMs: number = 0

/**
 * Check if the current access token is expired or near-expiry.
 * Returns true if token should be refreshed.
 * Uses in-memory caching to avoid redundant JWT decoding on every request.
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return true
  
  const explicitExpiryStr = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
  if (explicitExpiryStr) {
    // Append 'Z' if missing to force UTC parsing, as the backend returns UTC without Z
    const normalizedStr = explicitExpiryStr.endsWith('Z') ? explicitExpiryStr : `${explicitExpiryStr}Z`
    const expMs = new Date(normalizedStr).getTime()
    if (!isNaN(expMs)) {
      return Date.now() >= expMs - TOKEN_EXPIRY_BUFFER_MS
    }
  }

  // Fallback to JWT parsing if explicit expiry is missing
  if (token === cachedToken) {
    return Date.now() >= cachedExpMs - TOKEN_EXPIRY_BUFFER_MS
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    cachedToken = token
    cachedExpMs = payload.exp * 1000
    return Date.now() >= cachedExpMs - TOKEN_EXPIRY_BUFFER_MS
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
  let refreshTokenStr = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (!refreshTokenStr) {
    handleRefreshFailure()
    throw new Error('No refresh token')
  }
  refreshTokenStr = refreshTokenStr.replace(/^["']|["']$/g, '').trim()

  const deviceId = getDeviceId() ?? localStorage.getItem(STORAGE_KEYS.DEVICE_ID)
  if (!deviceId) {
    handleRefreshFailure()
    throw new Error('No device ID for refresh')
  }

  let expiredAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (expiredAccessToken) {
    expiredAccessToken = expiredAccessToken.replace(/^["']|["']$/g, '').trim()
  }

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
    const newAccessTokenExpiresAt = data.accessTokenExpiresAt as string | undefined
    const newSession = data.session

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
    if (newAccessTokenExpiresAt) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, newAccessTokenExpiresAt)
    }
    if (newSession) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession))
    }
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
export async function refreshToken(failedToken?: string | null): Promise<string> {
  // Cross-tab serialization via Web Locks API (Chrome 69+, FF 96+, Safari 15.4+, Edge 79+)
  if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
    return navigator.locks.request(LOCK_NAME, async () => {
      // Post-lock re-check: another tab may have refreshed while we waited.
      const current = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      
      if (failedToken) {
        // We know `failedToken` resulted in a 401. If `current` is different, 
        // another tab already refreshed it successfully.
        if (current && current !== failedToken) return current
      } else {
        // Proactive refresh (e.g., from request interceptor or SignalR factory).
        // If the stored access token is still valid (within the 60s buffer), skip BE rotation.
        if (current && !isTokenExpired()) return current
      }
      
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
 * Clears tokens and redirects to login with returnTo so the user
 * can resume their work after re-authentication.
 */
export function handleRefreshFailure(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
  localStorage.removeItem(STORAGE_KEYS.SESSION)

  // Preserve current path as returnTo, excluding auth pages and external URLs
  const current = window.location.pathname + window.location.search + window.location.hash
  const isAuthPage =
    current.startsWith('/login') ||
    current.startsWith('/2fa') ||
    current.startsWith('/register') ||
    current === '/'

  if (isAuthPage) {
    window.location.href = '/login'
  } else {
    window.location.href = `/login?returnTo=${encodeURIComponent(current)}`
  }
}
