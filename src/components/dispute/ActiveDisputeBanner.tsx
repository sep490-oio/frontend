import { Alert, Button, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface ActiveDisputeBannerProps {
  disputeId?: string
  disputeNumber?: string
  disputeStatus?: string
  show: boolean
  context?: string
}

export function ActiveDisputeBanner({
  disputeId,
  disputeNumber,
  disputeStatus,
  show,
  context,
}: ActiveDisputeBannerProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  if (!show) return null

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={t(
        'dispute.activeBanner.message',
        'An active dispute is open for this {{context}}.',
        { context: context ?? 'order' },
      )}
      description={
        <Space direction="vertical" size={4}>
          {disputeNumber && (
            <span>
              {t('dispute.activeBanner.number', 'Dispute')}: <strong>{disputeNumber}</strong>
              {disputeStatus && (
                <>
                  {' '}&mdash; <StatusBadge status={disputeStatus} />
                </>
              )}
            </span>
          )}
          {disputeId && (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/me/disputes/${disputeId}`)}
            >
              {t('dispute.activeBanner.view', 'View dispute')}
            </Button>
          )}
        </Space>
      }
    />
  )
}
