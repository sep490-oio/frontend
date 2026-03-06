/**
 * Axios Instance — centralized HTTP client.
 *
 * All API requests go through this instance, which provides:
 * - Base URL configuration (swap between dev/staging/production)
 * - Automatic auth token injection on every request
 * - Silent token refresh on 401 (instead of immediate logout)
 *
 * Silent refresh pattern:
 *   1. A request gets a 401 (token expired)
 *   2. We pause that request and attempt POST /api/auth/refresh
 *   3. If refresh succeeds → update Redux + localStorage → replay the paused request
 *   4. If refresh fails → clear credentials → redirect to /login
 *
 * The "queue" prevents a "thundering herd": if 3 requests fire simultaneously
 * and all get a 401, only one refresh call is made — the other 2 are queued
 * and replayed once the refresh completes.
 */
import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { store } from '@/app/store';
import { setCredentials, clearCredentials } from '@/features/auth/authSlice';
import { refreshToken as callRefresh, getOrCreateDeviceId, getMe, mapApiUserToUser } from './authService';

const api = axios.create({
  // Base URL — no /api suffix. All endpoint paths begin with /api/...
  // Real backend:  VITE_API_BASE_URL=https://api.newlsun.com  (set in .env)
  // Local backend: VITE_API_BASE_URL=http://localhost:5000     (set in .env.local)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// ─── Request Interceptor ────────────────────────────────────────────
// Attaches the JWT access token to every outgoing request.
// This means individual API calls don't need to worry about auth headers.
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — Silent Refresh ──────────────────────────

/** Tracks whether a refresh call is already in-flight */
let isRefreshing = false;

/**
 * Queue of requests that arrived while a refresh was in-flight.
 * Each entry holds resolve/reject callbacks to replay the request
 * once we have a new token.
 */
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};
let failedQueue: QueueEntry[] = [];

/** Resolves or rejects all queued requests after a refresh attempt */
function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  // Success — pass through unchanged
  (response: AxiosResponse) => response,

  // Error — handle 401 with silent refresh
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 errors, and only once per request
    // (_retry flag prevents infinite loops if /auth/refresh itself returns 401)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request to be replayed
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // Start a refresh attempt
    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = localStorage.getItem('refreshToken');
    const deviceId = getOrCreateDeviceId();

    if (!storedRefreshToken) {
      // No refresh token stored — force logout immediately
      isRefreshing = false;
      store.dispatch(clearCredentials());
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const tokenDto = await callRefresh(storedRefreshToken, deviceId);
      const newAccessToken = tokenDto.accessToken;
      const newRefreshToken = tokenDto.refreshToken;

      // Fetch updated user data with the fresh token
      const userDto = await getMe(newAccessToken);
      const user = mapApiUserToUser(userDto, newAccessToken);

      // Update Redux state + localStorage with the new credentials
      store.dispatch(
        setCredentials({ user, accessToken: newAccessToken, refreshToken: newRefreshToken })
      );

      // Update the Authorization header on the original failed request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Replay all queued requests with the new token
      processQueue(null, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed (expired, revoked, server error) — force logout
      processQueue(refreshError, null);
      store.dispatch(clearCredentials());
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api };
