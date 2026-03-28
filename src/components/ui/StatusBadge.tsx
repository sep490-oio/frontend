import { useTranslation } from 'react-i18next'

interface StatusBadgeStyle {
  bg: string
  color: string
  border?: string
}

const STATUS_STYLES: Record<string, StatusBadgeStyle> = {
  // Auction/Item active states
  active: { bg: 'var(--color-success)', color: '#fff' },
  live: { bg: 'var(--color-danger)', color: '#fff' },

  // Scheduled/upcoming
  scheduled: { bg: 'transparent', color: 'var(--color-accent)', border: 'var(--color-accent)' },
  upcoming: { bg: 'transparent', color: 'var(--color-accent)', border: 'var(--color-accent)' },

  // Success states
  sold: { bg: 'var(--color-success)', color: '#fff' },
  completed: { bg: 'var(--color-success)', color: '#fff' },
  verified: { bg: 'var(--color-success)', color: '#fff' },
  approved: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },

  // Pending/review states
  draft: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  pending: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },
  pending_review: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },
  pending_verify: { bg: 'rgba(139,115,85,0.15)', color: 'var(--color-accent)' },
  pending_condition_confirmation: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  submitted: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },
  under_review: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },

  // Warning states
  payment_defaulted: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  in_auction: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },

  // Error states
  ended: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },
  failed: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  cancelled: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  rejected: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  terminated: { bg: 'rgba(196,81,61,0.12)', color: 'var(--color-danger)' },
  removed: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  suspended: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  banned: { bg: 'rgba(196,81,61,0.12)', color: 'var(--color-danger)' },

  // Processing/transitional
  processing: { bg: 'rgba(22,119,255,0.08)', color: '#1677ff' },
  inactive: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  locked: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },

  // Escrow states (match BE values)
  holding: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  released_to_seller: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  refunded_to_buyer: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },

  // Wallet transaction types
  hold: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  release: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  credit: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  debit: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  refunded: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },

  // Report states (match BE values)
  action_taken: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  dismissed: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },

  // Alert states (match BE AlertStatus)
  open: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  ignored: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },

  // Order return states (match BE OrderReturnStatus)
  return_in_transit: { bg: 'rgba(22,119,255,0.08)', color: '#1677ff' },
  seller_received: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  buyer_followup: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },
  resolved: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },

  // SealedBid states (match BE values)
  invalidated: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  withdrawn: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },

  // Qualification states
  qualified: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  waived: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  expired: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },

  // Deposit states
  held: { bg: 'rgba(196,146,61,0.1)', color: '#C4923D' },
  returned: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  forfeited: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },
  converted_to_payment: { bg: 'rgba(22,119,255,0.1)', color: '#1677ff' },

  // Winner offer states
  accepted: { bg: 'rgba(74,124,89,0.1)', color: 'var(--color-success)' },
  declined: { bg: 'rgba(196,81,61,0.08)', color: 'var(--color-danger)' },

  // Special
  auto: { bg: 'rgba(22,119,255,0.08)', color: '#1677ff' },
  regular: { bg: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' },
  sealed: { bg: 'rgba(139,115,85,0.1)', color: 'var(--color-accent)' },
}

const DEFAULT_STYLE: StatusBadgeStyle = {
  bg: 'var(--color-bg-surface)',
  color: 'var(--color-text-secondary)',
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
  const style = STATUS_STYLES[normalized] ?? DEFAULT_STYLE

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
        borderRadius: 100,
        padding,
        fontFamily: "'Inter', sans-serif",
        fontSize,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        background: style.bg,
        color: style.color,
        border: style.border ? `1px solid ${style.border}` : 'none',
      }}
    >
      {getStatusIcon(normalized)}
      {label}
    </span>
  )
}
