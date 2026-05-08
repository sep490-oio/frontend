import { useState, useRef, useEffect } from 'react'
import { Button, Typography, Alert, Upload, Flex, Tooltip } from 'antd'
import { CameraOutlined, ReloadOutlined, CheckOutlined, UploadOutlined, AimOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useCamera } from '@/hooks/useCamera'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { validateCaptureQuality } from '@/components/ui/CaptureQualityValidator'
import { LivenessChallengeOverlay } from '@/components/ui/LivenessChallenge'
import type {
  CaptureMetadata,
  CaptureQualityProfile,
  CaptureQualityResult,
  CaptureStep,
  OverlayType,
} from '@/types/capture'

interface SecureCaptureUploaderProps {
  step: CaptureStep
  facingMode?: 'user' | 'environment'
  overlayType?: OverlayType
  /** Quality profile tunes blur/brightness thresholds. Defaults to 'item_or_package' (lenient). */
  qualityProfile?: CaptureQualityProfile
  onCapture: (blob: Blob, metadata: Partial<CaptureMetadata>) => void
  instruction?: string
  children?: React.ReactNode // Liveness challenge overlay
  autoStart?: boolean
}

const OVERLAY_STYLES: Record<OverlayType, React.CSSProperties> = {
  document: {
    position: 'absolute',
    top: '15%', left: '10%', right: '10%', bottom: '25%',
    border: '3px dashed rgba(255,255,255,0.6)',
    borderRadius: 12,
    pointerEvents: 'none',
  },
  face: {
    position: 'absolute',
    top: '10%', left: '25%', right: '25%', bottom: '20%',
    border: '3px dashed rgba(255,255,255,0.6)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
}

const STEP_INSTRUCTION_KEYS: Record<string, string> = {
  id_front: 'capture.positionFront',
  id_back: 'capture.positionBack',
  selfie: 'capture.centerFace',
  item_photo: 'capture.takeItemPhoto',
}

/** ms after camera goes live before shutter is enabled (autofocus settling). */
const SHUTTER_DEBOUNCE_MS = 1000
/** ms to wait after refocus call before grabbing first frame. */
const REFOCUS_SETTLE_MS = 300
/** ms gap between burst frames. */
const BURST_FRAME_GAP_MS = 150
/** Number of burst frames to capture per shutter click. */
const BURST_FRAME_COUNT = 3

const REJECTION_REASON_KEY: Record<string, string> = {
  resolution_too_low: 'capture.error.resolutionTooLow',
  too_dark: 'capture.error.tooDark',
  too_bright: 'capture.error.tooBright',
  blur_severe: 'capture.error.blurSevere',
}

export function SecureCaptureUploader({
  step,
  facingMode = 'environment',
  overlayType = 'document',
  qualityProfile = 'item_or_package',
  onCapture,
  instruction,
  children,
  autoStart,
}: SecureCaptureUploaderProps) {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const { videoRef, isSupported, isActive, error, focusSupported, startCamera, stopCamera, refocus, focusAt } = useCamera()
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; key: number } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedMeta, setCapturedMeta] = useState<Partial<CaptureMetadata> | null>(null)
  const [qualityResult, setQualityResult] = useState<CaptureQualityResult | null>(null)
  const [showLiveness, setShowLiveness] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraReadyTime, setCameraReadyTime] = useState<number | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [, forceTick] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Track when the active stream actually goes live so we can debounce the shutter.
  useEffect(() => {
    if (isActive && cameraReadyTime === null) {
      setCameraReadyTime(Date.now())
    }
    if (!isActive) {
      setCameraReadyTime(null)
    }
  }, [isActive, cameraReadyTime])

  useEffect(() => {
    if (autoStart && isSupported && !cameraStarted && !preview && !isActive) {
      handleStartCamera()
    }
  }, [autoStart, isSupported, cameraStarted, preview, isActive])

  // Re-evaluate canCapture each second so the disabled state flips off without user interaction.
  useEffect(() => {
    if (cameraReadyTime === null) return
    const elapsed = Date.now() - cameraReadyTime
    if (elapsed >= SHUTTER_DEBOUNCE_MS) return
    const timer = setTimeout(() => forceTick((n) => n + 1), SHUTTER_DEBOUNCE_MS - elapsed + 50)
    return () => clearTimeout(timer)
  }, [cameraReadyTime])

  const canCaptureNow = isActive && cameraReadyTime !== null && Date.now() - cameraReadyTime > SHUTTER_DEBOUNCE_MS

  const handleStartCamera = () => {
    void startCamera({ facingMode })
    setCameraStarted(true)
    if (step === 'selfie') {
      setTimeout(() => setShowLiveness(true), 1500)
    }
  }

  /** Capture a single frame from the live video element to ImageData. */
  const grabFrame = (): { blob: Blob; imageData: ImageData; width: number; height: number } | null => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return null
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Convert canvas to JPEG blob (sync via toDataURL for older Safari).
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const byteString = atob(dataUrl.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    const blob = new Blob([ab], { type: 'image/jpeg' })

    return { blob, imageData, width: canvas.width, height: canvas.height }
  }

  const handleCapture = async () => {
    if (!canCaptureNow || isCapturing) return
    setIsCapturing(true)
    try {
      // Trigger refocus where supported (single-shot, then continuous).
      try {
        await refocus()
      } catch {
        // Best-effort — capabilities may be missing on some devices.
      }
      // Wait for autofocus to settle before grabbing frames.
      await new Promise((r) => setTimeout(r, REFOCUS_SETTLE_MS))

      const frames: { blob: Blob; imageData: ImageData; width: number; height: number }[] = []
      for (let i = 0; i < BURST_FRAME_COUNT; i++) {
        const frame = grabFrame()
        if (frame) frames.push(frame)
        if (i < BURST_FRAME_COUNT - 1) {
          await new Promise((r) => setTimeout(r, BURST_FRAME_GAP_MS))
        }
      }
      if (frames.length === 0) {
        setIsCapturing(false)
        return
      }

      const quality = validateCaptureQuality(
        frames.map((f) => f.imageData),
        qualityProfile,
      )

      // Block on hard reject — keep camera open, show CTA.
      if (quality.decision === 'rejected') {
        setQualityResult(quality)
        setIsCapturing(false)
        return
      }

      const best = frames[quality.selectedFrameIndex] ?? frames[0]
      const burstId = `burst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const metadata: Partial<CaptureMetadata> = {
        captureSource: 'camera',
        facingMode,
        resolution: { width: best.width, height: best.height },
        capturedAt: new Date().toISOString(),
        step,
        burstId,
        qualityScore: quality,
      }

      setPreview(URL.createObjectURL(best.blob))
      setCapturedBlob(best.blob)
      setCapturedMeta(metadata)
      setQualityResult(quality)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleUse = () => {
    if (capturedBlob && capturedMeta) {
      onCapture(capturedBlob, capturedMeta)
      stopCamera()
    }
  }

  const handleRetake = () => {
    setPreview(null)
    setCapturedBlob(null)
    setCapturedMeta(null)
    setQualityResult(null)
    if (!isActive) handleStartCamera()
    else setCameraReadyTime(Date.now()) // reset shutter debounce after retake
  }

  // Fallback: file picker when camera not supported
  if (!isSupported) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Alert type="info" message={t('capture.cameraNotAvailable')} style={{ marginBottom: 16 }} />
        <Upload
          showUploadList={false}
          accept="image/*"
          beforeUpload={(file) => {
            onCapture(file, {
              captureSource: 'file_picker',
              capturedAt: new Date().toISOString(),
              step,
            })
            return false
          }}
        >
          <Button icon={<UploadOutlined />}>{t('capture.uploadFromFiles')}</Button>
        </Upload>
      </div>
    )
  }

  // Preview mode
  if (preview) {
    const showWarningBanner = qualityResult?.decision === 'warning'
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 8 : 0 }}>
        {showWarningBanner && (
          <Alert
            type="warning"
            showIcon
            message={t('capture.warning.borderlineBlur')}
            style={{ marginBottom: 12, textAlign: 'left' }}
          />
        )}
        <img
          src={preview}
          alt="Captured"
          style={{
            width: '100%',
            maxHeight: isMobile ? '60vh' : 400,
            objectFit: 'contain',
            borderRadius: 8,
            marginBottom: 12,
          }}
        />
        <Flex justify="center" gap={12} wrap="wrap">
          <Button icon={<ReloadOutlined />} onClick={handleRetake}>{t('capture.retake')}</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleUse} style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
            {t('capture.useThisPhoto')}
          </Button>
        </Flex>
      </div>
    )
  }

  // Show "Open Camera" button if camera hasn't been started yet (user gesture required for mobile)
  if (!cameraStarted && !preview) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: isMobile ? 24 : 32,
          background: 'transparent',
          border: '2px dashed rgba(255,255,255,0.4)',
          borderRadius: 8,
          minHeight: isMobile ? '70dvh' : 400,
          cursor: 'pointer',
        }}
        onClick={handleStartCamera}
      >
        <CameraOutlined style={{ fontSize: isMobile ? 36 : 48, color: '#fff' }} />
        <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: '#fff', textAlign: 'center', padding: '0 8px' }}>
          {instruction || t(STEP_INSTRUCTION_KEYS[step] || 'capture.tapToOpenCamera')}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {t('capture.tapToActivate')}
        </span>
      </div>
    )
  }

  const rejectionKey = qualityResult?.rejectionReason
    ? REJECTION_REASON_KEY[qualityResult.rejectionReason]
    : undefined
  const shutterDisabled = !canCaptureNow || isCapturing
  const shutterTooltip = isCapturing
    ? t('capture.capturing')
    : !canCaptureNow
      ? t('capture.shutterDisabled')
      : ''

  // Responsive control sizing
  const shutterSize = isMobile ? 56 : 64
  const refocusSize = isMobile ? 38 : 44
  const bottomBarHeight = isMobile ? 64 : 80
  const instructionBottom = bottomBarHeight + (isMobile ? 8 : 16)

  return (
    <div style={{
      position: 'relative',
      background: '#000',
      borderRadius: isMobile ? 0 : 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Camera viewfinder — click/tap to focus */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const nx = (e.clientX - rect.left) / rect.width
          const ny = (e.clientY - rect.top) / rect.height
          setFocusRing({ x: e.clientX - rect.left, y: e.clientY - rect.top, key: Date.now() })
          void focusAt(nx, ny)
          // Reset shutter debounce after tap-to-focus so user gets a settling window.
          setCameraReadyTime(Date.now())
          setQualityResult(null)
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          cursor: focusSupported ? 'crosshair' : 'default',
          flex: '1 1 auto',
        }}
      />

      {/* Focus ring — briefly shown where the user tapped */}
      {focusRing && (
        <div
          key={focusRing.key}
          style={{
            position: 'absolute',
            top: focusRing.y - 28,
            left: focusRing.x - 28,
            width: 56,
            height: 56,
            border: '2px solid #ffd666',
            borderRadius: '50%',
            pointerEvents: 'none',
            animation: 'oio-focus-ring 700ms ease-out forwards',
          }}
          onAnimationEnd={() => setFocusRing(null)}
        />
      )}

      {/* Overlay guide */}
      <div style={OVERLAY_STYLES[overlayType]} />

      {/* Liveness challenge overlay for selfie */}
      {showLiveness && step === 'selfie' && isActive && (
        <LivenessChallengeOverlay
          videoRef={videoRef}
          step={step}
          onComplete={(frames) => {
            setShowLiveness(false)
            if (frames.length > 0) {
              const bestFrame = frames[frames.length - 1]
              setPreview(URL.createObjectURL(bestFrame.blob))
              setCapturedBlob(bestFrame.blob)
              setCapturedMeta({ ...bestFrame.metadata, livenessCheckPassed: true })
            }
          }}
          onFail={() => {
            setShowLiveness(false)
          }}
        />
      )}
      {children}

      {/* Instruction */}
      <div style={{
        position: 'absolute',
        bottom: instructionBottom,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 16px',
      }}>
        <Typography.Text style={{
          color: '#fff',
          fontSize: isMobile ? 12 : 14,
          background: 'rgba(0,0,0,0.5)',
          padding: isMobile ? '4px 12px' : '6px 16px',
          borderRadius: 20,
          lineHeight: 1.4,
          display: 'inline-block',
          maxWidth: '90%',
        }}>
          {instruction || t(STEP_INSTRUCTION_KEYS[step] || 'capture.takePhoto')}
        </Typography.Text>
      </div>

      {/* Hard rejection — block accept, prompt tap-to-focus */}
      {rejectionKey && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: 16,
        }}>
          <div
            style={{
              background: 'rgba(0,0,0,0.78)',
              color: '#fff',
              padding: isMobile ? '12px 16px' : '14px 22px',
              borderRadius: 12,
              textAlign: 'center',
              maxWidth: isMobile ? '90%' : '80%',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <AimOutlined style={{ fontSize: isMobile ? 28 : 32, color: '#ffd666', display: 'block', marginBottom: 6 }} />
            <Typography.Text style={{ color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600, display: 'block' }}>
              {t(rejectionKey)}
            </Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, display: 'block', marginTop: 4 }}>
              {t('capture.cta.tapToFocusAndRetake')}
            </Typography.Text>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert type="error" message={error} style={{ position: 'absolute', top: 8, left: 8, right: 8, fontSize: 12 }} />
      )}

      {/* Capture button + Refocus */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? 12 : 16,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isMobile ? 16 : 24,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {focusSupported && (
          <Button
            shape="circle"
            icon={<AimOutlined style={{ fontSize: isMobile ? 16 : 18 }} />}
            onClick={() => {
              void refocus()
              setCameraReadyTime(Date.now())
              setQualityResult(null)
            }}
            disabled={!isActive}
            title={t('capture.refocus', 'Re-focus camera')}
            style={{
              width: refocusSize,
              height: refocusSize,
              background: 'rgba(0,0,0,0.5)',
              borderColor: 'rgba(255,255,255,0.6)',
              color: '#fff',
            }}
          />
        )}
        <Tooltip title={shutterTooltip} open={shutterDisabled ? undefined : false}>
          <Button
            shape="circle"
            size="large"
            icon={<CameraOutlined style={{ fontSize: isMobile ? 20 : 24 }} />}
            onClick={handleCapture}
            disabled={shutterDisabled}
            loading={isCapturing}
            style={{
              width: shutterSize,
              height: shutterSize,
              background: shutterDisabled ? 'rgba(180,180,180,0.85)' : 'rgba(255,255,255,0.9)',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              opacity: shutterDisabled ? 0.7 : 1,
            }}
          />
        </Tooltip>
        {focusSupported && <div style={{ width: refocusSize }} /> /* spacer to keep shutter centered */}
      </div>

      {/* Tap-to-focus hint (first session only) */}
      {focusSupported && isActive && !focusRing && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 12,
        }}>
          {t('capture.tapToFocus', 'Tap to focus')}
        </div>
      )}
    </div>
  )
}
