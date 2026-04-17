import { useState } from 'react'
import { Card, Typography, Space, Button, Timeline, Row, Col, Image, Tag, Spin, Alert, message } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useSellerWarehouseItem } from '@/features/warehouse/api'
import { useConfirmInspectedCondition } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { CreateDisputeModal } from '@/features/order/components/CreateDisputeModal'

export default function SellerWarehouseItemDetailPage() {
  const { t } = useTranslation('warehouse')
  const { warehouseItemId = '' } = useParams<{ warehouseItemId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [msgApi, msgCtx] = message.useMessage()
  const { data, isLoading, error } = useSellerWarehouseItem(warehouseItemId)
  const confirmCondition = useConfirmInspectedCondition()
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeCaseType, setDisputeCaseType] = useState<string | undefined>()

  const handleConfirmCondition = () => {
    if (!data) return
    confirmCondition.mutate(data.itemId, {
      onSuccess: () => {
        msgApi.success(t('conditionConfirmedToast', 'Condition confirmed'))
        qc.invalidateQueries({ queryKey: ['warehouse'] })
      },
      onError: () => {
        msgApi.error(t('conditionConfirmFailed', 'Could not confirm condition'))
      },
    })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        message={t('itemNotFound', 'Warehouse item not found')}
        showIcon
        action={
          <Button onClick={() => navigate('/seller/warehouse/items')}>
            {t('backToList', 'Back to list')}
          </Button>
        }
      />
    )
  }

  const hasOutbound = !!data.outboundShipmentId
  const rawStatus = data.warehouseItemStatusRaw

  // Timeline entries (chronological, only real events).
  type Entry = { ts?: string; label: string }
  const entries: Entry[] = []

  if (data.receivedAt) {
    entries.push({ ts: data.receivedAt, label: t('timeline.received', 'Received at warehouse') })
  }
  if (rawStatus === 'stored' || rawStatus === 'inspected' || rawStatus === 'reserved' || rawStatus === 'dispatched') {
    entries.push({
      ts: data.updatedAt,
      label: data.storageLocationLabel
        ? t('storedOn', 'Stored on {{location}}', { location: data.storageLocationLabel })
        : t('timeline.stored', 'Stored'),
    })
  }
  if (!data.inspection && (rawStatus === 'stored' || rawStatus === 'received')) {
    entries.push({ label: t('timeline.awaitingInspection', 'Awaiting inspection') })
  }
  if (data.inspection?.decisionStatus === 'pending_review') {
    entries.push({ ts: data.inspection.inspectedAt, label: t('timeline.inspectionPending', 'Inspection pending review') })
  }
  if (data.inspection?.decisionStatus === 'approved' || data.inspection?.decisionStatus === 'condition_confirmed') {
    entries.push({ ts: data.inspection.inspectedAt, label: t('timeline.inspectionApproved', 'Inspection approved') })
  }
  if (data.inspection?.decisionStatus === 'rejected') {
    entries.push({ ts: data.inspection.inspectedAt, label: t('timeline.inspectionRejected', 'Inspection rejected') })
  }
  if (data.inspection?.decisionStatus === 'condition_confirmation_required') {
    entries.push({
      ts: data.inspection.inspectedAt,
      label: t('timeline.conditionConfirmation', 'Condition confirmation required'),
    })
  }
  if (hasOutbound) {
    entries.push({
      ts: data.updatedAt,
      label: t('timeline.outboundBooked', 'Outbound shipment booked'),
    })
  }
  if (data.outboundDispatchedAt) {
    entries.push({ ts: data.outboundDispatchedAt, label: t('timeline.dispatched', 'Dispatched to buyer') })
  }
  if (data.outboundDeliveredAt) {
    entries.push({ ts: data.outboundDeliveredAt, label: t('timeline.delivered', 'Delivered') })
  }

  const itemSummaryCard = (
    <Card>
      <Space align="start" size={16} style={{ width: '100%' }}>
        {data.itemImageUrl && (
          <Image
            src={data.itemImageUrl}
            alt={data.itemTitle ?? ''}
            width={96}
            height={96}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
        )}
        <div style={{ flex: 1 }}>
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            {data.itemTitle ?? t('untitledItem', 'Untitled item')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {data.itemId}
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/items/${data.itemId}`)}>
              {t('viewOriginalItem', 'View original item')} →
            </Button>
          </div>
        </div>
      </Space>
    </Card>
  )

  const warehouseStatusCard = (
    <Card title={t('warehouseStatus', 'Warehouse Status')}>
      <Space direction="vertical" size={8}>
        <StatusBadge status={data.warehouseFlowStatus} />
        <Typography.Text type="secondary">
          {data.storageLocationLabel
            ? t('storedOn', 'Stored on {{location}}', { location: data.storageLocationLabel })
            : t('noLocation', 'Not assigned to a storage location')}
        </Typography.Text>
      </Space>
    </Card>
  )

  const outboundCard = hasOutbound && (
    <Card title={t('outboundShipment', 'Outbound Shipment')}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {data.outboundStatus && <StatusBadge status={data.outboundStatus} />}
        {data.outboundCarrierTrackingNumber && (
          <Typography.Text>
            {t('trackingNumber', 'Tracking number')}: <Tag>{data.outboundCarrierTrackingNumber}</Tag>
          </Typography.Text>
        )}
        {data.outboundShippingLabelUrl && (
          <Button type="link" href={data.outboundShippingLabelUrl} target="_blank" style={{ padding: 0 }}>
            {t('viewShippingLabel', 'View shipping label')}
          </Button>
        )}
        <Button onClick={() => navigate(`/seller/warehouse/outbound/${data.outboundShipmentId}`)}>
          {t('warehouseItem.viewOutboundShipment', 'View outbound shipment')}
        </Button>
      </Space>
    </Card>
  )

  const timelineCard = (
    <Card title={t('warehouseProgress', 'Warehouse Progress')}>
      <Timeline
        items={entries.map((e) => ({
          children: (
            <Space direction="vertical" size={0}>
              <Typography.Text>{e.label}</Typography.Text>
              {e.ts && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(e.ts)}
                </Typography.Text>
              )}
            </Space>
          ),
        }))}
      />
    </Card>
  )

  const inboundCard = data.inboundPackageCode && (
    <Card title={t('inboundPackage', 'Inbound Package')}>
      <Space direction="vertical" size={8}>
        <Typography.Text strong>{data.inboundPackageCode}</Typography.Text>
        <Button
          onClick={() =>
            navigate(`/seller/warehouse/inbound/packages/${encodeURIComponent(data.inboundPackageCode!)}`)
          }
        >
          {t('viewPackage', 'View package')}
        </Button>
      </Space>
    </Card>
  )

  const insp = data.inspection ?? null

  const inspectionCard = insp ? (
    <Card title={t('inspection', 'Inspection')}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <StatusBadge status={insp.decisionStatus} />

        {/* Timeline */}
        <Timeline
          items={[
            insp.inspectedAt
              ? {
                  children: (
                    <Space direction="vertical" size={0}>
                      <Typography.Text>
                        {t('inspected', 'Inspected')}
                        {insp.inspectorDisplayName ? ` — ${insp.inspectorDisplayName}` : ''}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(insp.inspectedAt)}
                      </Typography.Text>
                    </Space>
                  ),
                }
              : null,
            insp.reviewedAt
              ? {
                  children: (
                    <Space direction="vertical" size={0}>
                      <Typography.Text>
                        {t('reviewed', 'Reviewed')}
                        {insp.reviewerDisplayName ? ` — ${insp.reviewerDisplayName}` : ''}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(insp.reviewedAt)}
                      </Typography.Text>
                    </Space>
                  ),
                }
              : null,
            insp.sellerConfirmedAt
              ? {
                  children: (
                    <Space direction="vertical" size={0}>
                      <Typography.Text>{t('sellerConfirmed', 'Seller confirmed')}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(insp.sellerConfirmedAt)}
                      </Typography.Text>
                    </Space>
                  ),
                }
              : null,
          ].filter((x): x is NonNullable<typeof x> => x !== null)}
        />

        {/* Condition comparison */}
        {insp.declaredCondition && insp.conditionOnArrival && (
          insp.declaredCondition !== insp.conditionOnArrival ? (
            <Alert
              type="warning"
              showIcon
              message={t('conditionDiscrepancy', 'Condition discrepancy')}
              description={
                <Space size={8} wrap>
                  <span>{t('declared', 'Declared')}: <StatusBadge status={insp.declaredCondition} /></span>
                  <span>{t('actual', 'Actual')}: <StatusBadge status={insp.conditionOnArrival} /></span>
                </Space>
              }
            />
          ) : (
            <Space size={8} wrap>
              <span>{t('declared', 'Declared')}: <StatusBadge status={insp.declaredCondition} /></span>
              <span>{t('actual', 'Actual')}: <StatusBadge status={insp.conditionOnArrival} /></span>
            </Space>
          )
        )}

        {/* Decision reason */}
        {insp.decisionReason && (insp.decisionStatus === 'rejected' || insp.decisionStatus === 'condition_confirmation_required') && (
          <Alert
            type={insp.decisionStatus === 'rejected' ? 'error' : 'warning'}
            showIcon
            message={insp.decisionReason}
          />
        )}

        {/* Inspection notes */}
        {insp.inspectionNotes && (
          <Typography.Paragraph style={{ marginBottom: 0 }}>{insp.inspectionNotes}</Typography.Paragraph>
        )}

        {/* Evidence gallery */}
        {insp.evidence.filter((e) => e.secureUrl).length > 0 ? (
          <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {t('evidencePhotos', 'Evidence photos')}
            </Typography.Text>
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {insp.evidence.filter((e) => e.secureUrl).map((p, i) => (
                  <Image
                    key={i}
                    src={p.secureUrl}
                    alt={p.fileName ?? ''}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          </div>
        ) : (
          <Typography.Text type="secondary">{t('noInspectionPhotos', 'No inspection photos.')}</Typography.Text>
        )}
      </Space>
    </Card>
  ) : null

  const mediaCard = data.receiptMedia.length > 0 && (
    <Card title={t('receivingMedia', 'Receiving Media')}>
      <Row gutter={[12, 12]}>
        {data.receiptMedia.map((m) => (
          <Col key={m.id} xs={12} sm={8} md={6}>
            <Image src={m.url} alt="" style={{ objectFit: 'cover', borderRadius: 6 }} />
          </Col>
        ))}
      </Row>
    </Card>
  )

  const confirmConditionCard = data.canConfirmInspectedCondition ? (
    <Card style={{ borderColor: 'var(--color-accent)' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('confirmConditionTitle', 'Confirm inspected condition')}
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {t(
            'confirmConditionBody',
            'Our inspectors found a discrepancy with the declared condition. Please review the inspection below and confirm to proceed, or contact support to dispute.',
          )}
        </Typography.Paragraph>
        <Space wrap>
          <Button
            type="primary"
            loading={confirmCondition.isPending}
            onClick={handleConfirmCondition}
          >
            {t('confirmConditionCta', 'Confirm condition')}
          </Button>
          <Button
            danger
            icon={<WarningOutlined />}
            onClick={() => {
              setDisputeCaseType('inspection_disagreement')
              setDisputeModalOpen(true)
            }}
          >
            {t('disputeInspection', 'Dispute inspection result')}
          </Button>
        </Space>
      </Space>
    </Card>
  ) : null

  const rejectionDisputeCard = insp?.decisionStatus === 'rejected' ? (
    <Card style={{ borderColor: '#ff4d4f' }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('rejectionDisputeTitle', 'Item rejected by inspection')}
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {t(
            'rejectionDisputeBody',
            'If you believe this rejection is incorrect, you can dispute the decision.',
          )}
        </Typography.Paragraph>
        <Button
          danger
          icon={<WarningOutlined />}
          onClick={() => {
            setDisputeCaseType('condition_mismatch')
            setDisputeModalOpen(true)
          }}
        >
          {t('disputeRejection', 'Dispute rejection')}
        </Button>
      </Space>
    </Card>
  ) : null

  return (
    <div>
      {msgCtx}
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => navigate('/seller/warehouse/items')}>
          {t('backToList', '← Back to list')}
        </Button>
      </Space>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {confirmConditionCard}
        {rejectionDisputeCard}
        {itemSummaryCard}
        {hasOutbound ? outboundCard : null}
        {warehouseStatusCard}
        {timelineCard}
        {inboundCard}
        {inspectionCard}
        {mediaCard}
      </Space>

      <CreateDisputeModal
        targetType="warehouse_item"
        targetId={warehouseItemId}
        open={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        prefillDomain="warehouse_item"
        prefillCaseType={disputeCaseType}
      />
    </div>
  )
}
