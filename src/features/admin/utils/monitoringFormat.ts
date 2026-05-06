/**
 * Shared formatters for the admin Risk & Operations Monitoring page.
 * Lives in its own file so the same helpers can be used from the monitoring
 * table, the alert drawer, and any future export/CSV path.
 */

const TIMESPAN_RE = /^(\d+)\.(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/

/**
 * Format a .NET <see cref="System.TimeSpan"/> string into a human-readable
 * duration. Examples:
 *   "30.00:00:00"  -> "30 ngày"
 *   "90.00:00:00"  -> "90 ngày"
 *   "00:30:00"     -> "30 phút"
 *   "01:00:00"     -> "1 giờ"
 *   "00:01:30"     -> "1 phút 30 giây"
 * Returns the original string verbatim if it doesn't match the .NET shape, so
 * non-TimeSpan values (e.g. "Auto") pass through harmlessly.
 */
export function formatMonitoringDuration(value: string | null | undefined): string {
  if (!value) return '-'
  const v = String(value).trim()
  // Day-style: "30.00:00:00"
  const m = v.match(TIMESPAN_RE)
  if (m) {
    const days = Number(m[1])
    const hours = Number(m[2])
    const minutes = Number(m[3])
    const seconds = Number(m[4])
    if (days > 0 && hours === 0 && minutes === 0 && seconds === 0) return `${days} ngày`
    const parts: string[] = []
    if (days > 0) parts.push(`${days} ngày`)
    if (hours > 0) parts.push(`${hours} giờ`)
    if (minutes > 0) parts.push(`${minutes} phút`)
    if (seconds > 0) parts.push(`${seconds} giây`)
    return parts.length ? parts.join(' ') : '0 giây'
  }
  // Short style: "00:30:00" / "01:00:00"
  const short = v.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/)
  if (short) {
    const hours = Number(short[1])
    const minutes = Number(short[2])
    const seconds = Number(short[3])
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} giờ`)
    if (minutes > 0) parts.push(`${minutes} phút`)
    if (seconds > 0 && hours === 0) parts.push(`${seconds} giây`)
    return parts.length ? parts.join(' ') : '0 giây'
  }
  return v
}

/**
 * Compute a stable display label + short id + optional admin route for an
 * entity referenced from a monitoring alert. The route may be undefined for
 * entity types that don't yet have a detail page (e.g.
 * <c>SellerDirectShipment</c>) — callers should render a copy-only chip in
 * that case rather than a disabled-looking button.
 */
export function formatEntityLabel(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): { label: string; shortId: string; route?: string } {
  const type = (entityType ?? '').toString()
  const id = (entityId ?? '').toString()
  const shortId = id.length > 12 ? `${id.slice(0, 8)}…` : id
  const lower = type.toLowerCase()
  const routes: Partial<Record<string, (id: string) => string>> = {
    user: (i) => `/admin/users/${i}`,
    auction: (i) => `/admin/auctions/${i}`,
    order: (i) => `/admin/orders/${i}`,
    inbound_shipment: (i) => `/admin/warehouse/inbound/${i}`,
  }
  const fn = routes[lower]
  return {
    label: type || '-',
    shortId,
    route: fn && id ? fn(id) : undefined,
  }
}

/**
 * Cancellable bid statuses. Anything else (cancelled / settled / winning) is
 * locked from the admin "Cancel bid" action.
 */
export function isBidCancellable(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toString().toLowerCase()
  return s === 'active' || s === 'placed'
}
