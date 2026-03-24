import { useState } from 'react'
import { Image, Flex } from 'antd'

interface GalleryImage {
  url: string
  thumbnailUrl?: string
  isPrimary?: boolean
}

interface ImageGalleryProps {
  images: GalleryImage[]
  alt?: string
}

export function ImageGallery({ images, alt = '' }: ImageGalleryProps) {
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
        No image
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="oio-image-zoom"
        style={{
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
          }}
          preview
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Flex gap={8} wrap="wrap" style={{ marginTop: 12 }}>
          {images.map((img, idx) => (
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
        </Flex>
      )}
    </div>
  )
}
