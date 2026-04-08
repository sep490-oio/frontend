import { Image, Flex, Typography } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
import type { ShipmentEvidenceDto } from '@/types'

interface ShipmentEvidenceGalleryProps {
  title: string
  photos: ShipmentEvidenceDto[]
}

export function ShipmentEvidenceGallery({ title, photos }: ShipmentEvidenceGalleryProps) {
  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {title}
      </Typography.Text>

      {photos.length === 0 ? (
        <Flex
          align="center"
          gap={6}
          style={{
            padding: '12px 16px',
            background: 'var(--color-bg-surface, #f5f5f5)',
            borderRadius: 6,
            color: 'var(--color-text-secondary, rgba(0,0,0,0.45))',
          }}
        >
          <PictureOutlined />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            No photos
          </Typography.Text>
        </Flex>
      ) : (
        <Image.PreviewGroup>
          <Flex gap={8} wrap="wrap">
            {photos.map((photo) => (
              <Image
                key={photo.id}
                src={photo.mediaUrl}
                width={80}
                height={80}
                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border-light, #d9d9d9)' }}
                preview={{ src: photo.mediaUrl }}
              />
            ))}
          </Flex>
        </Image.PreviewGroup>
      )}
    </div>
  )
}
