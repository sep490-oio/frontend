import { useState, useRef, useEffect } from 'react'
import { Typography, Input, Alert, App, Segmented, Space } from 'antd'
import { CameraOutlined, EditOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import jsQR from 'jsqr'
import { useValidateDirectShipmentScan } from '@/features/order/api'

/**
 * Buyer-facing QR scanner for self-ship parcels. Decodes the QR payload,
 * validates the embedded token with the backend, then deep-links into the
 * receive/proof-of-delivery page. Falls back to manual shipment-id entry.
 */
export default function BuyerShipmentScanPage() {
  const { t } = useTranslation(['order', 'common'])
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [validatingLegacy, setValidatingLegacy] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validateScan = useValidateDirectShipmentScan()

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

  // Pattern: /me/shipments/:shipmentId/receive
  const directShipmentReceiveRe = /^\/me\/shipments\/([^/]+)\/receive$/
  // Pattern: /orders/:orderId/outbound-shipment/receive
  const outboundReceiveRe = /^\/orders\/([^/]+)\/outbound-shipment\/receive$/

  const handleTokenRef = useRef((_: string) => {})
  handleTokenRef.current = (rawPayload: string) => {
    let parsedUrl: URL | null = null
    try {
      parsedUrl = new URL(rawPayload)
    } catch {
      // Not a URL — legacy-token path: treat entire payload as token
    }

    if (parsedUrl) {
      const path = parsedUrl.pathname
      const token = parsedUrl.searchParams.get('token')

      if (directShipmentReceiveRe.test(path)) {
        // Direct-shipment QR: route internally preserving token
        navigate(token ? `${path}?token=${encodeURIComponent(token)}` : path)
        return
      }

      if (outboundReceiveRe.test(path)) {
        // Warehouse-outbound QR: route internally preserving token
        navigate(token ? `${path}?token=${encodeURIComponent(token)}` : path)
        return
      }

      // Legacy self-ship QR: /me/shipments/scan?token=...
      // These pre-printed labels lack the shipment id in the path. Validate the
      // token server-side to resolve the shipment, then redirect to canonical route.
      if (path === '/me/shipments/scan' && token) {
        setValidatingLegacy(true)
        validateScan.mutate(
          { token },
          {
            onSuccess: (data) => {
              setValidatingLegacy(false)
              navigate(`/me/shipments/${data.shipmentId}/receive?token=${encodeURIComponent(token)}`)
            },
            onError: (e) => {
              setValidatingLegacy(false)
              message.error(
                (e as Error)?.message ?? t('directShipment.scan.invalidQr', 'Invalid QR code'),
              )
            },
          },
        )
        return
      }

      // URL but unrecognised pattern
      message.error(t('directShipment.scan.unrecognizedQr', 'Unrecognized shipment QR'))
      return
    }

    // Legacy-token fallback: non-URL payload
    const token = rawPayload.trim() || null
    if (!token) {
      message.error(t('directShipment.scan.invalidQr', 'Invalid QR code'))
      return
    }
    validateScan.mutate(
      { token },
      {
        onSuccess: (data) => {
          navigate(`/me/shipments/${data.shipmentId}/receive?token=${encodeURIComponent(token!)}`)
        },
        onError: (e) => {
          message.error((e as Error)?.message ?? t('directShipment.scan.invalidQr', 'Invalid QR code'))
        },
      },
    )
  }

  useEffect(() => {
    if (mode !== 'camera') {
      stopCamera()
      return
    }
    let aborted = false

    const start = async () => {
      setCameraError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
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
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
          if (code?.data) {
            stopCamera()
            handleTokenRef.current(code.data)
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
  }, [mode])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const handleManualSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    // Manual path: accept a shipmentIdDisplay / internalTrackingCode and
    // route straight to the shipment detail, which handles lookup + errors.
    navigate(`/me/shipments/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 12px' }}>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        {t('directShipment.scan.title', 'Scan Parcel QR')}
      </Typography.Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'camera' | 'manual')}
          options={[
            { value: 'camera', icon: <CameraOutlined />, label: t('directShipment.scan.camera', 'Camera') },
            { value: 'manual', icon: <EditOutlined />, label: t('directShipment.scan.manual', 'Manual') },
          ]}
        />

        {cameraError && (
          <Alert
            type="warning"
            showIcon
            closable
            message={t('directShipment.scan.cameraError', 'Cannot access camera')}
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
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
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
                ? t('directShipment.scan.pointCamera', 'Point camera at the parcel QR code')
                : t('directShipment.scan.startingCamera', 'Starting camera...')}
            </Typography.Text>
          </div>
        )}

        {mode === 'manual' && (
          <Input.Search
            size="large"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={t('directShipment.scan.manualPlaceholder', 'Enter shipment ID or tracking code')}
            enterButton={t('directShipment.scan.search', 'Search')}
            onSearch={handleManualSubmit}
          />
        )}

        {(validateScan.isPending || validatingLegacy) && (
          <Alert type="info" showIcon message={t('directShipment.scan.validating', 'Validating QR code...')} />
        )}
      </Space>
    </div>
  )
}
