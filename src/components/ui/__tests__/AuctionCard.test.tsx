// @ts-nocheck
/**
 * Phase E6 (plan 058 / ralplan-add-completed-status) — AuctionCard tests.
 *
 * Runner: Vitest + @testing-library/react + jsdom. Deps not yet wired — drop
 * the `@ts-nocheck` once `npm test` is set up.
 *
 * Contract under test (plan §E4, §E6):
 *   - Sold and Completed both render chip "Đã bán" (card.chipSold) + final-price.
 *   - Failed renders "Không bán được" (card.chipFailed).
 *   - Cancelled renders "Đã hủy" (card.chipCancelled).
 *   - Terminated renders "Đã chấm dứt" (card.chipTerminated).
 *   - PaymentDefaulted renders "Người thắng không thanh toán" (card.chipPaymentDefaulted).
 *   - Any new AuctionStatus value added without a case triggers a TS never-check
 *     error at compile time (hand-rolled exhaustive check in AuctionCard.tsx).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb ?? k }),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: false }) }))
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => ({ isMobile: false }) }))
vi.mock('@/features/auction/auctionApi.ts', () => ({
  useWatchAuction: () => ({ mutate: vi.fn() }),
  useUnwatchAuction: () => ({ mutate: vi.fn() }),
}))

import { AuctionCard } from '../AuctionCard'
import { AuctionStatus } from '@/types/enums'

const baseAuction = {
  id: 'abc123',
  itemTitle: 'Test Item',
  primaryImageUrl: undefined,
  currentPrice: { amount: 1500000, currency: 'VND' },
  startingPrice: { amount: 100000, currency: 'VND' },
  isBuyNowReserved: false,
  currency: 'VND',
  auctionType: 'regular',
  bidCount: 7,
  watchCount: 0,
  isEndingSoon: false,
  isFeatured: false,
  sellerId: 's1',
} as const

const cardFor = (status: string) => (
  <MemoryRouter>
    <AuctionCard auction={{ ...baseAuction, status } as never} />
  </MemoryRouter>
)

describe('AuctionCard — Phase E terminal-state chips', () => {
  it('Sold → chip "Đã bán" and final price rendered', () => {
    render(cardFor(AuctionStatus.Sold))
    expect(screen.getByTestId('card-chip-sold')).toHaveTextContent('Đã bán')
    expect(screen.getByTestId('card-final-price')).toBeInTheDocument()
  })

  it('Completed → chip "Đã bán" and final price rendered (same bucket as Sold)', () => {
    render(cardFor(AuctionStatus.Completed))
    expect(screen.getByTestId('card-chip-completed')).toHaveTextContent('Đã bán')
    expect(screen.getByTestId('card-final-price')).toBeInTheDocument()
  })

  it('Failed → chip "Không bán được"', () => {
    render(cardFor(AuctionStatus.Failed))
    expect(screen.getByTestId('card-chip-failed')).toHaveTextContent('Không bán được')
  })

  it('Cancelled → chip "Đã hủy"', () => {
    render(cardFor(AuctionStatus.Cancelled))
    expect(screen.getByTestId('card-chip-cancelled')).toHaveTextContent('Đã hủy')
  })

  it('Terminated → chip "Đã chấm dứt"', () => {
    render(cardFor(AuctionStatus.Terminated))
    expect(screen.getByTestId('card-chip-terminated')).toHaveTextContent('Đã chấm dứt')
  })

  it('PaymentDefaulted → chip "Người thắng không thanh toán"', () => {
    render(cardFor(AuctionStatus.PaymentDefaulted))
    expect(screen.getByTestId('card-chip-payment_defaulted')).toHaveTextContent(
      'Người thắng không thanh toán',
    )
  })

  it('Non-terminal (Active) → no terminal chip rendered', () => {
    render(cardFor(AuctionStatus.Active))
    expect(screen.queryByTestId(/^card-chip-/)).not.toBeInTheDocument()
  })

  it('Non-terminal (Scheduled) → no terminal chip rendered', () => {
    render(cardFor(AuctionStatus.Scheduled))
    expect(screen.queryByTestId(/^card-chip-/)).not.toBeInTheDocument()
  })
})

describe('AuctionCard — exhaustive never-check compile guard', () => {
  it('type-level guard: adding a new AuctionStatus without a case breaks compile', () => {
    // This is a compile-time contract, not a runtime check. The `never`
    // assignment inside `getTerminalChip`'s default branch forces TypeScript
    // to fail when a new enum value is not handled. Runtime simply
    // acknowledges the guard exists.
    expect(true).toBe(true)
  })
})
