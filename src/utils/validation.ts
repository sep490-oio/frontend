import { z } from 'zod'
import type { TFunction } from 'i18next'

type T = TFunction<'validation'>

export const createEmailSchema = (t: T) =>
  z.string().email(t('emailInvalid', 'Email không hợp lệ'))

export const createPasswordSchema = (t: T) =>
  z
    .string()
    .min(8, t('passwordMinLength', 'Mật khẩu phải có ít nhất 8 ký tự'))
    .regex(/[A-Z]/, t('passwordUppercase', 'Mật khẩu phải có ít nhất 1 chữ hoa'))
    .regex(/[a-z]/, t('passwordLowercase', 'Mật khẩu phải có ít nhất 1 chữ thường'))
    .regex(/[0-9]/, t('passwordNumber', 'Mật khẩu phải có ít nhất 1 số'))
    .regex(/[^A-Za-z0-9]/, t('passwordSpecialChar', 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'))

export const createUsernameSchema = (t: T) =>
  z
    .string()
    .min(3, t('usernameMinLength', 'Tên đăng nhập phải có ít nhất 3 ký tự'))
    .max(30, t('usernameMaxLength', 'Tên đăng nhập tối đa 30 ký tự'))
    .regex(/^[a-zA-Z0-9_]+$/, t('usernamePattern', 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới'))

export const createPhoneSchema = (t: T) =>
  z.string().regex(/^[0-9]{9,11}$/, t('phoneInvalid', 'Số điện thoại không hợp lệ'))

export const createRequiredString = (t: T) =>
  z.string().min(1, t('required', 'Trường này là bắt buộc'))

export const createPositiveNumber = (t: T) =>
  z.number().positive(t('positiveValue', 'Giá trị phải lớn hơn 0'))
