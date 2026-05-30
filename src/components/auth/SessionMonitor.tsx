import { useEffect, useState } from 'react'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/store'

export function SessionMonitor() {
  const { modal } = App.useApp()
  const { t } = useTranslation('auth')
  const session = useAppSelector((state) => state.auth.session)
  const [hasWarned, setHasWarned] = useState(false)

  useEffect(() => {
    if (session?.isNearingAbsoluteExpiration && !hasWarned) {
      modal.warning({
        title: t('session.warningTitle', 'Session Expiring Soon'),
        content: t(
          'session.warningDesc',
          'Your session is nearing its maximum allowed duration for security reasons. You may be asked to log in again soon.'
        ),
        okText: t('common.understood', 'Understood'),
      })
      setHasWarned(true)
    }
  }, [session?.isNearingAbsoluteExpiration, hasWarned, modal, t])

  // Reset the warning if a new session starts or the expiration status is cleared
  useEffect(() => {
    if (!session?.isNearingAbsoluteExpiration) {
      setHasWarned(false)
    }
  }, [session?.isNearingAbsoluteExpiration])

  return null
}
