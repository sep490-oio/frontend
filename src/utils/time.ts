import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { store } from '@/app/store'

/**
 * Returns a Date object synchronized with the server time.
 * Uses the clock offset stored in Redux.
 */
export const getServerNow = (): Date => {
  const clockOffset = store.getState().system.clockOffset
  return new Date(Date.now() + clockOffset)
}

/**
 * Returns the current time in milliseconds, synchronized with the server.
 */
export const getServerNowMs = (): number => {
  const clockOffset = store.getState().system.clockOffset
  return Date.now() + clockOffset
}

/**
 * Returns the current synchronized server time as an ISO string.
 */
export const getServerNowIso = (): string => {
  return getServerNow().toISOString()
}

/**
 * Returns a Dayjs object synchronized with the server time.
 */
export const getServerDayjs = (): Dayjs => {
  return dayjs(getServerNow())
}
