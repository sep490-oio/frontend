import { useState, useRef, useCallback, useEffect } from 'react'
import type { CaptureMetadata } from '@/types/capture'

// Extended media-track types: focus / zoom / exposure controls are not in stock
// lib.dom yet but ship in Chromium + recent Safari. We read them defensively.
type FocusMode = 'none' | 'manual' | 'single-shot' | 'continuous'
interface ExtendedCapabilities extends MediaTrackCapabilities {
  focusMode?: FocusMode[]
  focusDistance?: { min: number; max: number; step: number }
  pointsOfInterest?: unknown
  zoom?: { min: number; max: number; step: number }
}
interface ExtendedConstraintSet extends MediaTrackConstraintSet {
  focusMode?: FocusMode
  pointsOfInterest?: Array<{ x: number; y: number }>
  focusDistance?: number
  zoom?: number
}

interface UseCameraOptions {
  facingMode?: 'user' | 'environment'
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  isSupported: boolean
  isActive: boolean
  error: string | null
  /** True when the active track exposes a focusMode capability. */
  focusSupported: boolean
  startCamera: (opts?: UseCameraOptions) => Promise<void>
  stopCamera: () => void
  takeSnapshot: (step: string) => { blob: Blob; metadata: Partial<CaptureMetadata> } | null
  /** Nudge the camera to re-focus. Safe no-op when unsupported. */
  refocus: () => Promise<void>
  /** Tap-to-focus at a normalized (0–1) point inside the video frame. */
  focusAt: (normalizedX: number, normalizedY: number) => Promise<void>
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')
  const [focusSupported, setFocusSupported] = useState(false)

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const startCamera = useCallback(async (opts?: UseCameraOptions) => {
    if (!isSupported) {
      setError('Camera not supported on this device')
      return
    }

    const facing = opts?.facingMode ?? 'environment'
    setCurrentFacingMode(facing)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsActive(true)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

      // Probe focus capability + prefer continuous autofocus when available.
      const videoTrack = mediaStream.getVideoTracks()[0]
      const caps = (videoTrack?.getCapabilities?.() ?? {}) as ExtendedCapabilities
      const modes = caps.focusMode ?? []
      setFocusSupported(modes.includes('continuous') || modes.includes('single-shot') || modes.includes('manual'))
      if (modes.includes('continuous')) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' } as ExtendedConstraintSet] })
        } catch {
          // Some drivers reject 'continuous' at start — leave the browser's default.
        }
      }
    } catch (err) {
      const msg = err instanceof DOMException
        ? err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Camera error: ${err.message}`
        : 'Failed to access camera'
      setError(msg)
    }
  }, [isSupported])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsActive(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const takeSnapshot = useCallback((step: string): { blob: Blob; metadata: Partial<CaptureMetadata> } | null => {
    const video = videoRef.current
    if (!video || !isActive) return null

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const byteString = atob(dataUrl.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    const blob = new Blob([ab], { type: 'image/jpeg' })

    return {
      blob,
      metadata: {
        captureSource: 'camera',
        facingMode: currentFacingMode,
        resolution: { width: video.videoWidth, height: video.videoHeight },
        capturedAt: new Date().toISOString(),
        step,
      },
    }
  }, [isActive, currentFacingMode])

  const refocus = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const caps = (track.getCapabilities?.() ?? {}) as ExtendedCapabilities
    const modes = caps.focusMode ?? []
    try {
      // Kick a single-shot pass, then settle back on continuous so subsequent
      // scene changes still get autofocus.
      if (modes.includes('single-shot')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as ExtendedConstraintSet] })
      }
      if (modes.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as ExtendedConstraintSet] })
      }
    } catch {
      // Driver-dependent; silently fall back to whatever the browser was doing.
    }
  }, [])

  const focusAt = useCallback(async (nx: number, ny: number) => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const caps = (track.getCapabilities?.() ?? {}) as ExtendedCapabilities
    const modes = caps.focusMode ?? []
    const clamped = { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) }
    try {
      if (modes.includes('single-shot')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'single-shot', pointsOfInterest: [clamped] } as ExtendedConstraintSet],
        })
        // Return to continuous so the user doesn't have to refocus manually forever.
        if (modes.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as ExtendedConstraintSet] })
        }
      } else if (modes.includes('continuous')) {
        // Best-effort: some drivers honor pointsOfInterest even in continuous mode.
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous', pointsOfInterest: [clamped] } as ExtendedConstraintSet],
        })
      }
    } catch {
      // Ignore — tap-to-focus is an enhancement, not a requirement.
    }
  }, [])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  return { videoRef, stream, isSupported, isActive, error, focusSupported, startCamera, stopCamera, takeSnapshot, refocus, focusAt }
}
