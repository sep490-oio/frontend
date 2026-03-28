import apiClient from '@/lib/axios'
import { useMutation } from '@tanstack/react-query'
import type {
  AuthTokenDto,
  LoginRequest,
  RegisterRequest,
  VerifyTotpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ConfirmEmailRequest,
} from '@/types'

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiClient.post<AuthTokenDto>('/auth/login', data)
      return res.data
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await apiClient.post<AuthTokenDto>('/auth/register', data)
      return res.data
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
  })
}

export function useVerifyTotp() {
  return useMutation({
    mutationFn: async (data: VerifyTotpRequest) => {
      const res = await apiClient.post<AuthTokenDto>('/auth/two-factor/verify', data)
      return res.data
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      await apiClient.post('/auth/forgot-password', data)
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      await apiClient.post('/auth/reset-password', data)
    },
  })
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: async (data: ConfirmEmailRequest) => {
      await apiClient.post('/auth/confirm-email', data)
    },
  })
}

export function useResendConfirmEmail() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      await apiClient.post('/auth/resend-confirm-email', data)
    },
  })
}
