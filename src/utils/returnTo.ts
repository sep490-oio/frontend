/**
 * Helpers for preserving + safely consuming a `returnTo` redirect target
 * across the auth flow.
 *
 * Security: only same-origin relative paths starting with `/` are allowed.
 * Reject `//foo` (protocol-relative), `https://...` (open-redirect), and the
 * auth-only paths `/login` and `/2fa` (would otherwise loop or trap users).
 */

export function buildLoginRedirect(
  pathname: string,
  search: string,
  hash: string,
): string {
  const target = `${pathname}${search ?? ''}${hash ?? ''}`
  if (!target || target === '/') return '/login'
  return `/login?returnTo=${encodeURIComponent(target)}`
}

export function isSafeReturnTo(value: string | null | undefined): value is string {
  if (!value) return false
  if (typeof value !== 'string') return false
  // Must start with single slash, not protocol-relative, not absolute URL.
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.startsWith('/login') || value.startsWith('/2fa')) return false
  // Reject backslashes (some browsers treat them like `/`).
  if (value.includes('\\')) return false
  return true
}

export function getReturnToFromSearch(search: string): string | null {
  const params = new URLSearchParams(search)
  const raw = params.get('returnTo')
  if (!raw) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  return isSafeReturnTo(decoded) ? decoded : null
}
