import { Image, Typography, Space, Button } from 'antd'
import {
  FilePdfOutlined, PaperClipOutlined, DownloadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export interface DisputeAttachmentProps {
  resourceType?: string
  format?: string
  secureUrl: string
  fileName?: string
  bytes?: number
  durationSeconds?: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function DisputeAttachmentRenderer({
  resourceType,
  format,
  secureUrl,
  fileName,
  bytes,
  durationSeconds,
}: DisputeAttachmentProps) {
  const { t } = useTranslation('dispute')

  // Image
  if (resourceType === 'image') {
    return (
      <Image
        src={secureUrl}
        alt={fileName ?? t('attachment', 'Attachment')}
        width={200}
        style={{ borderRadius: 8, cursor: 'pointer' }}
      />
    )
  }

  // Video
  if (resourceType === 'video') {
    return (
      <div style={{ maxWidth: 320 }}>
        <video
          controls
          preload="metadata"
          src={secureUrl}
          style={{ width: '100%', borderRadius: 8 }}
        >
          <a href={secureUrl} target="_blank" rel="noopener noreferrer">
            {fileName ?? t('downloadVideo', 'Download video')}
          </a>
        </video>
        <Space size={8} style={{ marginTop: 4 }}>
          {fileName && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <PlayCircleOutlined style={{ marginRight: 4 }} />
              {fileName}
            </Typography.Text>
          )}
          {durationSeconds != null && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatDuration(durationSeconds)}
            </Typography.Text>
          )}
        </Space>
      </div>
    )
  }

  // PDF (resourceType=raw with format=pdf, or explicit)
  if (resourceType === 'raw' || format === 'pdf') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--color-bg-primary, #fafafa)',
        borderRadius: 8,
        border: '1px solid var(--color-border, #f0f0f0)',
      }}>
        <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text ellipsis style={{ fontSize: 13, display: 'block' }}>
            {fileName ?? t('document', 'Document')}
          </Typography.Text>
          {bytes != null && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {formatBytes(bytes)}
            </Typography.Text>
          )}
        </div>
        <Space size={4}>
          <Button
            size="small"
            type="link"
            href={secureUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('open', 'Open')}
          </Button>
          <a href={secureUrl} download={fileName ?? true}>
            <Button size="small" type="text" icon={<DownloadOutlined />} />
          </a>
        </Space>
      </div>
    )
  }

  // Unknown / generic fallback
  return (
    <Typography.Link href={secureUrl} target="_blank" style={{ fontSize: 12, display: 'block' }}>
      <PaperClipOutlined style={{ marginRight: 4 }} />
      {fileName ?? t('attachment', 'Attachment')}
      {bytes != null && (
        <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
          ({formatBytes(bytes)})
        </Typography.Text>
      )}
    </Typography.Link>
  )
}
