export type SellerAction =
  | 'edit'
  | 'submit'
  | 'setTiming'
  | 'publish'
  | 'cancel'
  | 'configureShipping'
  | 'offerRunnerUp'
  | 'relist'

interface GetSellerActionsParams {
  status: string
  verifyByPlatform?: boolean
}

/**
 * Single source of truth for which seller actions are available per auction status.
 * Used by both MyAuctionsPage and AuctionDetailPage.
 */
export function getSellerActions({ status, verifyByPlatform }: GetSellerActionsParams): SellerAction[] {
  const s = status?.toLowerCase()
  const actions: SellerAction[] = []

  switch (s) {
    case 'draft':
    case 'pending':
      actions.push('edit', 'submit', 'cancel')
      if (verifyByPlatform) actions.push('configureShipping')
      break
    case 'approved':
      actions.push('setTiming', 'cancel')
      break
    case 'scheduled':
      actions.push('publish', 'cancel')
      break
    case 'active':
      actions.push('cancel')
      break
    case 'sold':
      actions.push('offerRunnerUp')
      break
    case 'paymentdefaulted':
      actions.push('relist', 'offerRunnerUp')
      break
    case 'failed':
      actions.push('relist')
      break
  }

  return actions
}

/**
 * Check if submit should be disabled (item not yet approved)
 */
export function isSubmitDisabled(itemStatus?: string): boolean {
  if (!itemStatus) return true
  const s = itemStatus.toLowerCase()
  return s !== 'approved' && s !== 'active'
}
