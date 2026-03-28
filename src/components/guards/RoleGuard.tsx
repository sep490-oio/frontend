import { Navigate, Outlet } from 'react-router'
import { Spin, Flex, Result } from 'antd'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/features/user/api'
import { STORAGE_KEYS } from '@/utils/constants'

interface RoleGuardProps {
  roles: string[]
}

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

export function RoleGuard({ roles }: RoleGuardProps) {
  const { isAuthenticated } = useAuth()
  const { isLoading } = useCurrentUser()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  // Check roles from JWT token claims
  const userRoles = parseRolesFromToken()
  const hasRequiredRole = roles.some((r) =>
    userRoles.some((ur) => ur.toLowerCase() === r.toLowerCase()),
  )

  if (!hasRequiredRole) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này."
        extra={<a href="/">Về trang chủ</a>}
      />
    )
  }

  return <Outlet />
}
