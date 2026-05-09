import { useEffect, useRef, useState } from 'react'
import { Alert, App, Input, Modal, Segmented, Space, Typography } from 'antd'
import { CameraOutlined, EditOutlined } from '@ant-design/icons'
import jsQR from 'jsqr'
import { useTranslation } from 'react-i18next'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

/**
 * Camera-based QR scanner for return-shipment flows. Mirrors the scanner
 * shape used by `BuyerShipmentScanPage.tsx` (jsQR over a hidden canvas
 * capturing a rear-camera stream). Also supports manual token entry as a
 * fallback.
 *
 * On each successful decode, `onScanned(rawPayload)` is invoked with the
 * raw QR payload string. The caller is responsible for passing that
 * payload to the matching BE scan endpoint which validates the signed
 * token and asserts the aggregate status.
 */
export interface ReturnQrScanModalProps {
  open: boolean
  onClose: () => void
  onScanned: (qrToken: string) => Promise<void>
  title?: string
  subtitle?: string
}

export function ReturnQrScanModal({
  open,
  onClose,
  onScanned,
  title,
  subtitle,
}: ReturnQrScanModalProps) {
  const { t } = useTranslation('order')
  const { message } = App.useApp()

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guard against multiple concurrent `onScanned` invocations once a frame
  // decodes — jsQR may fire again before React commits the stop.
  const handledRef = useRef(false)
  // Keep onScanned in a ref so the setInterval callback always calls the
  // latest version, even if the parent re-renders with a new handler between
  // the effect setup and the QR decode event.
  const onScannedRef = useRef(onScanned)
  useEffect(() => { onScannedRef.current = onScanned }, [onScanned])

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const handlePayload = async (rawPayload: string) => {
    if (handledRef.current) return
    handledRef.current = true
    stopCamera()
    setSubmitting(true)
    try {
      await onScannedRef.current(rawPayload)
    } catch (err) {
      message.error(normalizeErrorMessage(err, t('returnScan.invalidQr', 'Invalid QR code')))
      // Allow retry if it failed — re-arm so the camera reopens on next mount.
      handledRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!open) {
      stopCamera()
      handledRef.current = false
      setManualValue('')
      setCameraError(null)
      setMode('camera')
      return
    }
    if (mode !== 'camera') {
      stopCamera()
      return
    }

    let aborted = false
    const start = async () => {
      setCameraError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (aborted) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        try {
          await video.play()
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') return
          throw e
        }
        if (aborted) return
        setScanning(true)

        intervalRef.current = setInterval(() => {
          const v = videoRef.current
          const c = canvasRef.current
          if (!v || !c || v.readyState !== 4) return
          const ctx = c.getContext('2d')
          if (!ctx) return
          c.width = v.videoWidth
          c.height = v.videoHeight
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const imageData = ctx.getImageData(0, 0, c.width, c.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) {
            void handlePayload(code.data)
          }
        }, 300)
      } catch (err) {
        if (aborted) return
        setCameraError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    start()
    return () => {
      aborted = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode])

  const handleManualSubmit = () => {
    const trimmed = manualValue.trim()
    if (!trimmed) return
    void handlePayload(trimmed)
  }

  return (
    <Modal
      title={title ?? t('returnScan.title', 'Scan return QR')}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={480}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {subtitle && (
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        )}

        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'camera' | 'manual')}
          options={[
            {
              value: 'camera',
              icon: <CameraOutlined />,
              label: t('returnScan.camera', 'Camera'),
            },
            {
              value: 'manual',
              icon: <EditOutlined />,
              label: t('returnScan.manual', 'Manual'),
            },
          ]}
          block
        />

        {cameraError && (
          <Alert
            type="warning"
            showIcon
            closable
            message={t('returnScan.cameraError', 'Cannot access camera')}
            description={cameraError}
            onClose={() => setCameraError(null)}
          />
        )}

        {mode === 'camera' && (
          <div>
            <div
              style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '1',
                maxWidth: 400,
                margin: '0 auto',
              }}
            >
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                playsInline
                muted
              />
              {scanning && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '20%',
                    border: '2px solid var(--color-accent)',
                    borderRadius: 8,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Typography.Text
              type="secondary"
              style={{ display: 'block', marginTop: 8, fontSize: 12, textAlign: 'center' }}
            >
              {scanning
                ? t('returnScan.pointCamera', 'Point camera at the return QR code')
                : t('returnScan.startingCamera', 'Starting camera...')}
            </Typography.Text>
          </div>
        )}

        {mode === 'manual' && (
          <Input.Search
            size="large"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={t('returnScan.manualPlaceholder', 'Paste QR token')}
            enterButton={t('returnScan.submit', 'Submit')}
            onSearch={handleManualSubmit}
            loading={submitting}
            disabled={submitting}
          />
        )}

        {submitting && (
          <Alert
            type="info"
            showIcon
            message={t('returnScan.validating', 'Validating QR code...')}
          />
        )}
      </Space>
    </Modal>
  )
}
