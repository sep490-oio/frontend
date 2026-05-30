import { HistoryOutlined } from '@ant-design/icons'

import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { OrderItemSummaryDto } from '@/types'
import { formatCurrency } from '@/utils/format'
import { SANS_FONT, SERIF_FONT } from '@/styles/tokens'

interface OrderItemSummaryProps {
  item: OrderItemSummaryDto
  /** Visual variant: "card" renders a full card; "row" is compact for list rows. */
  variant?: 'card' | 'row'
  /** When true, clicking the title/image navigates to the source auction page. */
  linkToAuction?: boolean
}

/**
 * Single source of truth for rendering an order's attached product summary
 * across checkout, my-orders list, and order detail. Reads only from the
 * OrderDto.item field so all three screens stay in sync.
 *
 * Renders a grey placeholder with HistoryOutlined when the primary image
 * URL is null or fails to load.
 */
export function OrderItemSummary({ item, variant = 'card', linkToAuction = false }: OrderItemSummaryProps) {
  const { t } = useTranslation(['payment', 'auction'])

  const thumbnailSize = variant === 'row' ? 72 : 120

  const thumbnail = (
    <div
      style={{
        position: 'relative',
        width: thumbnailSize,
        height: thumbnailSize,
        flexShrink: 0,
        background: 'var(--color-bg-surface)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--color-border-light)',
      }}
    >
      <HistoryOutlined style={{ position: 'absolute', fontSize: 28, opacity: 0.35 }} />
      {item.primaryImageUrl && (
        <img
          src={item.primaryImageUrl}
          alt={item.itemTitle}
          loading="lazy"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  )

  const titleNode = (
    <div
      style={{
        color: 'var(--color-text-primary)',
        fontFamily: SERIF_FONT,
        fontWeight: 600,
        fontSize: variant === 'row' ? 14 : 16,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: 1.4,
        wordBreak: 'break-word',
        marginBottom: 2,
      }}
    >
      {linkToAuction ? (
        <Link
          to={`/auctions/${item.auctionId}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {item.itemTitle}
        </Link>
      ) : (
        item.itemTitle
      )}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        gap: variant === 'row' ? 12 : 16,
        alignItems: 'flex-start',
        fontFamily: SANS_FONT,
      }}
    >
      {thumbnail}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {titleNode}
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {t('startingPrice', { defaultValue: 'Starting price', ns: 'auction' })}:{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(item.startingPrice, item.currency)}
          </span>
        </div>
        <div style={{ fontSize: variant === 'row' ? 14 : 16, fontWeight: 600, color: 'var(--color-accent)' }}>
          {t('finalPrice', { defaultValue: 'Final price', ns: 'payment' })}:{' '}
          {formatCurrency(item.finalPrice, item.currency)}
        </div>
      </div>
    </div>
  )
}

export default OrderItemSummary
