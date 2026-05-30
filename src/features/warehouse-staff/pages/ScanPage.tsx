import { useState, useRef, useEffect } from 'react'
import { Typography, Input, Card, Button, Alert, Space, Segmented, Flex, Tag } from 'antd'
import { CameraOutlined, EditOutlined, InboxOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Grid } from 'antd'
import jsQR from 'jsqr'
import { useScanShipment } from '@/features/warehouse/api'
import { useItemById } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { useNavigate } from 'react-router'
import type { InboundShipmentDto } from '@/types'

const { useBreakpoint } = Grid

function ShipmentItemRow({ shipment }: { shipment: InboundShipmentDto }) {
  const { data: item } = useItemById(shipment.itemId ?? '')
  const primaryImage = item?.images?.find((m) => m.isPrimary) ?? item?.images?.[0]

  return (
    <Flex gap={12} align="center" style={{ padding: '12px 0', borderBottom: '0px solid var(--color-border, #f0f0f0)' }}>
      {primaryImage?.url ? (
        <img
          src={primaryImage.url}
          alt={item?.title}
          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 56, height: 56, borderRadius: 8,
          background: 'var(--color-bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <InboxOutlined style={{ fontSize: 24, color: 'var(--color-text-secondary)' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong style={{ fontSize: 14, display: 'block' }} ellipsis>
          {item?.title ?? shipment.itemId}
        </Typography.Text>
        <Flex gap={8} align="center" wrap="wrap" style={{ marginTop: 4 }}>
          <StatusBadge status={shipment.status} />
          {item?.condition && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.condition}</Typography.Text>
          )}
        </Flex>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
        {shipment.weightGrams}g
      </Typography.Text>
    </Flex>
  )
}

export default function ScanPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

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
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach((track) => track.stop()); streamRef.current = null }
    if (videoRef.current) { videoRef.current.srcObject = null }
    setScanning(false)
  }

  useEffect(() => {
    if (mode !== 'camera') { stopCamera(); return }
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

  const handleScanAnother = () => { setResults(null); setNotFound(false) }

  const firstResult = results?.[0]
  const canReceive = results?.some((s) => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'failed')

  return (
    <div style={{ padding: isMobile ? '0 0 24px' : 0 }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 16 }}>
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
            block={isMobile}
          />

          {cameraError && (
            <Alert type="warning" message={t('scan.cameraError', 'Cannot access camera')} description={cameraError}
              showIcon closable onClose={() => setCameraError(null)}
              style={{ marginBottom: 16 }} />
          )}

          {mode === 'camera' && (
            <div style={{ maxWidth: isMobile ? '100%' : 400, marginBottom: 24 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '1' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                {scanning && (
                  <div style={{
                    position: 'absolute', inset: '20%',
                    border: '2px solid var(--color-accent)', borderRadius: 8, pointerEvents: 'none',
                  }} />
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                {scanning
                  ? t('scan.pointCamera', 'Point camera at QR code on the shipment label')
                  : t('scan.startingCamera', 'Starting camera...')}
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
              style={{ marginBottom: 24 }}
            />
          )}
        </>
      )}

      {notFound && (
        <Alert
          type="error"
          message={t('scan.notFound', 'Shipment not found')}
          description={t('scan.notFoundDesc', 'No shipment matches the provided code.')}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={handleScanAnother} style={{ minHeight: 44 }}>
              {t('scan.tryAgain', 'Try Again')}
            </Button>
          }
        />
      )}

      {results && (
        <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: isMobile ? 16 : 24 }}>
          {/* Batch header */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
            <Space wrap>
              <Typography.Text strong style={{ fontSize: isMobile ? 15 : 16 }}>
                {firstResult?.clientOrderCode}
              </Typography.Text>
              <Tag color="blue">{results.length} {results.length === 1 ? 'item' : 'items'}</Tag>
            </Space>
            <StatusBadge status={firstResult?.status ?? ''} />
          </Flex>

          <Flex gap={isMobile ? 8 : 16} wrap="wrap" style={{ marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <span>{getProviderLabel(firstResult?.providerCode)}</span>
            {firstResult?.carrierTrackingNumber && <span>Tracking: {firstResult.carrierTrackingNumber}</span>}
            <span>Sender: {firstResult?.senderName}</span>
          </Flex>

          {/* Items list */}
          <div style={{ background: 'var(--color-bg-surface)', borderRadius: 8, padding: '0 12px', marginBottom: 20 }}>
            {results.map((shipment) => (
              <ShipmentItemRow key={shipment.id} shipment={shipment} />
            ))}
          </div>

          <Flex gap={12} vertical={isMobile}>
            {canReceive && firstResult && (
              <Button
                type="primary"
                size={isMobile ? 'large' : 'middle'}
                block={isMobile}
                onClick={() => navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(firstResult.clientOrderCode)}`)}
                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', minHeight: 44 }}
              >
                {t('scan.receiveItem', 'Receive & Store')}
              </Button>
            )}
            <Button
              size={isMobile ? 'large' : 'middle'}
              block={isMobile}
              style={{ minHeight: 44 }}
              onClick={() => firstResult && navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(firstResult.clientOrderCode)}`)}
            >
              {t('scan.viewDetail', 'View Detail')}
            </Button>
            <Button
              size={isMobile ? 'large' : 'middle'}
              block={isMobile}
              style={{ minHeight: 44 }}
              onClick={handleScanAnother}
            >
              {t('scan.scanAnother', 'Scan Another')}
            </Button>
          </Flex>
        </Card>
      )}
    </div>
  )
}
