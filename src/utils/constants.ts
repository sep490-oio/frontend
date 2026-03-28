export const API_URL = import.meta.env.VITE_API_URL as string
export const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL as string

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'oio_access_token',
  REFRESH_TOKEN: 'oio_refresh_token',
  DEVICE_ID: 'oio_device_id',
  LANGUAGE: 'oio_language',
  TWO_FA_TOKEN: 'oio_2fa_token',
} as const

export const DEFAULT_PAGE_SIZE = 12
export const DEFAULT_CURRENCY = 'VND'

export const AUCTION_EXTENSION_THRESHOLD_MINUTES = 5
export const MAX_EXTENSIONS_PER_AUCTION = 10

export const USER_HUB_ENABLED = import.meta.env.VITE_ENABLE_USER_HUB !== 'false'

/** crypto.randomUUID() fallback for non-secure (HTTP) contexts */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  )
}
