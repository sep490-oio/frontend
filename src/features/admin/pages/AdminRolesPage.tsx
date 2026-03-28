import { Card, Checkbox, Spin, Space, App, Row, Col } from 'antd'
import { useRoles, usePermissions, useTogglePermission } from '@/features/admin/api'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function AdminRolesPage() {
  const { message } = App.useApp()

  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const togglePermission = useTogglePermission()

  const isLoading = rolesLoading || permissionsLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  // roles is an array from extractArray, permissions is PagedList<string>
  const roleList = roles ?? []
  const permissionNames = permissionsData?.items ?? []

  const handleToggle = async (roleName: string, permissionName: string, currentlyActive: boolean) => {
    try {
      await togglePermission.mutateAsync({ role: roleName, permission: permissionName, isActive: !currentlyActive })
      message.success('Permission updated')
    } catch {
      message.error('Failed to update permission')
    }
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: 28,
          color: 'var(--color-text-primary)',
          margin: '0 0 24px',
        }}
      >
        Roles & Permissions
      </h1>

      {roleList.length === 0 ? (
        <Card>
          <span style={{ color: 'var(--color-text-secondary)' }}>No roles found</span>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {roleList.map((role) => (
            <Col xs={24} lg={12} key={role.name}>
              <Card
                title={
                  <span style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>
                    {role.name}
                  </span>
                }
                extra={
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {role.permissions.length} permissions
                  </span>
                }
              >
                {permissionNames.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    {permissionNames.map((perm) => {
                      const hasPermission = role.permissions.includes(perm)
                      return (
                        <Checkbox
                          key={perm}
                          checked={hasPermission}
                          onChange={() => handleToggle(role.name, perm, hasPermission)}
                          style={{ fontSize: 13 }}
                        >
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                            {perm}
                          </span>
                        </Checkbox>
                      )
                    })}
                  </Space>
                ) : (
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    No permissions defined
                  </span>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
