import { useTranslation } from 'react-i18next'
import type { AssistantPageContext } from '../types'

export function useQuickPrompts(page: AssistantPageContext): string[] {
  const { t } = useTranslation()

  switch (page.entityType) {
    case 'auction':
      return [
        t('assistant:quickPrompts.auctionHowItWorks', 'Phiên này hoạt động thế nào?'),
        t('assistant:quickPrompts.autoBid', 'Auto-bid là gì?'),
        t('assistant:quickPrompts.sealedBid', 'Bid kín là gì?'),
      ]
    case 'order':
      return [
        t('assistant:quickPrompts.orderStatus', 'Đơn này đang ở bước nào?'),
        t('assistant:quickPrompts.orderPayout', 'Khi nào tôi được nhận tiền?'),
        t('assistant:quickPrompts.orderReturn', 'Tôi có thể trả hàng không?'),
      ]
    case 'dispute':
      return [
        t('assistant:quickPrompts.disputeEvidence', 'Tôi cần cung cấp bằng chứng gì?'),
        t('assistant:quickPrompts.disputeFlow', 'Quy trình tranh chấp diễn ra thế nào?'),
      ]
    case 'shipment':
      return [
        t('assistant:quickPrompts.shipmentStatus', 'Trạng thái giao hàng nghĩa là gì?'),
        t('assistant:quickPrompts.shipmentDelay', 'Hàng giao trễ thì sao?'),
      ]
    case 'wallet':
      return [
        t('assistant:quickPrompts.walletFlow', 'Dòng tiền này được tính như thế nào?'),
        t('assistant:quickPrompts.walletWithdraw', 'Làm sao để rút tiền?'),
      ]
    case 'item':
      return [
        t('assistant:quickPrompts.itemAuction', 'Khi nào item này được lên đấu giá?'),
      ]
    case 'verification':
      return [
        t('assistant:quickPrompts.verificationRequired', 'Tôi cần chuẩn bị gì để xác minh?'),
        t('assistant:quickPrompts.verificationTime', 'Bao lâu thì xác minh xong?'),
      ]
    default:
      return [
        t('assistant:quickPrompts.howOio', 'OIO hoạt động thế nào?'),
        t('assistant:quickPrompts.fees', 'Phí giao dịch là bao nhiêu?'),
        t('assistant:quickPrompts.escrow', 'Tiền của tôi được bảo vệ ra sao?'),
      ]
  }
}
