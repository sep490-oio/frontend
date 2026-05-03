export type SellerAction =
  | 'edit'
  | 'submit'
  | 'setTiming'
  | 'viewDetail'
  | 'cancel'
  | 'configureShipping'
  | 'offerRunnerUp'
  | 'relist'
  | 'close'

interface GetSellerActionsParams {
  status: string
  verifyByPlatform?: boolean
  canOfferRunnerUp?: boolean
  itemStatus?: string
}

/**
 * Single source of truth for which seller actions are available per auction status.
 * Used by both MyAuctionsPage and AuctionDetailPage.
 */
export function getSellerActions({ status, canOfferRunnerUp, itemStatus }: GetSellerActionsParams): SellerAction[] {
  const s = status?.toLowerCase()
  const actions: SellerAction[] = []

  switch (s) {
    case 'draft':
      actions.push('edit', 'submit')
      break
    case 'approved':
      actions.push('setTiming', 'cancel')
      break
    case 'scheduled':
      actions.push('viewDetail', 'cancel')
      break
    case 'active':
      actions.push('viewDetail', 'cancel')
      break
    case 'sold':
      // No seller actions — the order is already paid/owned by the winner.
      // offerRunnerUp is ONLY valid in payment_defaulted (backend enforced).
      break
    case 'payment_defaulted':
      actions.push('relist', 'close')
      if (canOfferRunnerUp !== false) {
        actions.push('offerRunnerUp')
      }
      break;
    case 'failed':
      actions.push('relist')
      break
  }

  // Filter out relist if the item is already in another auction or sold
  if (actions.includes('relist') && itemStatus) {
    const is = itemStatus.toLowerCase()
    if (is === 'in_auction' || is === 'sold') {
      return actions.filter((a) => a !== 'relist')
    }
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
