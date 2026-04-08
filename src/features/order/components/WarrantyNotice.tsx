import { Alert } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

interface WarrantyNoticeProps {
  orderStatus: string
  deliveredAt?: string
  confirmedAt?: string
}

export function WarrantyNotice({ orderStatus, deliveredAt, confirmedAt }: WarrantyNoticeProps) {
  const { t } = useTranslation('order')

  // Only show for shipped/delivered/completed orders
  if (!['shipped', 'delivered', 'completed'].includes(orderStatus)) return null

  // Order completed (post-accept) → warranty active, no CTA.
  if (orderStatus === 'completed' || confirmedAt) {
    return (
      <Alert
        type="success"
        showIcon
        message={t('warrantyActive', 'Bảo hành đang hoạt động')}
        description={t('warrantyActiveDesc', 'After-sales support available for this order.')}
        style={{ marginBottom: 16 }}
      />
    )
  }

  // If delivered but not yet accepted, check 7-day deadline (read-only info).
  if (deliveredAt) {
    const deadline = dayjs(deliveredAt).add(7, 'day')
    const isExpired = dayjs().isAfter(deadline)

    if (isExpired) {
      return (
        <Alert
          type="warning"
          showIcon
          message={t('warrantyExpired', 'Warranty Not Available')}
          description={t('warrantyExpiredDesc', 'Delivery was not confirmed within 7 days. Warranty protection does not apply to this order.')}
          style={{ marginBottom: 16 }}
        />
      )
    }

    const daysLeft = deadline.diff(dayjs(), 'day')
    return (
      <Alert
        type="info"
        showIcon
        message={t('warrantyInfo', 'Warranty Policy')}
        description={t('warrantyPendingDescPassive', 'Warranty activates once delivery is accepted. {{days}} day(s) remaining.', { days: daysLeft })}
        style={{ marginBottom: 16 }}
      />
    )
  }

  // Shipped but not delivered yet — informational notice (read-only).
  return (
    <Alert
      type="info"
      showIcon
      message={t('warrantyInfo', 'Warranty Policy')}
      description={t('warrantyInfoDesc', 'Warranty activates after delivery is accepted by the buyer.')}
      style={{ marginBottom: 16 }}
    />
  )
}
