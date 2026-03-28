import { formatCurrency } from '@/utils/format'
import type { MoneyDto } from '@/types/api'

interface PriceDisplayProps {
  /** Accept MoneyDto or a raw number for backwards compatibility */
  price?: MoneyDto | number
  /** @deprecated Use `price` prop instead. Kept for backwards compatibility. */
  amount?: number
  currency?: string
  size?: 'small' | 'default' | 'large'
  /** @deprecated Kept for backwards compatibility — ignored in Warm Ivory design. */
  type?: 'secondary' | 'success' | 'warning' | 'danger'
  /** @deprecated Kept for backwards compatibility — ignored in Warm Ivory design. */
  strong?: boolean
  pulse?: boolean
}

const FONT_SIZES: Record<string, number> = {
  small: 14,
  default: 20,
  large: 32,
}

export function PriceDisplay({
  price,
  amount,
  currency = 'VND',
  size = 'default',
  type: _type,
  strong: _strong,
  pulse = false,
}: PriceDisplayProps) {
  void _type
  void _strong
  let displayText: string

  if (price != null && typeof price === 'object') {
    // MoneyDto
    displayText = formatCurrency(price.amount ?? 0, price.currency ?? currency)
  } else {
    // raw number (backwards compat)
    const numericAmount = (typeof price === 'number' ? price : amount) ?? 0
    displayText = formatCurrency(numericAmount, currency)
  }

  return (
    <span
      className={`oio-price${pulse ? ' oio-price-pulse' : ''}`}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: FONT_SIZES[size],
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--color-accent)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {displayText}
    </span>
  )
}
