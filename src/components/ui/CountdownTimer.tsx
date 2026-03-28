import { useEffect, useRef, useState } from 'react'

interface CountdownTimerProps {
  endTime: string
  onEnd?: () => void
  size?: 'small' | 'default' | 'large'
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }

function calcTimeLeft(endTimestamp: number, now: number): TimeLeft {
  const total = Math.max(0, endTimestamp - now)
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const FONT_SIZES: Record<string, number> = {
  small: 12,
  default: 16,
  large: 22,
}

const ONE_HOUR = 60 * 60 * 1000
const FIVE_MIN = 5 * 60 * 1000

export function CountdownTimer({ endTime, onEnd, size = 'default' }: CountdownTimerProps) {
  const endTimestamp = new Date(endTime).getTime()
  const isValid = !!endTime && !Number.isNaN(endTimestamp)

  const [now, setNow] = useState(() => Date.now())
  const onEndCalledRef = useRef(false)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  useEffect(() => {
    onEndCalledRef.current = false
  }, [endTime])

  useEffect(() => {
    if (!isValid) {
      return
    }

    const timerId = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timerId)
  }, [isValid])

  const timeLeft = isValid ? calcTimeLeft(endTimestamp, now) : ZERO

  useEffect(() => {
    if (!isValid || timeLeft.total > 0 || onEndCalledRef.current) {
      return
    }

    onEndCalledRef.current = true
    onEndRef.current?.()
  }, [isValid, timeLeft.total])

  if (!isValid) {
    return null
  }

  if (timeLeft.total <= 0) {
    return (
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontFamily: "'DM Mono', monospace",
          fontSize: FONT_SIZES[size],
        }}
      >
        --:--:--
      </span>
    )
  }

  const isUrgent = timeLeft.total < ONE_HOUR
  const isCritical = timeLeft.total < FIVE_MIN
  const display =
    timeLeft.days > 0
      ? `${timeLeft.days}d ${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m`
      : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`
  const color = isUrgent ? 'var(--color-danger)' : 'var(--color-text-secondary)'

  return (
    <span
      className={isCritical ? 'oio-urgent-glow' : undefined}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      style={{
        color,
        fontFamily: "'DM Mono', monospace",
        fontSize: FONT_SIZES[size],
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {display}
    </span>
  )
}
