import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('vi')

// Default display timezone for all user-facing datetimes (LOW #3 from the
// i18n improvement plan).
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

/**
 * Format a datetime in Vietnam timezone (Asia/Ho_Chi_Minh). Accepts any
 * input dayjs would accept; returns the formatted string per `fmt`.
 */
export function formatDateTimeVn(date: string | Date, fmt = 'DD MMM YYYY HH:mm'): string {
  return dayjs(date).tz(VN_TIMEZONE).format(fmt)
}

export function formatCurrency(amount: number, currency = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow()
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num)
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Format enum values (e.g. 'like_new' -> 'Like New', 'regular' -> 'Regular')
 */
export function formatEnumText(value: string | undefined | null): string {
  if (!value) return ''
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
