import { Alert, Button, Space } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePendingTerms } from '../api'

export function TermsAcceptanceBanner() {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { data, isLoading } = usePendingTerms('platform')

  if (isLoading || !data?.hasPending) return null

  return (
    <Alert
      type="warning"
      showIcon
      icon={<FileProtectOutlined />}
      banner
      message={
        <Space>
          <span>
            {t('platformTermsBanner', 'Please review the latest Platform Terms to continue using OIO.')}
          </span>
          <Button
            type="link"
            size="small"
            onClick={() => navigate('/me/terms?type=platform')}
            style={{ padding: 0 }}
          >
            {t('reviewTerms', 'Review & Accept')}
          </Button>
        </Space>
      }
    />
  )
}
