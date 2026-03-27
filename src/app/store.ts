import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { UserDto, AuthTokenDto } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

// ─── Auth Slice ────────────────────────────────────────────
interface AuthState {
  user: UserDto | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  requires2FA: boolean
  twoFactorUserName: string | null
}

// Clean up corrupted token values (e.g., literal "undefined" string from previous bugs)
function getValidToken(key: string): string | null {
  const value = localStorage.getItem(key)
  if (!value || value === 'undefined' || value === 'null') {
    localStorage.removeItem(key)
    return null
  }
  return value
}

const storedAccessToken = getValidToken(STORAGE_KEYS.ACCESS_TOKEN)
const storedRefreshToken = getValidToken(STORAGE_KEYS.REFRESH_TOKEN)

const initialState: AuthState = {
  user: null,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedAccessToken,
  requires2FA: false,
  twoFactorUserName: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthTokenDto>) {
      const { accessToken, refreshToken } = action.payload
      if (!accessToken) {
        return
      }
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.isAuthenticated = true
      state.requires2FA = false
      state.twoFactorUserName = null
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      }
    },
    setUser(state, action: PayloadAction<UserDto>) {
      state.user = action.payload
    },
    set2FARequired(state, action: PayloadAction<{ userName: string; tempAccessToken: string }>) {
      state.requires2FA = true
      state.twoFactorUserName = action.payload.userName
      // Store temp 2FA token separately — do NOT set isAuthenticated
      // This token is only for the 2FA verify endpoint, not for general API access
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.setItem(STORAGE_KEYS.TWO_FA_TOKEN, action.payload.tempAccessToken)
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.requires2FA = false
      state.twoFactorUserName = null
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.TWO_FA_TOKEN)
    },
  },
})

export const { setCredentials, setUser, set2FARequired, logout } = authSlice.actions

// ─── Store ─────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
