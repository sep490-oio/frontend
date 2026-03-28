import { CameraOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface LiveCapturedBadgeProps {
  size?: 'small' | 'default'
}

export function LiveCapturedBadge({ size = 'small' }: LiveCapturedBadgeProps) {
  const { t } = useTranslation('common')
  const isSmall = size === 'small'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 100,
        padding: isSmall ? '1px 8px' : '2px 10px',
        fontFamily: "'Inter', sans-serif",
        fontSize: isSmall ? 10 : 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        background: 'rgba(74,124,89,0.12)',
        color: 'var(--color-success)',
        border: '1px solid rgba(74,124,89,0.25)',
      }}
    >
      <CameraOutlined style={{ fontSize: isSmall ? 10 : 12 }} />
      {t('liveCaptured', 'Live Captured')}
    </span>
  )
}
