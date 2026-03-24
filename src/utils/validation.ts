import { z } from 'zod'

export const emailSchema = z.string().email('Email không hợp lệ')

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')

export const userNameSchema = z
  .string()
  .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
  .max(30, 'Tên đăng nhập tối đa 30 ký tự')
  .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới')

export const phoneSchema = z.string().regex(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ')

export const requiredString = (message = 'Trường này là bắt buộc') =>
  z.string().min(1, message)

export const positiveNumber = (message = 'Giá trị phải lớn hơn 0') =>
  z.number().positive(message)
