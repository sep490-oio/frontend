import { useState, useEffect, useRef } from 'react'
import { Button, Typography, Alert, Upload, Flex } from 'antd'
import { CameraOutlined, ReloadOutlined, CheckOutlined, UploadOutlined } from '@ant-design/icons'
import { useCamera } from '@/hooks/useCamera'
import { validateCaptureQuality } from '@/components/ui/CaptureQualityValidator'
import { LivenessChallengeOverlay } from '@/components/ui/LivenessChallenge'
import type { CaptureMetadata, CaptureStep, OverlayType } from '@/types/capture'

interface SecureCaptureUploaderProps {
  step: CaptureStep
  facingMode?: 'user' | 'environment'
  overlayType?: OverlayType
  onCapture: (blob: Blob, metadata: Partial<CaptureMetadata>) => void
  instruction?: string
  children?: React.ReactNode // Liveness challenge overlay
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

const STEP_INSTRUCTIONS: Record<string, string> = {
  id_front: 'Position the front of your ID within the frame',
  id_back: 'Position the back of your ID within the frame',
  selfie: 'Center your face in the oval',
  item_photo: 'Take a clear photo of the item',
}

export function SecureCaptureUploader({
  step,
  facingMode = 'environment',
  overlayType = 'document',
  onCapture,
  instruction,
  children,
}: SecureCaptureUploaderProps) {
  const { videoRef, isSupported, isActive, error, startCamera, stopCamera, takeSnapshot } = useCamera()
  const [preview, setPreview] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedMeta, setCapturedMeta] = useState<Partial<CaptureMetadata> | null>(null)
  const [qualityIssues, setQualityIssues] = useState<string[]>([])
  const [showLiveness, setShowLiveness] = useState(step === 'selfie')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isSupported) {
      startCamera({ facingMode })
    }
    return () => stopCamera()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = () => {
    const result = takeSnapshot(step)
    if (!result) return

    // Quality validation
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d')?.drawImage(img, 0, 0)
      const quality = validateCaptureQuality(canvas, {
        minWidth: step === 'selfie' ? 640 : 800,
        minHeight: step === 'selfie' ? 480 : 600,
        type: overlayType,
      })

      if (!quality.isValid) {
        setQualityIssues(quality.issues)
        return
      }

      setQualityIssues([])
      setPreview(URL.createObjectURL(result.blob))
      setCapturedBlob(result.blob)
      setCapturedMeta({
        ...result.metadata,
        qualityScore: quality.scores,
      })
    }
    img.src = URL.createObjectURL(result.blob)
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
    setQualityIssues([])
    if (!isActive) startCamera({ facingMode })
  }

  // Fallback: file picker when camera not supported
  if (!isSupported) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Alert type="info" message="Camera not available on this device. Upload from file instead." style={{ marginBottom: 16 }} />
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
          <Button icon={<UploadOutlined />}>Upload from files</Button>
        </Upload>
      </div>
    )
  }

  // Preview mode
  if (preview) {
    return (
      <div style={{ textAlign: 'center' }}>
        <img src={preview} alt="Captured" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, marginBottom: 12 }} />
        <Flex justify="center" gap={12}>
          <Button icon={<ReloadOutlined />} onClick={handleRetake}>Retake</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleUse} style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
            Use this photo
          </Button>
        </Flex>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
      {/* Camera viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
      />

      {/* Overlay guide */}
      <div style={OVERLAY_STYLES[overlayType]} />

      {/* Liveness challenge overlay for selfie */}
      {showLiveness && step === 'selfie' && isActive && (
        <LivenessChallengeOverlay
          videoRef={videoRef}
          step={step}
          onComplete={(frames) => {
            setShowLiveness(false)
            // Use the best frame (last one) as the primary capture
            if (frames.length > 0) {
              const bestFrame = frames[frames.length - 1]
              setPreview(URL.createObjectURL(bestFrame.blob))
              setCapturedBlob(bestFrame.blob)
              setCapturedMeta({ ...bestFrame.metadata, livenessCheckPassed: true })
            }
          }}
          onFail={() => {
            setShowLiveness(false)
            // Allow manual capture with livenessCheckPassed: false
          }}
        />
      )}
      {children}

      {/* Instruction */}
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center' }}>
        <Typography.Text style={{ color: '#fff', fontSize: 14, background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20 }}>
          {instruction || STEP_INSTRUCTIONS[step] || 'Take a clear photo'}
        </Typography.Text>
      </div>

      {/* Quality issues */}
      {qualityIssues.length > 0 && (
        <Alert
          type="warning"
          message="Quality issue"
          description={qualityIssues.join(' ')}
          style={{ position: 'absolute', top: 8, left: 8, right: 8 }}
          closable
          onClose={() => setQualityIssues([])}
        />
      )}

      {/* Error */}
      {error && (
        <Alert type="error" message={error} style={{ position: 'absolute', top: 8, left: 8, right: 8 }} />
      )}

      {/* Capture button */}
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
        <Button
          shape="circle"
          size="large"
          icon={<CameraOutlined style={{ fontSize: 24 }} />}
          onClick={handleCapture}
          disabled={!isActive}
          style={{
            width: 64, height: 64,
            background: 'rgba(255,255,255,0.9)',
            border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  )
}
