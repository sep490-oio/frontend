import { useState, useRef, useCallback, useEffect } from 'react'
import type { CaptureMetadata } from '@/types/capture'

interface UseCameraOptions {
  facingMode?: 'user' | 'environment'
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  stream: MediaStream | null
  isSupported: boolean
  isActive: boolean
  error: string | null
  startCamera: (opts?: UseCameraOptions) => Promise<void>
  stopCamera: () => void
  takeSnapshot: (step: string) => { blob: Blob; metadata: Partial<CaptureMetadata> } | null
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')

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

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  return { videoRef, stream, isSupported, isActive, error, startCamera, stopCamera, takeSnapshot }
}
