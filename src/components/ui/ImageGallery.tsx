import { useState } from 'react'
import { Image, Flex } from 'antd'
import { CheckCircleFilled, EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface GalleryImage {
  url: string
  thumbnailUrl?: string
  isPrimary?: boolean
}

interface ImageGalleryProps {
  images: GalleryImage[]
  alt?: string
  showOverlayBadges?: boolean
  isVerified?: boolean
  viewCount?: number
  maxThumbnails?: number
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  borderRadius: 20,
  padding: '4px 10px',
  fontSize: 11,
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

export function ImageGallery({
  images,
  alt = '',
  showOverlayBadges,
  isVerified,
  viewCount,
  maxThumbnails,
}: ImageGalleryProps) {
  const { t } = useTranslation('common')
  const primary = images.find((img) => img.isPrimary) ?? images[0]
  const [selected, setSelected] = useState(primary?.url ?? '')

  if (!images.length) {
    return (
      <div
        style={{
          aspectRatio: '4 / 3',
          background: 'var(--color-bg-surface)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        {t('noImage', 'No image')}
      </div>
    )
  }

  /* Determine visible thumbnails */
  const maxT = maxThumbnails ?? 0
  const hasOverflow = maxT > 0 && images.length > maxT
  const visibleThumbs = hasOverflow ? images.slice(0, maxT - 1) : images
  const overflowCount = hasOverflow ? images.length - (maxT - 1) : 0
  const overflowThumb = hasOverflow ? images[maxT - 1] : null

  return (
    <div>
      {/* Main image */}
      <div
        className="oio-image-zoom"
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--color-bg-surface)',
        }}
      >
        <Image
          src={selected}
          alt={alt}
          style={{
            width: '100%',
            maxHeight: 560,
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
          }}
          preview
        />

        {/* Overlay badges */}
        {showOverlayBadges && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {isVerified && (
              <span style={badgeStyle}>
                <CheckCircleFilled />
                {t('verified', 'Verified')}
              </span>
            )}
            {viewCount != null && viewCount > 0 && (
              <span style={badgeStyle}>
                <EyeOutlined />
                {viewCount.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Flex gap={8} wrap="wrap" style={{ marginTop: 12 }}>
          {visibleThumbs.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelected(img.url)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                border:
                  img.url === selected
                    ? '2px solid var(--color-accent)'
                    : '2px solid var(--color-border-light)',
                transition: 'border-color 200ms ease',
              }}
            >
              <img
                src={img.thumbnailUrl ?? img.url}
                alt={alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ))}

          {/* +N overflow thumbnail */}
          {overflowThumb && (
            <div
              onClick={() => setSelected(overflowThumb.url)}
              style={{
                position: 'relative',
                width: 72,
                height: 72,
                borderRadius: 6,
                overflow: 'hidden',
                cursor: 'pointer',
                border:
                  overflowThumb.url === selected
                    ? '2px solid var(--color-accent)'
                    : '2px solid var(--color-border-light)',
                transition: 'border-color 200ms ease',
              }}
            >
              <img
                src={overflowThumb.thumbnailUrl ?? overflowThumb.url}
                alt={alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                +{overflowCount}
              </div>
            </div>
          )}
        </Flex>
      )}
    </div>
  )
}
