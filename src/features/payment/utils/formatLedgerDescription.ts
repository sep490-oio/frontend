/**
 * Formats a raw canonical ledger description into a human-friendly string.
 *
 * The backend standardizes Transaction/WalletTransaction `description` to:
 *   "[Tag] Summary - Key: Value - Key: Value"
 * This strips the bracket tag and drops technical key/value segments while
 * keeping the human summary and human-readable detail segments.
 *
 * Examples:
 *   "[OrderPayment] Order payment - OrderId: 0a1b"                     -> "Order payment"
 *   "[Refund] Escrow refund - Order: ORD-7 - Reason: dispute"         -> "Escrow refund - Order: ORD-7 - Reason: dispute"
 *   "[Withdrawal] Withdrawal hold - Amount: 500,000"                  -> "Withdrawal hold - Amount: 500,000"
 *   "[Fee] Inspection fee for rejected item \"Foo\" (inspection 9f3)." -> "Inspection fee for rejected item \"Foo\" (inspection 9f3)."
 *   undefined                                                         -> ""
 */

// Technical keys whose `Key: Value` segments are noise for end users.
const TECHNICAL_KEYS = new Set([
  'OrderId',
  'AuctionId',
  'ReservationId',
  'Escrow',
  'TxnRef',
  'WalletPortion',
])

export function formatLedgerDescription(raw?: string | null): string {
  if (!raw) return ''

  // Strip a leading bracket tag, e.g. "[OrderPayment] ".
  const withoutTag = raw.replace(/^\[[^\]]+\]\s*/, '')

  const segments = withoutTag.split(' - ')
  // First segment is the human summary — always keep it.
  const [summary, ...rest] = segments

  const keptDetails = rest.filter((segment) => {
    const separatorIndex = segment.indexOf(':')
    if (separatorIndex === -1) return true // not a Key: Value pair — keep
    const key = segment.slice(0, separatorIndex).trim()
    return !TECHNICAL_KEYS.has(key)
  })

  return [summary, ...keptDetails].join(' - ').trim()
}

export default formatLedgerDescription
