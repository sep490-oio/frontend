import { Card, Space, Typography, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  PERMISSION_CATEGORIES,
  type PermissionCategory,
  categoryI18nKey,
} from '@/features/admin/utils/permissionMeta'
import { PermissionRow } from './PermissionRow'

interface RolePermissionCardProps {
  roleName: string
  grantedPermissions: string[]
  permissionsByCategory: Record<PermissionCategory, string[]>
  onToggle: (slug: string, currentlyActive: boolean) => void
  isMobile: boolean
  emptyText: string
}

export function RolePermissionCard({
  roleName,
  grantedPermissions,
  permissionsByCategory,
  onToggle,
  isMobile,
  emptyText,
}: RolePermissionCardProps) {
  const { t } = useTranslation('admin')

  const totalVisible = PERMISSION_CATEGORIES.reduce(
    (sum, cat) => sum + (permissionsByCategory[cat]?.length ?? 0),
    0,
  )
  const grantedVisible = PERMISSION_CATEGORIES.reduce((sum, cat) => {
    const perms = permissionsByCategory[cat] ?? []
    return sum + perms.filter((p) => grantedPermissions.includes(p)).length
  }, 0)

  return (
    <Card
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, textTransform: 'capitalize' }}>
            {roleName}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            {t('roles.grantedCount', {
              granted: grantedVisible,
              total: totalVisible,
              defaultValue: `${grantedVisible}/${totalVisible} granted`,
            })}
          </span>
        </div>
      }
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: isMobile ? '12px 16px' : '16px 24px' } }}
    >
      {totalVisible === 0 ? (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{emptyText}</span>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 8 : 12}>
          {PERMISSION_CATEGORIES.map((category, idx) => {
            const perms = permissionsByCategory[category] ?? []
            if (perms.length === 0) return null
            return (
              <div key={category}>
                {idx > 0 && <Divider style={{ margin: '8px 0' }} />}
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {t(categoryI18nKey(category), category)}
                </Typography.Text>
                <Space direction="vertical" style={{ width: '100%' }} size={2}>
                  {perms.map((slug) => (
                    <PermissionRow
                      key={slug}
                      slug={slug}
                      checked={grantedPermissions.includes(slug)}
                      onToggle={onToggle}
                      isMobile={isMobile}
                    />
                  ))}
                </Space>
              </div>
            )
          })}
        </Space>
      )}
    </Card>
  )
}
