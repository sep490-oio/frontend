import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { buildLoginRedirect } from '@/utils/returnTo'

export function AuthGuard() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirect(location.pathname, location.search, location.hash)}
        replace
      />
    )
  }

  return <Outlet />
}
