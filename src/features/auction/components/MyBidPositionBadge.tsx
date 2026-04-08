import { SANS_FONT } from '@/styles/tokens'

export type MyBidPosition = 'leading' | 'outbid' | 'won' | 'lost' | 'none'

interface MyBidPositionBadgeProps {
  position: MyBidPosition
  label: string
}

/**
 * Opaque status chip overlaid on auction card images in /me/bids.
 *
 * Uses solid theme-token backgrounds so contrast is preserved on any
 * image — no translucent backgrounds, no blur hacks. Text is white and
 * the chip carries a subtle drop shadow to separate it from the photo.
 *
 * Palette:
 *   won      → accent gold (#B8860B) — winner color
 *   leading  → var(--color-success)  — active leading bid
 *   outbid   → var(--color-danger)   — user was outbid
 *   lost     → var(--color-text-secondary) — auction ended, user did not win
 */
export function MyBidPositionBadge({ position, label }: MyBidPositionBadgeProps) {
  let background: string
  switch (position) {
    case 'won':
      background = '#B8860B'
      break
    case 'leading':
      background = 'var(--color-success)'
      break
    case 'outbid':
      background = 'var(--color-danger)'
      break
    case 'lost':
    default:
      background = 'var(--color-text-secondary)'
      break
  }

  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        padding: '5px 12px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: SANS_FONT,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background,
        color: '#ffffff',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        zIndex: 2,
      }}
    >
      {label}
    </span>
  )
}

export default MyBidPositionBadge
