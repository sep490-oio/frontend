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
      {normalized === 'verified' && CHECK_ICON}
      {label}
    </span>
  )
}
