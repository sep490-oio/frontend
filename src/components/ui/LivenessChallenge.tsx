import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography, Button, Flex } from 'antd'
import { EyeOutlined, ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import type { CaptureMetadata, LivenessChallenge as ChallengeType } from '@/types/capture'

interface LivenessChallengeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onComplete: (frames: { blob: Blob; metadata: Partial<CaptureMetadata> }[]) => void
  onFail: () => void
  step: string
}

const CHALLENGES: { type: ChallengeType; instruction: string; icon: React.ReactNode }[] = [
  { type: 'blink', instruction: 'Please blink your eyes', icon: <EyeOutlined /> },
  { type: 'head_left', instruction: 'Turn your head to the left', icon: <ArrowLeftOutlined /> },
  { type: 'head_right', instruction: 'Turn your head to the right', icon: <ArrowRightOutlined /> },
]

export function LivenessChallengeOverlay({ videoRef, onComplete, onFail, step }: LivenessChallengeProps) {
  const [challenge] = useState(() => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)])
  const [status, setStatus] = useState<'waiting' | 'capturing' | 'done'>('waiting')
  const [attempts, setAttempts] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const framesRef = useRef<{ blob: Blob; metadata: Partial<CaptureMetadata> }[]>([])
  const burstId = useRef(crypto.randomUUID())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video) return null

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

    captureRef.current = setInterval(() => {
      const frame = captureFrame()
      if (frame) {
        framesRef.current.push(frame)
        frameCount++
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
        <Flex vertical align="center" gap={16}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 32,
            color: 'var(--color-accent)',
          }}>
            {challenge.icon}
          </div>
          <Typography.Text style={{ color: '#fff', fontSize: 18, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {challenge.instruction}
          </Typography.Text>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            {countdown}s remaining
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            onClick={startBurstCapture}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            I'm ready — Capture now
          </Button>
          {attempts > 0 && (
            <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              Attempt {attempts + 1}/3
            </Typography.Text>
          )}
        </Flex>
      )}

      {status === 'capturing' && (
        <Flex vertical align="center" gap={12}>
          <ReloadOutlined spin style={{ fontSize: 40, color: '#fff' }} />
          <Typography.Text style={{ color: '#fff', fontSize: 16 }}>
            Capturing... Hold still
          </Typography.Text>
        </Flex>
      )}

      {status === 'done' && (
        <Flex vertical align="center" gap={12}>
          <Typography.Text style={{ color: '#fff', fontSize: 16 }}>
            Liveness check complete
          </Typography.Text>
        </Flex>
      )}
    </div>
  )
}
