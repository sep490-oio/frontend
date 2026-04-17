import { Checkbox, Tooltip, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { permissionI18nPath } from '@/features/admin/utils/permissionMeta'
import { MONO_FONT } from '@/styles/tokens'

interface PermissionRowProps {
  slug: string
  checked: boolean
  onToggle: (slug: string, currentlyActive: boolean) => void
  isMobile: boolean
}

export function PermissionRow({ slug, checked, onToggle, isMobile }: PermissionRowProps) {
  const { t } = useTranslation('admin')
  const base = permissionI18nPath(slug)
  const label = t(`${base}.label`, slug)
  const description = t(`${base}.description`, '')

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        minHeight: isMobile ? 44 : 32,
        padding: isMobile ? '6px 0' : '4px 0',
      }}
    >
      <Checkbox
        checked={checked}
        onChange={() => onToggle(slug, checked)}
        style={{ width: '100%', alignItems: 'flex-start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tooltip title={<span style={{ fontFamily: MONO_FONT, fontSize: 11 }}>{slug}</span>} placement="topLeft">
            <Typography.Text
              strong
              style={{
                fontSize: isMobile ? 13 : 14,
                color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {label}
            </Typography.Text>
          </Tooltip>
          {description ? (
            <Typography.Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
              {description}
            </Typography.Text>
          ) : null}
        </div>
      </Checkbox>
    </div>
  )
}
