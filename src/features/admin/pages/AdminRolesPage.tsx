import { Card, Checkbox, Spin, Space, App, Row, Col, Typography, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoles, usePermissions, useTogglePermission } from '@/features/admin/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

export default function AdminRolesPage() {
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const togglePermission = useTogglePermission()

  // Permission search filter (helpful on mobile where lists are long)
  const [permSearch, setPermSearch] = useState('')

  const isLoading = rolesLoading || permissionsLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const roleList = roles ?? []
  const permissionNames = permissionsData?.items ?? []
  const filteredPerms = permSearch.trim()
    ? permissionNames.filter((p) => p.toLowerCase().includes(permSearch.toLowerCase()))
    : permissionNames

  const handleToggle = async (roleName: string, permissionName: string, currentlyActive: boolean) => {
    try {
      await togglePermission.mutateAsync({ role: roleName, permission: permissionName, isActive: !currentlyActive })
      message.success('Permission updated')
    } catch {
      message.error('Failed to update permission')
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

      {/* Permission search — useful on mobile to find a specific perm quickly */}
      {permissionNames.length > 6 && (
        <Input
          prefix={<SearchOutlined />}
          placeholder="Filter permissions..."
          value={permSearch}
          onChange={(e) => setPermSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 16, maxWidth: 320 }}
        />
      )}

      {roleList.length === 0 ? (
        <Card>
          <span style={{ color: 'var(--color-text-secondary)' }}>No roles found</span>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {roleList.map((role) => {
            const matchingPerms = filteredPerms
            const grantedCount = role.permissions.filter((p) => filteredPerms.includes(p)).length

            return (
              <Col xs={24} lg={12} key={role.name}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, textTransform: 'capitalize' }}>
                        {role.name}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                        {grantedCount}/{matchingPerms.length} granted
                      </span>
                    </div>
                  }
                  style={{ borderRadius: 12 }}
                  styles={{ body: { padding: isMobile ? '12px 16px' : '16px 24px' } }}
                >
                  {matchingPerms.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 2 : 4}>
                      {matchingPerms.map((perm) => {
                        const hasPermission = role.permissions.includes(perm)
                        return (
                          <div
                            key={perm}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              minHeight: isMobile ? 40 : 28,
                              borderRadius: 6,
                              padding: isMobile ? '4px 0' : '2px 0',
                            }}
                          >
                            <Checkbox
                              checked={hasPermission}
                              onChange={() => handleToggle(role.name, perm, hasPermission)}
                              style={{ fontSize: 13, width: '100%' }}
                            >
                              <Typography.Text
                                style={{
                                  fontFamily: MONO_FONT,
                                  fontSize: isMobile ? 11 : 12,
                                  color: hasPermission ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {perm}
                              </Typography.Text>
                            </Checkbox>
                          </div>
                        )
                      })}
                    </Space>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {permSearch ? 'No matching permissions' : 'No permissions defined'}
                    </span>
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}