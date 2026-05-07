import { formatMonitoringDuration } from './monitoringFormat'

export type MonitoringEvidenceRefType = 'bid' | 'user' | 'auction' | 'order' | 'device' | 'ip'
export type MonitoringEvidenceGroup = 'participants' | 'evidence' | 'related'

export interface MonitoringEvidenceRef {
  type: MonitoringEvidenceRefType
  value: string
  label: string
  group: MonitoringEvidenceGroup
  description: string
}

export interface ParsedPayload {
  summary: string
  details: Record<string, string>
  score?: number
  windowLabel?: string
  evidenceRefs: MonitoringEvidenceRef[]
  recommendedNextStep: string
}

const EMPTY_DETAIL = 'Không có chi tiết bổ sung'

const RECOMMENDED_STEPS = {
  sameIp: 'Kiểm tra các bid từ cùng IP trong cửa sổ phát hiện, sau đó mở auction để xem lịch sử bid.',
  sameDevice: 'Kiểm tra bidder/seller có dùng cùng thiết bị và đối chiếu hành vi đấu giá.',
  repeatedPair: 'Kiểm tra tần suất seller/bidder xuất hiện cùng nhau và các auction liên quan.',
  nonPayment: 'Kiểm tra lịch sử không thanh toán của user và các order bị ảnh hưởng.',
  fallback: 'Xem entity liên quan và đối chiếu timeline trước khi acknowledge hoặc resolve.',
}

export function parseAlertPayload(alertType: string, payloadJson: string | null | undefined): ParsedPayload {
  const type = (alertType ?? '').toLowerCase()
  const fallbackStep = recommendedNextStepFor(type)
  const rawPayload = payloadJson?.trim() ?? ''

  if (!rawPayload || rawPayload === '{}') {
    return emptyParsed(fallbackStep)
  }

  try {
    const data = JSON.parse(rawPayload)

    if (data === null || typeof data !== 'object') {
      const summary = String(data).trim() || EMPTY_DETAIL
      return {
        summary: clip(summary, 120),
        details: summary === EMPTY_DETAIL ? {} : { Value: summary },
        evidenceRefs: [],
        recommendedNextStep: fallbackStep,
      }
    }

    const record = data as Record<string, unknown>
    if (isOnlyEmptyDetail(record)) return emptyParsed(fallbackStep)

    const evidenceRefs = extractEvidenceRefs(record)
    const score = pickNumber(record, ['score', 'riskScore', 'collusionScore'])
    const windowLabel = pickString(record, ['window', 'windowLabel', 'timeWindow'])
    const formattedWindow = windowLabel ? formatMonitoringDuration(windowLabel) : undefined

    if (type.includes('bid_burst')) {
      return {
        summary: `${record.bidCount ?? '?'} bid bất thường${record.bidderId ? ` từ bidder ${shortId(record.bidderId)}` : ''}`,
        details: compactDetails({
          'Số bid': record.bidCount,
          'Cửa sổ phát hiện': formattedWindow,
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    if (type.includes('collusion') || type.includes('same_ip') || type.includes('same_device')) {
      return {
        summary: collusionSummary(type, score, formattedWindow),
        details: compactDetails({
          'Điểm rủi ro': score,
          'Cửa sổ phát hiện': formattedWindow,
          'IP dùng chung': record.ip ?? record.ipAddress,
          'Thiết bị dùng chung': shortId(record.deviceId),
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    if (type.includes('repeated_pair')) {
      return {
        summary: `Cặp seller/bidder lặp lại bất thường${formattedWindow ? ` trong ${formattedWindow}` : ''}`,
        details: compactDetails({
          'Điểm rủi ro': score,
          'Cửa sổ phát hiện': formattedWindow,
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    if (type.includes('non_payment') || type.includes('payment_defaulted')) {
      return {
        summary: `User có lịch sử không thanh toán${record.orderId ? `, liên quan order ${shortId(record.orderId)}` : ''}`,
        details: compactDetails({
          'Điểm rủi ro': score,
          'Cửa sổ phát hiện': formattedWindow,
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    if (type.includes('terminated')) {
      return {
        summary: record.reason ? `Phiên đấu giá bị dừng: ${String(record.reason)}` : 'Phiên đấu giá bị dừng',
        details: compactDetails({
          'Lý do': record.reason,
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    if (type.includes('buyer_reported_damage')) {
      return {
        summary: record.condition ? `Buyer báo tình trạng hàng: ${String(record.condition)}` : 'Buyer báo hàng có vấn đề',
        details: compactDetails({
          'Nguồn': record.source,
          'Tình trạng': record.condition,
          'Ghi chú': record.notes,
        }),
        score,
        windowLabel: formattedWindow,
        evidenceRefs,
        recommendedNextStep: fallbackStep,
      }
    }

    return {
      summary: readableSummary(record),
      details: readableDetails(record),
      score,
      windowLabel: formattedWindow,
      evidenceRefs,
      recommendedNextStep: fallbackStep,
    }
  } catch {
    return {
      summary: clip(rawPayload, 120) || EMPTY_DETAIL,
      details: {},
      evidenceRefs: [],
      recommendedNextStep: fallbackStep,
    }
  }
}

function emptyParsed(recommendedNextStep: string): ParsedPayload {
  return {
    summary: EMPTY_DETAIL,
    details: {},
    evidenceRefs: [],
    recommendedNextStep,
  }
}

function isOnlyEmptyDetail(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data)
  if (keys.length !== 1) return false
  const key = keys[0]
  return (key === 'detail' || key === 'reason' || key === 'message') && !String(data[key] ?? '').trim()
}

function recommendedNextStepFor(type: string): string {
  if (type.includes('same_ip')) return RECOMMENDED_STEPS.sameIp
  if (type.includes('same_device')) return RECOMMENDED_STEPS.sameDevice
  if (type.includes('repeated_pair')) return RECOMMENDED_STEPS.repeatedPair
  if (type.includes('non_payment') || type.includes('payment_defaulted')) return RECOMMENDED_STEPS.nonPayment
  if (type.includes('collusion')) return RECOMMENDED_STEPS.sameIp
  return RECOMMENDED_STEPS.fallback
}

function collusionSummary(type: string, score?: number, windowLabel?: string): string {
  const scoreText = score === undefined ? '' : `, điểm rủi ro ${score}`
  const windowText = windowLabel ? ` trong ${windowLabel}` : ''
  if (type.includes('same_device')) {
    return `Seller và bidder dùng cùng thiết bị${windowText}${scoreText}`
  }
  if (type.includes('same_ip')) {
    return `Seller và bidder dùng cùng IP${windowText}${scoreText}`
  }
  return `Dấu hiệu thông đồng trong phiên đấu giá${windowText}${scoreText}`
}

function extractEvidenceRefs(data: Record<string, unknown>): MonitoringEvidenceRef[] {
  const refs: MonitoringEvidenceRef[] = []
  const seen = new Set<string>()

  const add = (
    type: MonitoringEvidenceRefType,
    value: unknown,
    labelPrefix: string,
    group: MonitoringEvidenceGroup,
    description: string,
    formatter: (value: string) => string = shortId,
  ) => {
    if (value === null || value === undefined || value === '') return
    const values = Array.isArray(value) ? value : [value]
    values.forEach((v) => {
      const str = String(v).trim()
      if (!str || str === '-') return
      const key = `${type}:${str}`
      if (seen.has(key)) return
      seen.add(key)
      refs.push({ type, value: str, label: `${labelPrefix}: ${formatter(str)}`, group, description })
    })
  }

  add('bid', data.bidId, 'Suspicious bid ID', 'evidence', 'Bid record used by the detection rule.')
  add('bid', data.bidIds, 'Suspicious bid ID', 'evidence', 'Bid record used by the detection rule.')
  add('user', data.userId, 'User ID', 'participants', 'User involved in this alert.')
  add('user', data.userIds, 'User ID', 'participants', 'User involved in this alert.')
  add('user', data.bidderId, 'Bidder user ID', 'participants', 'Bidder involved in this alert.')
  add('user', data.bidderIds, 'Bidder user ID', 'participants', 'Bidder involved in this alert.')
  add('user', data.buyerId, 'Buyer user ID', 'participants', 'Buyer involved in this alert.')
  add('user', data.sellerId, 'Seller user ID', 'participants', 'Seller involved in this alert.')
  add('user', data.winnerId, 'Winner user ID', 'participants', 'Winner involved in this alert.')
  add('auction', data.auctionId, 'Related auction ID', 'related', 'Auction connected to this alert.')
  add('auction', data.auctionIds, 'Related auction ID', 'related', 'Auction connected to this alert.')
  add('order', data.orderId, 'Related order ID', 'related', 'Order connected to this alert.')
  add('order', data.orderIds, 'Related order ID', 'related', 'Order connected to this alert.')
  add('device', data.deviceId, 'Device fingerprint', 'evidence', 'Device fingerprint used by the detection rule.')
  add('device', data.deviceIds, 'Device fingerprint', 'evidence', 'Device fingerprint used by the detection rule.')
  add('ip', data.ip ?? data.ipAddress, 'Shared IP', 'evidence', 'IP address used by the detection rule.', (value) => value)

  return refs
}

function pickNumber(data: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return undefined
}

function pickString(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function readableSummary(data: Record<string, unknown>): string {
  const fallback = data.message ?? data.reason ?? data.detail ?? data.summary
  if (typeof fallback === 'string' && fallback.trim()) return clip(fallback.trim(), 120)

  const parts = Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 3)
    .map(([key, value]) => `${humanizeKey(key)}: ${stringify(value)}`)

  return parts.length ? clip(parts.join(', '), 120) : EMPTY_DETAIL
}

function readableDetails(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 10)
      .map(([key, value]) => [humanizeKey(key), stringify(value)])
  )
}

function compactDetails(values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== '-')
      .map(([key, value]) => [key, stringify(value)])
  )
}

export function shortId(id: unknown): string {
  if (id === null || id === undefined || id === '') return '-'
  const s = String(id)
  return s.length > 12 ? `${s.slice(0, 8)}...` : s
}

function stringify(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((x) => (typeof x === 'string' ? shortId(x) : String(x)))
      .join(', ')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, 6)
      .map(([key, v]) => `${humanizeKey(key)}: ${Array.isArray(v) ? stringify(v) : String(v ?? '-')}`)
    return clip(entries.join(', '), 120)
  }
  return String(value)
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/g, 'ID')
    .replace(/\bIp\b/g, 'IP')
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value
}

export function formatAlertType(alertType: string): string {
  const type = (alertType ?? '').toLowerCase()
  if (type.includes('same_device')) return 'Seller and bidder used same device'
  if (type.includes('same_ip')) return 'Seller and bidder used same IP'
  if (type.includes('repeated_pair')) return 'Repeated seller/bidder pair'
  if (type.includes('non_payment') || type.includes('payment_defaulted')) return 'Repeated non-payment'
  if (type.includes('collusion')) return 'Possible auction collusion'

  return alertType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bIp\b/g, 'IP')
}
