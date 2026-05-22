import { Timeline, Spin, Empty, Typography, Space } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { useAdminItemLogistics } from '@/features/admin/api'
import { formatDateTime, formatEnumText } from '@/utils/format'

const { Text } = Typography

interface AdminItemLogisticsTabProps {
  itemId: string
}

export default function AdminItemLogisticsTab({ itemId }: AdminItemLogisticsTabProps) {
  const { data: logisticsEvents, isLoading } = useAdminItemLogistics(itemId)

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
  }

  if (!logisticsEvents || logisticsEvents.length === 0) {
    return <Empty description="No logistics records found" />
  }

  return (
    <Timeline
      items={logisticsEvents.map((event: any) => {
        let color = 'blue'
        let icon = <ClockCircleOutlined />

        if (event.eventType?.includes('DELIVERED') || event.eventType?.includes('STORED')) {
          color = 'green'
          icon = <CheckCircleOutlined />
        } else if (event.eventType?.includes('TRANSIT') || event.eventType?.includes('SHIPPED')) {
          color = 'blue'
          icon = <SyncOutlined spin />
        }

        const mapDescription = (desc: string) => {
          if (!desc) return desc
          if (desc === 'awaiting_seller_return') return 'Awaiting Seller Return (Chờ hoàn trả Seller)'
          if (desc === 'inspected') return 'Inspected & Inbound (Đã nhập kho & Kiểm định)'
          if (desc === 'awaiting_pickup') return 'Awaiting Pickup'
          if (desc === 'in_transit') return 'In Transit'
          if (desc === 'seller_claims_arrived') return 'Seller Claims Arrived'
          if (desc === 'arrived') return 'Arrived at Warehouse'
          return formatEnumText(desc)
        }

        return {
          color,
          dot: icon,
          children: (
            <div style={{ paddingBottom: 16 }}>
              <div style={{ marginBottom: 4 }}>
                <Text strong>{mapDescription(event.description)}</Text>
              </div>
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {formatDateTime(event.timestamp)}
                </Text>
                {event.location && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Location: {event.location}
                  </Text>
                )}
                {event.carrier && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Carrier: {event.carrier} {event.trackingCode && `(${event.trackingCode})`}
                  </Text>
                )}
              </Space>
            </div>
          )
        }
      })}
    />
  )
}
