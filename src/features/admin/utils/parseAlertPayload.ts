export interface ParsedPayload {
  summary: string
  details: Record<string, string>
}

export function parseAlertPayload(alertType: string, payloadJson: string): ParsedPayload {
  try {
    const data = JSON.parse(payloadJson)
    switch (true) {
      case alertType.includes('bid_burst'):
        return {
          summary: `${data.bidCount ?? '?'} bids${data.bidderId ? ` by ${shortId(data.bidderId)}` : ''}`,
          details: {
            'Bid ID': shortId(data.bidId),
            'Bid Count': String(data.bidCount ?? '-'),
            'Bidder': shortId(data.bidderId),
          },
        }
      case alertType.includes('collusion'):
        return {
          summary: `Collusion score: ${data.score ?? '?'}${data.window ? `, window: ${data.window}` : ''}`,
          details: {
            'Score': String(data.score ?? '-'),
            'Bid IDs': Array.isArray(data.bidIds) ? data.bidIds.map(shortId).join(', ') : shortId(data.bidIds),
            'Window': String(data.window ?? '-'),
          },
        }
      case alertType.includes('non_payment') || alertType.includes('payment_defaulted'):
        return {
          summary: `User ${shortId(data.userId)} — Order ${shortId(data.orderId)}`,
          details: {
            'User ID': shortId(data.userId),
            'Order ID': shortId(data.orderId),
            ...(data.winnerId ? { 'Winner ID': shortId(data.winnerId) } : {}),
          },
        }
      case alertType.includes('terminated'):
        return {
          summary: data.reason ? `Terminated: ${data.reason}` : 'Auction terminated',
          details: {
            'Auction ID': shortId(data.auctionId),
            'Reason': data.reason ?? '-',
          },
        }
      default: {
        const fallback = (data.message || data.reason || JSON.stringify(data).slice(0, 80)) as string
        return {
          summary: fallback,
          details: Object.fromEntries(
            Object.entries(data).slice(0, 6).map(([k, v]) => [k, String(v)])
          ) as Record<string, string>,
        }
      }
    }
  } catch {
    return { summary: payloadJson?.slice(0, 80) || '-', details: {} }
  }
}

function shortId(id: unknown): string {
  if (!id) return '-'
  const s = String(id)
  return s.length > 12 ? `${s.slice(0, 8)}...` : s
}

export function formatAlertType(alertType: string): string {
  return alertType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Auction Collusion ', 'Collusion: ')
    .replace('Repeated Non Payment', 'Repeated Non-Payment')
}
