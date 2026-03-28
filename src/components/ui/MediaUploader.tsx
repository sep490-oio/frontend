import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, Progress, Space, Button, Image } from 'antd'
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FileOutlined,
  PaperClipOutlined,
} from '@ant-design/icons'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import type { UploadedFile } from '@/hooks/useMediaUpload'

interface MediaUploaderProps {
  context: string
  maxFiles?: number
  accept?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  initialFiles?: UploadedFile[]
}

export function MediaUploader({
  context,
  maxFiles = 1,
  accept,
  onUploadComplete,
  initialFiles,
}: MediaUploaderProps) {
  const { t } = useTranslation('common')
  const { upload, uploading, progress, uploadedFiles, error, removeFile } =
    useMediaUpload(context)

  const [dragOver, setDragOver] = useState(false)

  // Merge initial files with newly uploaded files
  const allFiles = initialFiles
    ? [...initialFiles, ...uploadedFiles.filter(f => !initialFiles.some(i => i.mediaUploadId === f.mediaUploadId))]
    : uploadedFiles

  const canUploadMore = allFiles.length < maxFiles

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = maxFiles - allFiles.length
      const toUpload = fileArray.slice(0, remaining)

      const newFiles: UploadedFile[] = []
      for (const file of toUpload) {
        try {
          const result = await upload(file)
          newFiles.push({
            mediaUploadId: result.mediaUploadId,
            secureUrl: result.secureUrl,
            publicId: result.publicId,
            resourceType: result.resourceType,
            fileName: file.name,
          })
        } catch {
          // error is tracked in hook state
        }
      }
      // Notify parent with ALL files (existing + newly uploaded)
      if (newFiles.length > 0) {
        onUploadComplete?.([...uploadedFiles, ...newFiles])
      }
    },
    [upload, maxFiles, allFiles.length, uploadedFiles, onUploadComplete],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (!canUploadMore || uploading) return
      const files = e.dataTransfer.files
      if (files.length > 0) {
        void handleFiles(files)
      }
    },
    [canUploadMore, uploading, handleFiles],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (canUploadMore && !uploading) {
        setDragOver(true)
      }
    },
    [canUploadMore, uploading],
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        void handleFiles(files)
      }
      // Reset input so re-selecting same file works
      e.target.value = ''
    },
    [handleFiles],
  )

  const handleRemove = useCallback(
    (mediaUploadId: string) => {
      removeFile(mediaUploadId)
      onUploadComplete?.(uploadedFiles.filter(f => f.mediaUploadId !== mediaUploadId))
    },
    [removeFile, uploadedFiles, onUploadComplete],
  )

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext)
  }

  return (
    <div>
      {/* Drop zone */}
      {canUploadMore && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '32px 24px',
            border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 8,
            backgroundColor: dragOver ? 'rgba(139, 115, 85, 0.04)' : '#FDFBF7',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleInputChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <CloudUploadOutlined style={{ fontSize: 32, color: 'var(--color-accent)' }} />
          <Typography.Text style={{ color: '#6B5B4F' }}>
            {t('dragDropUpload', 'Drag & drop or click to upload')}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {maxFiles > 1
              ? t('uploadLimit', 'Up to {{max}} files ({{count}}/{{max}} uploaded)', { max: maxFiles, count: allFiles.length })
              : t('selectFile', 'Select a file')}
          </Typography.Text>
        </label>
      )}

      {/* Upload progress */}
      {uploading && (
        <Progress
          percent={Math.round(progress)}
          size="small"
          strokeColor="var(--color-accent)"
          style={{ marginTop: 12 }}
        />
      )}

      {/* Error display */}
      {error && (
        <Typography.Text
          type="danger"
          style={{ display: 'block', fontSize: 12, marginTop: 8 }}
        >
          {error}
        </Typography.Text>
      )}

      {/* Uploaded file previews */}
      {allFiles.length > 0 && (
        <Space wrap size={8} style={{ marginTop: 12 }}>
          {allFiles.map((file) => (
            <div
              key={file.mediaUploadId}
              style={{
                position: 'relative',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                overflow: 'hidden',
                width: 96,
                height: 96,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FDFBF7',
              }}
            >
              {isImage(file.fileName) ? (
                <Image
                  src={file.secureUrl}
                  alt={file.fileName}
                  width={96}
                  height={96}
                  style={{ objectFit: 'cover' }}
                  preview={{ mask: file.fileName }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 8 }}>
                  {file.resourceType === 'video' ? (
                    <PaperClipOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />
                  ) : (
                    <FileOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />
                  )}
                  <Typography.Text
                    ellipsis
                    style={{ display: 'block', fontSize: 10, marginTop: 4, maxWidth: 80 }}
                  >
                    {file.fileName}
                  </Typography.Text>
                </div>
              )}
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(file.mediaUploadId)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  color: '#ff4d4f',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  padding: 0,
                  minWidth: 'unset',
                }}
              />
            </div>
          ))}
        </Space>
      )}
    </div>
  )
}
