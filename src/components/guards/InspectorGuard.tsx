import { Navigate, Outlet, useLocation } from 'react-router'
import { Spin, Flex, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/features/user/api'
import { STORAGE_KEYS } from '@/utils/constants'
import { buildLoginRedirect } from '@/utils/returnTo'

function parseRolesFromToken(): string[] {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) return []
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles = payload.role ?? payload.roles ?? []
    return Array.isArray(roles) ? roles : [roles]
  } catch {
    return []
  }
}

const INSPECTOR_ROLES = ['inspector', 'warehousemanager']

export function InspectorGuard() {
  const { t } = useTranslation('common')
  const { isAuthenticated } = useAuth()
  const { isLoading } = useCurrentUser()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirect(location.pathname, location.search, location.hash)}
        replace
      />
    )
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  const userRoles = parseRolesFromToken()
  const hasInspectorRole = INSPECTOR_ROLES.some((r) =>
    userRoles.some((ur) => ur.toLowerCase() === r),
  )

  if (!hasInspectorRole) {
    return (
      <Result
        status="403"
        title="403"
        subTitle={t('guard.noAccess')}
        extra={<a href="/">{t('guard.backToHome')}</a>}
      />
    )
  }

  return <Outlet />
}
