import { useMemo, useState } from 'react'
import { Card, Spin, App, Row, Col, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useRoles, usePermissions, useTogglePermission } from '@/features/admin/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'
import {
  PERMISSION_CATEGORIES,
  type PermissionCategory,
  getPermissionCategory,
  permissionI18nPath,
} from '@/features/admin/utils/permissionMeta'
import { RolePermissionCard } from '@/features/admin/components/RolePermissionCard'

export default function AdminRolesPage() {
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const togglePermission = useTogglePermission()

  const [permSearch, setPermSearch] = useState('')

  const permissionNames = useMemo(() => permissionsData?.items ?? [], [permissionsData])

  // Filter perms by matching slug OR translated label OR description.
  // Falls back to raw slug match when i18n keys are missing.
  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase()
    if (!q) return permissionNames
    return permissionNames.filter((slug) => {
      if (slug.toLowerCase().includes(q)) return true
      const base = permissionI18nPath(slug)
      const label = t(`${base}.label`, slug).toLowerCase()
      const desc = t(`${base}.description`, '').toLowerCase()
      return label.includes(q) || desc.includes(q)
    })
  }, [permissionNames, permSearch, t])

  const permissionsByCategory = useMemo(() => {
    const map: Record<PermissionCategory, string[]> = {
      admin: [],
      me: [],
      items: [],
      auctions: [],
      warehouse: [],
      media: [],
      categories: [],
    }
    for (const slug of filteredPerms) {
      map[getPermissionCategory(slug)].push(slug)
    }
    // Stable alphabetical ordering within each category for readability.
    for (const cat of PERMISSION_CATEGORIES) {
      map[cat].sort()
    }
    return map
  }, [filteredPerms])

  const isLoading = rolesLoading || permissionsLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const roleList = roles ?? []

  const handleToggle = async (roleName: string, slug: string, currentlyActive: boolean) => {
    try {
      await togglePermission.mutateAsync({ role: roleName, permission: slug, isActive: !currentlyActive })
      message.success(t('roles.toggleSuccess', 'Permission updated successfully'))
    } catch {
      message.error(t('roles.toggleError', 'Failed to update permission'))
    }
  }

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <h1
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: isMobile ? 22 : 28,
          color: 'var(--color-text-primary)',
          margin: `0 0 ${isMobile ? 16 : 24}px`,
        }}
      >
        {t('roles.title', 'Roles & Permissions')}
      </h1>

      {permissionNames.length > 6 && (
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('roles.filterPermissions', 'Filter permissions...')}
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 16, maxWidth: 360 }}
        />
      )}

      {roleList.length === 0 ? (
        <Card>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('roles.noRoles', 'No roles found')}
          </span>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {roleList.map((role) => (
            <Col xs={24} lg={12} key={role.name}>
              <RolePermissionCard
                roleName={role.name}
                grantedPermissions={role.permissions}
                permissionsByCategory={permissionsByCategory}
                onToggle={(slug, currentlyActive) => handleToggle(role.name, slug, currentlyActive)}
                isMobile={isMobile}
                emptyText={
                  permSearch
                    ? t('roles.noMatches', 'No matching permissions')
                    : t('roles.noPermissions', 'No permissions defined')
                }
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
