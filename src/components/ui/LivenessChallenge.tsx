import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography, Button, Flex } from 'antd'
import { EyeOutlined, ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { CaptureMetadata, LivenessChallenge as ChallengeType } from '@/types/capture'
import { uuid } from '@/utils/constants'

interface LivenessChallengeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onComplete: (frames: { blob: Blob; metadata: Partial<CaptureMetadata> }[]) => void
  onFail: () => void
  step: string
}

const CHALLENGES: { type: ChallengeType; instructionKey: string; icon: React.ReactNode }[] = [
  { type: 'blink', instructionKey: 'capture.blinkEyes', icon: <EyeOutlined /> },
  { type: 'head_left', instructionKey: 'capture.turnHeadLeft', icon: <ArrowLeftOutlined /> },
  { type: 'head_right', instructionKey: 'capture.turnHeadRight', icon: <ArrowRightOutlined /> },
]

export function LivenessChallengeOverlay({ videoRef, onComplete, onFail, step }: LivenessChallengeProps) {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const [challenge] = useState(() => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)])
  const [status, setStatus] = useState<'waiting' | 'capturing' | 'done'>('waiting')
  const [attempts, setAttempts] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const framesRef = useRef<{ blob: Blob; metadata: Partial<CaptureMetadata> }[]>([])
  const burstId = useRef(uuid())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return null // Guard: stream not ready

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const byteString = atob(dataUrl.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)

    return {
      blob: new Blob([ab], { type: 'image/jpeg' }),
      metadata: {
        captureSource: 'camera' as const,
        facingMode: 'user' as const,
        resolution: { width: video.videoWidth, height: video.videoHeight },
        capturedAt: new Date().toISOString(),
        step,
        challengeId: challenge.type,
        burstId: burstId.current,
      },
    }
  }, [videoRef, step, challenge.type])

  const startBurstCapture = useCallback(() => {
    setStatus('capturing')
    framesRef.current = []
    let frameCount = 0

    let retries = 0
    captureRef.current = setInterval(() => {
      const frame = captureFrame()
      if (frame) {
        framesRef.current.push(frame)
        frameCount++
      } else {
        retries++
        if (retries > 20) {
          // Video stream never became ready — abort gracefully
          if (captureRef.current) clearInterval(captureRef.current)
          onFail()
          return
        }
      }
      if (frameCount >= 5) {
        if (captureRef.current) clearInterval(captureRef.current)
        setStatus('done')
        onComplete(framesRef.current)
      }
    }, 500) // capture every 500ms = 5 frames in 2.5s
  }, [captureFrame, onComplete])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (status === 'waiting') {
            // Timeout — auto-capture what we have
            if (attempts < 2) {
              setAttempts((a) => a + 1)
              return 10 // reset countdown for retry
            }
            // 3 attempts exhausted — submit anyway with flag
            onFail()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (captureRef.current) clearInterval(captureRef.current)
    }
  }, [attempts]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 10,
    }}>
      {status === 'waiting' && (
        <Flex vertical align="center" gap={isMobile ? 10 : 16} style={{ padding: isMobile ? '0 16px' : 0 }}>
          <div style={{
            width: isMobile ? 60 : 80,
            height: isMobile ? 60 : 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 24 : 32,
            color: 'var(--color-accent)',
          }}>
            {challenge.icon}
          </div>
          <Typography.Text style={{
            color: '#fff',
            fontSize: isMobile ? 15 : 18,
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}>
            {t(challenge.instructionKey)}
          </Typography.Text>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? 12 : 13 }}>
            {t('capture.remaining', { count: countdown })}
          </Typography.Text>
          <Button
            type="primary"
            size={isMobile ? 'middle' : 'large'}
            onClick={startBurstCapture}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('capture.readyCapture')}
          </Button>
          {attempts > 0 && (
            <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {t('capture.attempt', { current: attempts + 1, total: 3 })}
            </Typography.Text>
          )}
        </Flex>
      )}

      {status === 'capturing' && (
        <Flex vertical align="center" gap={12}>
          <ReloadOutlined spin style={{ fontSize: 40, color: '#fff' }} />
          <Typography.Text style={{ color: '#fff', fontSize: 16 }}>
            {t('capture.capturing')}
          </Typography.Text>
        </Flex>
      )}

      {status === 'done' && (
        <Flex vertical align="center" gap={12}>
          <Typography.Text style={{ color: '#fff', fontSize: 16 }}>
            {t('capture.livenessComplete')}
          </Typography.Text>
        </Flex>
      )}
    </div>
  )
}
