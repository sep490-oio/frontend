import { Alert, Button, Space } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

interface AdminErrorStateProps {
  message?: string
  description?: string
  onRetry?: () => void
  backPath?: string
}

export function AdminErrorState({
  message = 'Error loading data',
  description = 'Something went wrong. Please try again or go back.',
  onRetry,
  backPath,
}: AdminErrorStateProps) {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <Alert
        type="error"
        showIcon
        message={message}
        description={description}
        style={{ marginBottom: 16 }}
      />
      <Space>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => { backPath ? navigate(backPath) : navigate(-1); }}
        >
          Back
        </Button>
        {onRetry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </Space>
    </div>
  )
}
