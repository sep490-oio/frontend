import { useState, useMemo } from 'react'
import { Typography, Button, Card, Space, Spin, App, Image, Popconfirm, Empty, Alert } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, StarOutlined, PlusOutlined, AuditOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  useItemById,
  useAddItemMedia,
  useRemoveItemMedia,
  useSetPrimaryImage,
  useResubmitItem,
} from '@/features/item/api'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { StatusBadge } from '@/components/ui/StatusBadge'

export default function EditItemPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const { id } = useParams<{ id: string }>()

  const { data: item, isLoading, isError } = useItemById(id ?? '')
  const addMedia = useAddItemMedia()
  const removeMedia = useRemoveItemMedia()
  const setPrimary = useSetPrimaryImage()
  const resubmitItem = useResubmitItem()
  const mediaUpload = useMediaUpload('item_image')

  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [uploading, setUploading] = useState(false)

  const existingImages = useMemo(() => item?.images ?? [], [item?.images])

  const handleRemoveImage = async (mediaId: string) => {
    if (!id) return
    try {
      await removeMedia.mutateAsync({ itemId: id, mediaId })
      message.success(t('mediaRemoved', 'Photo removed'))
    } catch {
      message.error(t('mediaRemoveError', 'Failed to remove photo'))
    }
  }

  const handleSetPrimary = async (mediaId: string) => {
    if (!id) return
    try {
      await setPrimary.mutateAsync({ itemId: id, mediaId })
      message.success(t('primarySet', 'Primary photo updated'))
    } catch {
      message.error(t('primarySetError', 'Failed to set primary photo'))
    }
  }

  const handleAddPhotos = async () => {
    if (!id || capturedPhotos.length === 0) return
    setUploading(true)
    try {
      const files = capturedPhotos.map((photo, i) =>
        new File([photo.blob], `item-photo-${i + 1}.jpg`, { type: 'image/jpeg' })
      )
      const uploadResults = await mediaUpload.uploadMultiple(files)

      for (const result of uploadResults) {
        await addMedia.mutateAsync({
          itemId: id,
          mediaUploadId: result.mediaUploadId,
          isPrimary: existingImages.length === 0 && uploadResults.indexOf(result) === 0,
          sortOrder: existingImages.length + uploadResults.indexOf(result),
        })
      }
      setCapturedPhotos([])
      message.success(t('photosAdded', 'Photos added successfully'))
    } catch {
      message.error(t('photosAddError', 'Failed to add photos'))
    } finally {
      setUploading(false)
    }
  }

  const handleResubmit = async () => {
    if (!id) return
    try {
      await resubmitItem.mutateAsync({ itemId: id })
      message.success(t('resubmitSuccess', 'Item resubmitted for review'))
      navigate(`${prefix}/items`)
    } catch (err) {
      message.error(normalizeErrorMessage(err, t('resubmitError', 'Failed to resubmit item')))
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  if (isError || !item) {
    return (
      <Alert
        type="error"
        message={t('itemNotFound', 'Item not found')}
        action={<Button onClick={() => navigate(`${prefix}/items`)}>{tc('action.back', 'Back')}</Button>}
      />
    )
  }

  const isWarehouseBound = item.requiresPlatformInspection || !!item.warehouseItemId
  const canResubmitOnline = (item.status === 'rejected' || item.status === 'draft') && !isWarehouseBound
  const canRequestReinspection = item.status === 'rejected' && isWarehouseBound
  const maxPhotos = 10 - existingImages.length

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/items`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>
        {t('editItem', 'Manage Item')}: {item.title}
      </Typography.Title>

      {/* Item Info (read-only) */}
      <Card title={t('itemInfo', 'Item Information')} style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div><strong>{t('title', 'Title')}:</strong> {item.title}</div>
          <div><strong>{t('condition', 'Condition')}:</strong> {item.condition}</div>
          <div><strong>{t('category', 'Category')}:</strong> {item.categoryId ?? '-'}</div>
          <div><strong>{t('quantity', 'Quantity')}:</strong> {item.quantity}</div>
          <div><strong>{t('status', 'Status')}:</strong> <StatusBadge status={item.status} /></div>
          {item.description && (
            <div>
              <strong>{t('description', 'Description')}:</strong>
              <SafeHtmlRenderer html={item.description} style={{ marginTop: 4 }} />
            </div>
          )}
        </Space>
        <Alert
          type="info"
          message={t('editNote', 'Item details (title, description, condition) cannot be changed after creation. You can manage photos and resubmit for review.')}
          style={{ marginTop: 16 }}
          showIcon
        />
      </Card>

      {/* Existing Photos */}
      <Card title={t('existingPhotos', 'Current Photos')} style={{ marginBottom: 24 }}>
        {existingImages.length === 0 ? (
          <Empty description={t('noPhotos', 'No photos yet')} />
        ) : (
          <Space wrap size="middle">
            {existingImages.map((img: any) => (
              <div key={img.id} style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={img.url || img.secureUrl}
                  width={140}
                  height={105}
                  style={{ objectFit: 'cover', borderRadius: 8, border: img.isPrimary ? '3px solid var(--color-accent)' : '1px solid var(--color-border)' }}
                />
                <Space size={4} style={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                  {!img.isPrimary && (
                    <Button size="small" icon={<StarOutlined />} onClick={() => handleSetPrimary(img.id)}>
                      {t('setPrimary', 'Primary')}
                    </Button>
                  )}
                  <Popconfirm title={t('removeConfirm', 'Remove this photo?')} onConfirm={() => handleRemoveImage(img.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            ))}
          </Space>
        )}
      </Card>

      {/* Add New Photos */}
      {maxPhotos > 0 && (
        <Card title={t('addPhotos', 'Add New Photos')} style={{ marginBottom: 24 }}>
          <MultiCaptureUploader
            maxPhotos={maxPhotos}
            step="item_photo"
            facingMode="environment"
            onPhotosChange={setCapturedPhotos}
          />
          {capturedPhotos.length > 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPhotos}
              loading={uploading}
              style={{ marginTop: 12 }}
            >
              {t('uploadPhotos', 'Upload {{count}} photo(s)', { count: capturedPhotos.length })}
            </Button>
          )}
        </Card>
      )}

      {/* Actions */}
      <Space>
        {canResubmitOnline && (
          <Button type="primary" onClick={handleResubmit} loading={resubmitItem.isPending}>
            {t('resubmitForReview', 'Resubmit for Review')}
          </Button>
        )}
        {canRequestReinspection && item.warehouseItemId && (
          <Button
            type="primary"
            icon={<AuditOutlined />}
            onClick={() => navigate(`/seller/warehouse/items/${item.warehouseItemId}`)}
          >
            {t('myItems.openWarehouse', 'Open warehouse item')}
          </Button>
        )}
        {canRequestReinspection && !item.warehouseItemId && (
          <Button type="primary" icon={<AuditOutlined />} disabled>
            {t('myItems.warehousePending', 'Pending warehouse intake')}
          </Button>
        )}
        <Button onClick={() => navigate(`${prefix}/items`)}>
          {tc('action.back', 'Back to Items')}
        </Button>
      </Space>
    </div>
  )
}
