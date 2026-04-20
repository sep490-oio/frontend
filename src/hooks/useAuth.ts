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

    // Clear all auction qualification status from localStorage to prevent leaking between accounts
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('oio_qualified_')) {
        localStorage.removeItem(key)
      }
    })

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
