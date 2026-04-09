import { useState, useRef, useEffect } from 'react'
import { Typography, Input, Card, Button, Alert, Space, Segmented, Flex, Tag } from 'antd'
import { CameraOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import jsQR from 'jsqr'
import { useScanShipment } from '@/features/warehouse/api'
import { useItemById } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { useNavigate } from 'react-router'
import type { InboundShipmentDto } from '@/types'

// Small component to show item info for a single shipment
function ShipmentItemRow({ shipment }: { shipment: InboundShipmentDto }) {
  const { data: item } = useItemById(shipment.itemId ?? '')
  const primaryImage = item?.images?.find((m) => m.isPrimary) ?? item?.images?.[0]

  return (
    <Flex gap={10} align="center" style={{ padding: '8px 0' }}>
      {primaryImage?.url ? (
        <img src={primaryImage.url} alt={item?.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <InboxOutlined style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong style={{ fontSize: 13, display: 'block' }} ellipsis>
          {item?.title ?? shipment.itemId}
        </Typography.Text>
        <Flex gap={6} align="center">
          <StatusBadge status={shipment.status} />
          {item?.condition && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{item.condition}</Typography.Text>
          )}
        </Flex>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
        {shipment.weightGrams}g
      </Typography.Text>
    </Flex>
  )
}

export default function ScanPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const [results, setResults] = useState<InboundShipmentDto[] | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const scanMutation = useScanShipment()

  const handleSearchRef = useRef((_: string) => {})
  handleSearchRef.current = (value: string) => {
    if (!value.trim()) return
    setNotFound(false)
    setResults(null)

    scanMutation.mutate(
      { code: value.trim(), trackingNumber: value.trim() },
      {
        onSuccess: (data) => {
          if (data && data.length > 0) {
            setResults(data)
          } else {
            setNotFound(true)
          }
        },
        onError: () => {
          setNotFound(true)
        },
      },
    )
  }

  const handleSearch = (value: string) => handleSearchRef.current(value)

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  useEffect(() => {
    if (mode !== 'camera') {
      stopCamera()
      return
    }
    mountedRef.current = true
    let aborted = false

    const start = async () => {
      setCameraError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (aborted) { stream.getTracks().forEach((tr) => tr.stop()); return }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        try { await video.play() } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; throw e }
        if (aborted) return
        setScanning(true)

        intervalRef.current = setInterval(() => {
          const v = videoRef.current
          const c = canvasRef.current
          if (!v || !c || v.readyState !== 4) return
          const ctx = c.getContext('2d')
          if (!ctx) return
          c.width = v.videoWidth; c.height = v.videoHeight
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const imageData = ctx.getImageData(0, 0, c.width, c.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
          if (code?.data) { stopCamera(); handleSearchRef.current(code.data) }
        }, 300)
      } catch (err) {
        if (aborted) return
        setCameraError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    start()
    return () => { aborted = true; stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => { return () => { mountedRef.current = false; stopCamera() } }, [])

  const handleScanAnother = () => {
    setResults(null)
    setNotFound(false)
  }

  const firstResult = results?.[0]
  const canReceive = results?.some((s) => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'failed')

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        {t('scan.title', 'Scan & Check-in')}
      </Typography.Title>

      {!results && (
        <>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as 'camera' | 'manual')}
            options={[
              { value: 'camera', icon: <CameraOutlined />, label: t('scan.camera', 'Camera') },
              { value: 'manual', icon: <EditOutlined />, label: t('scan.manual', 'Manual') },
            ]}
            style={{ marginBottom: 24 }}
          />

          {cameraError && (
            <Alert type="warning" message={t('scan.cameraError', 'Cannot access camera')} description={cameraError}
              showIcon closable onClose={() => setCameraError(null)} style={{ maxWidth: 600, marginBottom: 16 }} />
          )}

          {mode === 'camera' && (
            <div style={{ maxWidth: 400, marginBottom: 24 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '1' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                {scanning && (
                  <div style={{ position: 'absolute', inset: '20%', border: '2px solid var(--color-accent)', borderRadius: 8, pointerEvents: 'none' }} />
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                {scanning ? t('scan.pointCamera', 'Point camera at QR code on the shipment label') : t('scan.startingCamera', 'Starting camera...')}
              </Typography.Text>
            </div>
          )}

          {mode === 'manual' && (
            <Input.Search
              size="large"
              placeholder={t('scan.placeholder', 'Enter tracking number or shipment ID...')}
              enterButton={t('scan.search', 'Search')}
              loading={scanMutation.isPending}
              onSearch={handleSearch}
              style={{ maxWidth: 600, marginBottom: 24 }}
            />
          )}
        </>
      )}

      {notFound && (
        <Alert type="error" message={t('scan.notFound', 'Shipment not found')}
          description={t('scan.notFoundDesc', 'No shipment matches the provided code.')} showIcon
          style={{ maxWidth: 600, marginBottom: 16 }}
          action={<Button size="small" onClick={handleScanAnother}>{t('scan.tryAgain', 'Try Again')}</Button>} />
      )}

      {/* Scan result — batch card */}
      {results && (
        <Card style={{ maxWidth: 600 }}>
          {/* Batch header */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Space>
              <Typography.Text strong style={{ fontSize: 15 }}>{firstResult?.clientOrderCode}</Typography.Text>
              <Tag color="blue">{results.length} {results.length === 1 ? 'item' : 'items'}</Tag>
            </Space>
            <StatusBadge status={firstResult?.status ?? ''} />
          </Flex>

          {/* Provider + tracking info */}
          <Flex gap={16} style={{ marginBottom: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span>{getProviderLabel(firstResult?.providerCode)}</span>
            {firstResult?.carrierTrackingNumber && <span>Tracking: {firstResult.carrierTrackingNumber}</span>}
            <span>Sender: {firstResult?.senderName}</span>
          </Flex>

          {/* Items list */}
          <div style={{ background: 'var(--color-bg-surface)', borderRadius: 8, padding: '4px 12px', marginBottom: 16 }}>
            {results.map((shipment) => (
              <ShipmentItemRow key={shipment.id} shipment={shipment} />
            ))}
          </div>

          {/* Actions */}
          <Space wrap>
            {canReceive && firstResult && (
              <Button type="primary" onClick={() => navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(firstResult.clientOrderCode)}`)}
                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                {t('scan.receiveItem', 'Receive & Store')}
              </Button>
            )}
            <Button onClick={() => firstResult && navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(firstResult.clientOrderCode)}`)}>
              {t('scan.viewDetail', 'View Detail')}
            </Button>
            <Button onClick={handleScanAnother}>
              {t('scan.scanAnother', 'Scan Another')}
            </Button>
          </Space>
        </Card>
      )}
    </div>
  )
}
