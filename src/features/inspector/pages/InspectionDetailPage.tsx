import { useState } from 'react'
import {
  Typography,
  Card,
  Descriptions,
  Select,
  Input,
  Button,
  Upload,
  Space,
  Spin,
  Result,
  message,
  Image,
} from 'antd'
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router'
import { useInboundShipmentById } from '@/features/warehouse/api'
import { useInspectItem } from '@/features/inspector/api'
import type { WarehouseInspectionDto } from '@/features/inspector/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { UploadFile } from 'antd'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
]

export default function InspectionDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()
  const { data: shipment, isLoading, isError } = useInboundShipmentById(shipmentId ?? '')
  const inspectMutation = useInspectItem()
  const mediaUpload = useMediaUpload('item_inspection')

  const [condition, setCondition] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [inspectionResult, setInspectionResult] = useState<WarehouseInspectionDto | null>(null)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <Result
        status="404"
        title="Shipment Not Found"
        subTitle="The inbound shipment could not be found."
        extra={
          <Button onClick={() => navigate('/inspector/queue')}>Back to Queue</Button>
        }
      />
    )
  }

  const handleUpload = async (file: File) => {
    try {
      const media = await mediaUpload.upload(file)
      setUploadedMediaIds((prev) => [...prev, media.mediaUploadId])
      setFileList((prev) => [
        ...prev,
        {
          uid: media.mediaUploadId,
          name: file.name,
          status: 'done',
          url: media.secureUrl,
        },
      ])
    } catch {
      message.error('Failed to upload photo')
    }
  }

  const handleSubmit = async () => {
    if (!condition) {
      message.warning('Please select a condition')
      return
    }
    if (!shipmentId) return

    try {
      const result = await inspectMutation.mutateAsync({
        shipmentId,
        conditionOnArrival: condition,
        inspectionNotes: notes || undefined,
        evidenceMediaIds: uploadedMediaIds.length > 0 ? uploadedMediaIds : undefined,
      })
      setInspectionResult(result)
      message.success('Inspection submitted successfully')
    } catch {
      message.error('Failed to submit inspection')
    }
  }

  if (inspectionResult) {
    return (
      <div>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#4A7C59' }} />}
          title="Inspection Completed"
          subTitle={`Condition: ${inspectionResult.conditionOnArrival} | Decision: ${inspectionResult.decisionStatus}`}
          extra={[
            <Button
              key="queue"
              type="primary"
              onClick={() => navigate('/inspector/queue')}
              style={{ background: '#8B7355', borderColor: '#8B7355' }}
            >
              Back to Queue
            </Button>,
            <Button key="dashboard" onClick={() => navigate('/inspector')}>
              Dashboard
            </Button>,
          ]}
        />
        {inspectionResult.evidence.length > 0 && (
          <Card title="Uploaded Evidence" style={{ maxWidth: 600, margin: '0 auto' }}>
            <Image.PreviewGroup>
              <Space wrap>
                {inspectionResult.evidence.map((e) => (
                  <Image key={e.id} src={e.url} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} />
                ))}
              </Space>
            </Image.PreviewGroup>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: '#1A1A1A' }}
      >
        Inspect Shipment
      </Typography.Title>

      {/* Shipment info */}
      <Card title="Shipment Information" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Shipment ID">{shipment.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <StatusBadge status={shipment.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Item ID">{shipment.itemId}</Descriptions.Item>
          <Descriptions.Item label="Provider">{shipment.providerCode}</Descriptions.Item>
          <Descriptions.Item label="Sender">{shipment.senderName}</Descriptions.Item>
          <Descriptions.Item label="Phone">{shipment.senderPhone}</Descriptions.Item>
          <Descriptions.Item label="Weight">{shipment.weightGrams}g</Descriptions.Item>
          <Descriptions.Item label="Arrived">
            {shipment.arrivedAt ? formatDateTime(shipment.arrivedAt) : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">{formatDateTime(shipment.createdAt)}</Descriptions.Item>
          {shipment.notes && (
            <Descriptions.Item label="Notes" span={2}>{shipment.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Inspection form */}
      <Card title="Inspection Form">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Condition on Arrival *
            </Typography.Text>
            <Select
              value={condition || undefined}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
              placeholder="Select condition"
              style={{ width: '100%', maxWidth: 400 }}
              size="large"
            />
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Inspection Notes
            </Typography.Text>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the item condition, packaging, etc."
              rows={4}
              style={{ maxWidth: 600 }}
            />
          </div>

          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Photos
            </Typography.Text>
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                void handleUpload(file)
                return false
              }}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
                setUploadedMediaIds((prev) => prev.filter((id) => id !== file.uid))
              }}
              listType="picture-card"
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
            {mediaUpload.uploading && <Spin size="small" style={{ marginLeft: 8 }} />}
          </div>

          <div>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={inspectMutation.isPending}
              style={{ background: '#8B7355', borderColor: '#8B7355' }}
            >
              Submit Inspection
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  )
}
