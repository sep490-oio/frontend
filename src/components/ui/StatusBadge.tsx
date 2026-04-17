import { useTranslation } from 'react-i18next'

interface StatusBadgeStyle {
  bg: string
  color: string
  border?: string
}

// ── Semantic Variants ──

type BadgeVariant = 
  | 'solid-success' | 'solid-danger' | 'solid-accent' | 'solid-info' | 'solid-warning' | 'solid-purple' | 'solid-neutral'
  | 'soft-success' | 'soft-danger' | 'soft-warning' | 'soft-info' | 'soft-purple'
  | 'outline-success' | 'outline-info' | 'outline-warning' | 'outline-neutral' | 'outline-danger'
  | 'neutral'

const VARIANT_STYLES: Record<BadgeVariant, StatusBadgeStyle> = {
  // Solid (high emphasis)
  'solid-success': { bg: 'var(--color-success)', color: '#fff', border: 'var(--color-success)' },
  'solid-danger': { bg: 'var(--color-danger)', color: '#fff', border: 'var(--color-danger)' },
  'solid-accent': { bg: 'var(--color-accent)', color: '#fff', border: 'var(--color-accent)' },
  'solid-info': { bg: '#1677ff', color: '#fff', border: '#1677ff' },
  'solid-warning': { bg: '#f59e0b', color: '#fff', border: '#f59e0b' },
  'solid-purple': { bg: '#8A2BE2', color: '#fff', border: '#8A2BE2' },
  'solid-neutral': { bg: '#4b5563', color: '#fff', border: '#4b5563' },
  
  // Soft (medium emphasis, translucent bg with border)
  'soft-success': { bg: 'rgba(74,124,89,0.15)', color: 'var(--color-success)', border: 'rgba(74,124,89,0.3)' },
  'soft-danger': { bg: 'rgba(196,81,61,0.12)', color: 'var(--color-danger)', border: 'rgba(196,81,61,0.3)' },
  'soft-warning': { bg: 'rgba(196,146,61,0.15)', color: 'var(--color-accent)', border: 'rgba(196,146,61,0.3)' },
  'soft-info': { bg: 'rgba(22,119,255,0.15)', color: '#1677ff', border: 'rgba(22,119,255,0.3)' },
  'soft-purple': { bg: 'rgba(138,43,226,0.15)', color: '#8A2BE2', border: 'rgba(138,43,226,0.3)' },

  // Outline (condition tags - transparent bg)
  'outline-success': { bg: 'transparent', color: 'var(--color-success)', border: 'var(--color-success)' },
  'outline-info': { bg: 'transparent', color: '#1677ff', border: '#1677ff' },
  'outline-warning': { bg: 'transparent', color: 'var(--color-accent)', border: 'var(--color-accent)' },
  'outline-neutral': { bg: 'transparent', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  'outline-danger': { bg: 'transparent', color: 'var(--color-danger)', border: 'var(--color-danger)' },

  // Neutral (low emphasis)
  'neutral': { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
}

// ── Mapping ──

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Auction/Item active states
  active: 'solid-success',
  live: 'solid-danger',

  // Scheduled/upcoming
  scheduled: 'soft-warning',
  upcoming: 'soft-warning',

  // Success states
  sold: 'solid-success',
  completed: 'solid-success',
  verified: 'solid-success',
  approved: 'soft-success',

  // Pending/review states
  draft: 'neutral',
  pending: 'soft-warning',
  pending_review: 'soft-warning',
  pending_verify: 'soft-warning',
  pending_condition_confirmation: 'soft-warning',
  submitted: 'soft-warning',
  under_review: 'soft-warning',

  // Warning states
  payment_defaulted: 'soft-danger',
  in_auction: 'soft-info',

  // Error states
  ended: 'neutral',
  failed: 'soft-danger',
  cancelled: 'soft-danger',
  rejected: 'soft-danger',
  terminated: 'soft-danger',
  removed: 'soft-danger',
  suspended: 'soft-danger',
  banned: 'solid-danger',

  // Processing/transitional
  processing: 'soft-info',
  inactive: 'neutral',
  locked: 'neutral',

  // Escrow states
  holding: 'soft-warning',
  released_to_seller: 'soft-success',
  refunded_to_buyer: 'soft-info',

  // Wallet transaction types
  hold: 'soft-warning',
  release: 'soft-success',
  credit: 'soft-success',
  debit: 'soft-danger',
  refunded: 'soft-info',

  // Report states
  action_taken: 'soft-success',
  dismissed: 'neutral',

  // Alert states
  open: 'soft-warning',
  ignored: 'neutral',

  // Order return states
  return_in_transit: 'soft-info',
  seller_received: 'soft-success',
  buyer_followup: 'soft-warning',
  resolved: 'soft-success',

  // SealedBid states
  invalidated: 'soft-danger',
  withdrawn: 'neutral',

  // Qualification states
  qualified: 'soft-success',
  waived: 'soft-success',
  expired: 'neutral',

  // Deposit states
  held: 'soft-warning',
  returned: 'soft-success',
  forfeited: 'soft-danger',
  converted_to_payment: 'soft-info',

  // Winner offer states
  accepted: 'soft-success',
  declined: 'soft-danger',

  // Special
  auto: 'solid-info',
  regular: 'solid-info',
  sealed: 'solid-purple',

  // Item Conditions (Solid style to match Active)
  new: 'solid-success',
  like_new: 'solid-info',
  very_good: 'solid-warning',
  good: 'solid-neutral',
  acceptable: 'solid-danger',
}

const CHECK_ICON = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ marginRight: 3, verticalAlign: '-1px' }}
  >
    <path
      d="M8.5 2.5L3.75 7.5L1.5 5.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CIRCLE_ICON = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ marginRight: 3, verticalAlign: '-1px' }}
  >
    <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const TRIANGLE_ICON = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ marginRight: 3, verticalAlign: '-1px' }}
  >
    <path
      d="M5 1.5L9 8.5H1L5 1.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const X_ICON = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ marginRight: 3, verticalAlign: '-1px' }}
  >
    <path
      d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SUCCESS_STATUSES = new Set(['sold', 'completed', 'verified', 'approved', 'active'])
const PENDING_STATUSES = new Set(['pending', 'processing', 'under_review', 'submitted', 'draft', 'scheduled'])
const WARNING_STATUSES = new Set(['payment_defaulted', 'holding', 'hold'])
const ERROR_STATUSES = new Set(['failed', 'cancelled', 'rejected', 'terminated', 'removed', 'suspended', 'banned', 'invalidated'])

function getStatusIcon(status: string): React.ReactNode | null {
  if (SUCCESS_STATUSES.has(status)) return CHECK_ICON
  if (PENDING_STATUSES.has(status)) return CIRCLE_ICON
  if (WARNING_STATUSES.has(status)) return TRIANGLE_ICON
  if (ERROR_STATUSES.has(status)) return X_ICON
  return null
}

interface StatusBadgeProps {
  status: string
  size?: 'small' | 'default'
}

export function StatusBadge({ status, size }: StatusBadgeProps) {
  const { t } = useTranslation('common')
  if (!status) return null
  const normalized = status.toLowerCase()
  const variant = STATUS_VARIANT_MAP[normalized] ?? 'neutral'
  const style = VARIANT_STYLES[variant]

  const label = t(
    `statusLabel.${normalized}`,
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  )

  const isSmall = size === 'small'
  const fontSize = isSmall ? 10 : 11
  const padding = isSmall ? '1px 8px' : '2px 10px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 100,
        padding,
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border || 'transparent'}`,
        boxSizing: 'border-box',
      }}
    >
      {getStatusIcon(normalized)}
      {label}
    </span>
  )
}
