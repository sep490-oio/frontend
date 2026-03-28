import type { Gender, AddressType, UserStatus } from './enums'

export interface UserDto {
  id: string
  userName: string
  email: string
  emailConfirmed: boolean
  phoneNumber?: string
  countryCode?: string
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  twoFactorProvider?: string
  status: UserStatus
  createdAt: string
  profile?: UserProfileDto
}

export interface UserProfileDto {
  firstName?: string
  lastName?: string
  displayName?: string
  fullName?: string
  avatarUrl?: string
  dateOfBirth?: string
  gender?: Gender
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  avatarMediaUploadId?: string
  dateOfBirth?: string
  gender?: Gender
}

export interface UserAddressDto {
  id: string
  type: AddressType
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  isDefault: boolean
  createdAt?: string
}

export interface CreateAddressRequest {
  type: AddressType
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  countryCode?: string
  isDefault?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SetPhoneNumberRequest {
  phoneNumber: string
  countryCode: string
}

export interface SetupTotpResponse {
  secret: string
  qrCodeUri: string
  recoveryCodesCount: number
}

export interface UserNotificationPreferenceDto {
  id: string
  isEnabled: boolean
  channels: string
  quietHours?: string
  rateLimits?: string
  createdAt: string
  modifiedAt?: string
}
