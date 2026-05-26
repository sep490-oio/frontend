import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { UserDto, AuthTokenDto, UserSessionDto } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

// ─── Auth Slice ────────────────────────────────────────────
interface AuthState {
  user: UserDto | null
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: string | null
  session: UserSessionDto | null
  isAuthenticated: boolean
  requires2FA: boolean
  twoFactorUserName: string | null
}

interface SystemState {
  clockOffset: number
}

function getValidToken(key: string): string | null {
  let value = localStorage.getItem(key)
  if (!value) return null
  
  value = value.replace(/^["']|["']$/g, '').trim()
  if (value === 'undefined' || value === 'null' || value === '') {
    localStorage.removeItem(key)
    return null
  }
  return value
}

const storedAccessToken = getValidToken(STORAGE_KEYS.ACCESS_TOKEN)
const storedRefreshToken = getValidToken(STORAGE_KEYS.REFRESH_TOKEN)
const storedAccessTokenExpiresAt = getValidToken(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
const storedSessionStr = getValidToken(STORAGE_KEYS.SESSION)
let storedSession: UserSessionDto | null = null
try {
  if (storedSessionStr) storedSession = JSON.parse(storedSessionStr)
} catch {}

const initialState: AuthState = {
  user: null,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  accessTokenExpiresAt: storedAccessTokenExpiresAt,
  session: storedSession,
  isAuthenticated: !!storedAccessToken,
  requires2FA: false,
  twoFactorUserName: null,
}

const initialSystemState: SystemState = {
  clockOffset: 0,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthTokenDto>) {
      const { accessToken, refreshToken, accessTokenExpiresAt, session } = action.payload
      if (!accessToken) {
        return
      }
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.accessTokenExpiresAt = accessTokenExpiresAt || null
      state.session = session || null
      state.isAuthenticated = true
      state.requires2FA = false
      state.twoFactorUserName = null
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      }
      if (accessTokenExpiresAt) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, accessTokenExpiresAt)
      }
      if (session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
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
      state.accessTokenExpiresAt = null
      state.session = null
      state.isAuthenticated = false
      state.requires2FA = false
      state.twoFactorUserName = null
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      localStorage.removeItem(STORAGE_KEYS.TWO_FA_TOKEN)
    },
  },
})

const systemSlice = createSlice({
  name: 'system',
  initialState: initialSystemState,
  reducers: {
    setClockOffset(state, action: PayloadAction<number>) {
      state.clockOffset = action.payload
    },
  },
})

export const { setCredentials, setUser, set2FARequired, logout } = authSlice.actions
export const { setClockOffset } = systemSlice.actions

// ─── Store ─────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    system: systemSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
