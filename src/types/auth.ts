export interface AuthTokenDto {
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  session?: UserSessionDto
  requiresTwoFactor: boolean
}

export interface LoginRequest {
  account: string
  password: string
  deviceId: string
}

export interface RegisterRequest {
  userName: string
  email: string
  password: string
  currency: string
  firstName?: string
  lastName?: string
}

export interface VerifyTotpRequest {
  code: string
  deviceId: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ConfirmEmailRequest {
  userId: string
  token: string
}

export interface UserSessionDto {
  sessionId: string
  deviceId: string
  userAgent: string
  ipAddress: string
  isActive: boolean
  isCurrentDevice: boolean
  createdAt: string
  lastRotatedAt: string
  slidingExpiresAt: string
  absoluteExpiresAt: string
  isNearingAbsoluteExpiration: boolean
  remainingAbsoluteTime: string
}

export interface LoginHistoryDto {
  id: string
  ipAddress: string
  userAgent: string
  loginAt: string
  status: string
}
