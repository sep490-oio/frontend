import { useAppSelector, useAppDispatch, logout } from '@/app/store'
import { queryClient } from '@/lib/queryClient'
import { stopAllConnections } from '@/lib/signalr'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, requires2FA, twoFactorUserName } = useAppSelector(
    (state) => state.auth,
  )

  const handleLogout = async () => {
    dispatch(logout())
    queryClient.clear()
    await stopAllConnections()
  }

  return {
    user,
    isAuthenticated,
    requires2FA,
    twoFactorUserName,
    logout: handleLogout,
  }
}
