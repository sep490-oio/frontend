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

  // If delivery confirmed → warranty active
  if (confirmedAt) {
    return (
      <Alert
        type="success"
        showIcon
        message={t('warrantyActive', 'Warranty Active')}
        description={t('warrantyActiveDesc', 'Your warranty is active. Coverage period starts from your delivery confirmation date.')}
        style={{ marginBottom: 16 }}
      />
    )
  }

  // If delivered but not confirmed, check 7-day deadline
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
        message={t('warrantyPending', 'Confirm Delivery for Warranty')}
        description={t('warrantyPendingDesc', 'Confirm delivery to activate your warranty. You have {{days}} day(s) remaining.', { days: daysLeft })}
        style={{ marginBottom: 16 }}
      />
    )
  }

  // Shipped but not delivered yet — informational notice
  return (
    <Alert
      type="info"
      showIcon
      message={t('warrantyInfo', 'Warranty Policy')}
      description={t('warrantyInfoDesc', 'Once your order is delivered, confirm receipt within 7 days to activate warranty protection.')}
      style={{ marginBottom: 16 }}
    />
  )
}
