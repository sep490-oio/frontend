import { Typography, Card, Row, Col, Statistic, Button, Space, Spin, List, Alert } from 'antd'
import {
  SearchOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useInspectionQueue, useStorageLocations } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function InspectorDashboardPage() {
  const navigate = useNavigate()

  const { data: queue, isLoading: queueLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 5,
    status: 'pending',
  })
  const { data: completedToday, isLoading: completedLoading } = useInspectionQueue({
    pageNumber: 1,
    pageSize: 1,
    status: 'completed',
  })
  const { data: locations, isLoading: locationsLoading } = useStorageLocations()

  const isLoading = queueLoading || completedLoading || locationsLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const occupiedCount = locations?.filter((l) => l.isOccupied).length ?? 0
  const totalLocations = locations?.length ?? 0

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: '#1A1A1A' }}
      >
        Inspector Dashboard
      </Typography.Title>

      {/* Stats overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Inspections"
              value={queue?.metadata?.totalCount ?? 0}
              prefix={<SearchOutlined />}
              valueStyle={
                (queue?.metadata?.totalCount ?? 0) > 0 ? { color: '#8B7355' } : undefined
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Completed Today"
              value={completedToday?.metadata?.totalCount ?? 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#4A7C59' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Storage Occupancy"
              value={totalLocations > 0 ? Math.round((occupiedCount / totalLocations) * 100) : 0}
              suffix={`% (${occupiedCount}/${totalLocations})`}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick actions */}
      <Card title="Quick Actions" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate('/inspector/queue')}
            style={{ background: '#8B7355', borderColor: '#8B7355' }}
          >
            View Queue
          </Button>
          <Button
            icon={<DatabaseOutlined />}
            onClick={() => navigate('/inspector/storage')}
          >
            Manage Storage
          </Button>
        </Space>
      </Card>

      {/* Recent inspections */}
      <Card
        title="Recent Queue Items"
        extra={
          <Button type="link" onClick={() => navigate('/inspector/queue')}>
            View All
          </Button>
        }
      >
        {queue?.items?.length ? (
          <List
            dataSource={queue.items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="inspect"
                    type="link"
                    onClick={() => navigate(`/inspector/inspections/${item.id}`)}
                    style={{ color: '#8B7355' }}
                  >
                    Inspect
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={item.itemTitle}
                  description={`${item.sellerName} - ${formatDateTime(item.arrivedAt)}`}
                />
                <StatusBadge status={item.status} />
              </List.Item>
            )}
          />
        ) : (
          <Alert message="No pending inspections" type="info" showIcon />
        )}
      </Card>
    </div>
  )
}
