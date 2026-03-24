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

function calcTimeLeft(endTime: string): TimeLeft {
  const total = Math.max(0, new Date(endTime).getTime() - Date.now())
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const FONT_SIZES: Record<string, number> = {
  small: 12,
  default: 16,
  large: 22,
}

const ONE_HOUR = 60 * 60 * 1000
const FIVE_MIN = 5 * 60 * 1000

export function CountdownTimer({ endTime, onEnd, size = 'default' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(endTime))
  const onEndCalledRef = useRef(false)

  // Reset the guard when endTime changes (new countdown)
  useEffect(() => {
    onEndCalledRef.current = false
  }, [endTime])

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calcTimeLeft(endTime)
      setTimeLeft(tl)
      if (tl.total <= 0) {
        clearInterval(timer)
        if (!onEndCalledRef.current) {
          onEndCalledRef.current = true
          onEnd?.()
        }
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [endTime, onEnd])

  if (timeLeft.total <= 0) {
    return (
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: FONT_SIZES[size],
          color: 'var(--color-text-secondary)',
        }}
      >
        --:--:--
      </span>
    )
  }

  const isUrgent = timeLeft.total < ONE_HOUR
  const isCritical = timeLeft.total < FIVE_MIN

  // Format: "2d 14h 32m" when > 1 day, "14:32:07" when < 1 day
  const display =
    timeLeft.days > 0
      ? `${timeLeft.days}d ${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m`
      : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`

  const color = isUrgent ? 'var(--color-danger)' : 'var(--color-text-secondary)'

  return (
    <span
      className={isCritical ? 'oio-urgent-glow' : undefined}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: FONT_SIZES[size],
        fontVariantNumeric: 'tabular-nums',
        color,
      }}
    >
      {display}
    </span>
  )
}
