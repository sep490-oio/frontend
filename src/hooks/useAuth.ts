import { useAppSelector, useAppDispatch, logout } from '@/app/store'
import { queryClient } from '@/lib/queryClient'
import { stopAllConnections } from '@/lib/signalr'
import { useLogout } from '@/features/auth/api'
import { STORAGE_KEYS } from '@/utils/constants'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, requires2FA, twoFactorUserName } = useAppSelector(
    (state) => state.auth,
  )
  const { mutateAsync: logoutApi } = useLogout()

  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) || undefined
        await logoutApi({ deviceId })
      }
    } catch (error) {
      console.error('Failed to call logout API', error)
    }

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
