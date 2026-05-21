import { useState, useEffect } from 'react'
import { Typography, Card, Button, Space, Switch, InputNumber, Input, App, Select, Modal, Alert, Row, Col, Tabs, Divider, DatePicker, Form } from 'antd'
import { ThunderboltOutlined, SwapOutlined, PoweroffOutlined, RedoOutlined, StopOutlined, ClockCircleOutlined, ForwardOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useFlagAuction, useAdminForceCancelAuction, useAdminTerminateAuction, useAdminExtendAuctionTime, useAdminOverrideAuctionStatus, useAdminForceEndAuction, useAdminRelistAuction, useAdminForceStartQualification, useAdminForceStartBidding } from '@/features/admin/api'

export function ActiveAuctionControls({ auction, refetch }: { auction: any, refetch: () => void }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const id = auction.id

  const setCuration = useSetCuration()
  const triggerEmergency = useTriggerEmergency()
  const resolveEmergency = useResolveEmergency()
  const flagAuction = useFlagAuction()
  const forceCancelAuction = useAdminForceCancelAuction()
  const terminateAuction = useAdminTerminateAuction()
  const extendAuctionTime = useAdminExtendAuctionTime()
  const overrideAuctionStatus = useAdminOverrideAuctionStatus()
  const forceEndAuction = useAdminForceEndAuction()
  const relistAuction = useAdminRelistAuction()
  const forceStartQualification = useAdminForceStartQualification()
  const forceStartBidding = useAdminForceStartBidding()

  // Form Instances
  const [curationForm] = Form.useForm()
  const [extendForm] = Form.useForm()
  const [flagForm] = Form.useForm()
  const [triggerEmForm] = Form.useForm()
  const [resolveEmForm] = Form.useForm()
  const [overrideForm] = Form.useForm()
  const [relistForm] = Form.useForm()

  // Modals state
  const [lifecycleModal, setLifecycleModal] = useState<'forceCancel' | 'terminate' | 'forceEnd' | null>(null)
  const [lifecycleReason, setLifecycleReason] = useState('')
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [relistModalOpen, setRelistModalOpen] = useState(false)

  // Initialization
  useEffect(() => {
    if (auction) {
      curationForm.setFieldsValue({
        featured: auction.isFeatured ?? false,
        priority: auction.priority ?? 0,
      })
    }
  }, [auction, curationForm])

  useEffect(() => {
    extendForm.setFieldsValue({ extendMinutes: 30 })
  }, [extendForm])

  // Handlers
  const handleSaveCuration = async (values: any) => {
    try {
      await setCuration.mutateAsync({ auctionId: id!, isFeatured: values.featured, priority: values.priority })
      message.success(t('auctionControl.curationSuccess', 'Curation saved'))
    } catch { message.error(t('common.error')) }
  }

  const handleTriggerEmergency = async (values: any) => {
    let parsedPayload: unknown = undefined
    if (values.payload) {
      try { parsedPayload = JSON.parse(values.payload) }
      catch { return message.error(t('auctionControl.invalidJsonPayload', 'Payload is not valid JSON')) }
    }
    try {
      await triggerEmergency.mutateAsync({
        auctionId: id!,
        reason: values.reason,
        triggerSource: values.triggerSource,
        payload: parsedPayload as object,
      })
      message.success(t('auctionControl.emergencySuccess', 'Emergency triggered'))
      triggerEmForm.resetFields()
    } catch { message.error(t('common.error')) }
  }

  const handleFlagAuction = async (values: any) => {
    try {
      await flagAuction.mutateAsync({
        auctionId: id!,
        alertType: values.alertType,
        severity: values.severity,
        payload: { detail: values.payload },
      })
      message.success(t('auctionControl.flagSuccess', 'Auction flagged successfully'))
      flagForm.resetFields()
    } catch { message.error(t('common.error')) }
  }

  const handleResolveEmergency = async (values: any) => {
    try {
      await resolveEmergency.mutateAsync({
        auctionId: id!,
        emergencyId: values.emergencyId,
        status: values.status,
        payload: values.payload ? { detail: values.payload } : {},
      })
      message.success(t('auctionControl.resolveEmergencySuccess', 'Emergency resolved successfully'))
      resolveEmForm.resetFields()
    } catch { message.error(t('common.error')) }
  }

  const handleLifecycleAction = async () => {
    if (!lifecycleModal || !lifecycleReason.trim()) return
    try {
      const payload = { auctionId: id!, reason: lifecycleReason.trim() }
      if (lifecycleModal === 'forceCancel') await forceCancelAuction.mutateAsync(payload)
      else if (lifecycleModal === 'terminate') await terminateAuction.mutateAsync(payload)
      else if (lifecycleModal === 'forceEnd') await forceEndAuction.mutateAsync(payload)
      message.success(t('auctionControl.lifecycleSuccess', 'Action completed successfully'))
      setLifecycleModal(null)
      setLifecycleReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleExtendTime = async (values: any) => {
    try {
      await extendAuctionTime.mutateAsync({ auctionId: id!, extensionMinutes: values.extendMinutes, reason: values.extendReason })
      message.success(t('auctionControl.extendSuccess', 'Auction time extended'))
      extendForm.resetFields(['extendReason']) // keep the minutes
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleOverrideStatus = async (values: any) => {
    try {
      await overrideAuctionStatus.mutateAsync({ auctionId: id!, newStatus: values.overrideStatus, reason: values.overrideReason })
      message.success(t('auctionControl.overrideSuccess', 'Status overridden'))
      overrideForm.resetFields()
      setOverrideModalOpen(false)
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleRelist = async (values: any) => {
    try {
      await relistAuction.mutateAsync({
        auctionId: id!,
        qualificationStartAt: values.relistQualStart.toISOString(),
        qualificationEndAt: values.relistQualEnd.toISOString(),
        startAt: values.relistStart.toISOString(),
        endAt: values.relistEnd.toISOString(),
        reason: values.relistReason || undefined,
      })
      message.success(t('auctionControl.relistSuccess', 'Auction relisted'))
      setRelistModalOpen(false)
      relistForm.resetFields()
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const lifecycleLoading = forceCancelAuction.isPending || terminateAuction.isPending || forceEndAuction.isPending

  return (
    <div style={{ width: '100%' }}>
      <Tabs
        type="card"
        items={[
          {
            key: 'display',
            label: t('auctionControl.tabDisplayExtend', 'Display & Extend'),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Curation controls */}
                    <Card title={t('auctionControl.curation', 'Curation Configuration')} style={{ borderRadius: 12 }}>
                      <Form form={curationForm} layout="vertical" onFinish={handleSaveCuration}>
                        <Form.Item name="featured" label={t('auctionControl.featured', 'Featured')} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <Form.Item 
                          name="priority" 
                          label={t('auctionControl.priority', 'Priority')} 
                          tooltip={t('auctionControl.priorityTooltip', 'Higher values will be displayed more prominently')}
                        >
                          <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={setCuration.isPending} block={isMobile}>
                          {t('auctionControl.saveCuration', 'Save Configuration')}
                        </Button>
                      </Form>
                    </Card>

                    {/* State Progression */}
                    {auction.status === 'scheduled' && (
                      <Card title={<><ForwardOutlined /> {t('auctionControl.lifecycleProgression', 'Lifecycle Progression')}</>} style={{ borderRadius: 12 }}>
                        <Space wrap size={12}>
                          <Button
                            style={{ borderColor: '#13c2c2', color: '#13c2c2' }}
                            onClick={() => {
                              Modal.confirm({
                                title: t('auctionControl.forceStartQualTitle', 'Force Start Qualification'),
                                content: t('auctionControl.forceStartQualContent', 'Are you sure you want to force start the qualification window NOW?'),
                                onOk: async () => {
                                  try {
                                    await forceStartQualification.mutateAsync({ auctionId: id! })
                                    message.success(t('auctionControl.forceStartQualSuccess', 'Qualification window started successfully'))
                                    refetch()
                                  } catch { message.error(t('common.error')) }
                                }
                              })
                            }}
                            loading={forceStartQualification.isPending}
                          >
                            {t('auctionControl.forceStartQualBtn', 'Force Start Qual')}
                          </Button>
                          <Button
                            type="primary"
                            style={{ backgroundColor: '#1890ff' }}
                            onClick={() => {
                              Modal.confirm({
                                title: t('auctionControl.forceStartBiddingTitle', 'Force Start Bidding'),
                                content: t('auctionControl.forceStartBiddingContent', 'Are you sure you want to force start the bidding phase NOW?'),
                                onOk: async () => {
                                  try {
                                    await forceStartBidding.mutateAsync({ auctionId: id! })
                                    message.success(t('auctionControl.forceStartBiddingSuccess', 'Bidding started successfully'))
                                    refetch()
                                  } catch { message.error(t('common.error')) }
                                }
                              })
                            }}
                            loading={forceStartBidding.isPending}
                          >
                            {t('auctionControl.forceStartBiddingBtn', 'Force Start Bidding')}
                          </Button>
                        </Space>
                      </Card>
                    )}
                  </Space>
                </Col>

                <Col xs={24} lg={12}>
                  {/* Extend Time */}
                  <Card title={<><ClockCircleOutlined /> {t('auctionControl.extendAuctionTime', 'Extend Auction Time')}</>} style={{ borderRadius: 12 }}>
                    <Form form={extendForm} layout="vertical" onFinish={handleExtendTime}>
                      <Form.Item name="extendMinutes" label={t('auctionControl.extensionMinutes', 'Extension (minutes)')} rules={[{ required: true }]}>
                        <InputNumber min={1} max={1440} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="extendReason" label={t('auctionControl.reason', 'Reason')} rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder={t('auctionControl.extendReasonPlaceholder', 'Reason for extending...')} />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" loading={extendAuctionTime.isPending} block={isMobile}>
                        {t('auctionControl.extendTimeBtn', 'Extend Time')}
                      </Button>
                    </Form>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'moderation',
            label: t('auctionControl.tabModeration', 'Moderation & Emergency'),
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  {/* Flag Auction section */}
                  <Card title={t('auctionControl.flagAuction', 'Flag Auction')} style={{ borderRadius: 12 }}>
                    <Form form={flagForm} layout="vertical" onFinish={handleFlagAuction}>
                      <Form.Item name="alertType" label={t('auctionControl.alertType', 'Alert Type')} rules={[{ required: true }]}>
                        <Select
                          placeholder={t('auctionControl.selectAlertType', 'Select alert type')}
                          options={[
                            { value: 'fraud', label: t('auctionControl.alertTypeOption.fraud', 'Fraud') },
                            { value: 'suspicious', label: t('auctionControl.alertTypeOption.suspicious', 'Suspicious') },
                            { value: 'collusion', label: t('auctionControl.alertTypeOption.collusion', 'Collusion') },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="severity" label={t('auctionControl.severity', 'Severity')} rules={[{ required: true }]}>
                        <Select
                          placeholder={t('auctionControl.selectSeverity', 'Select severity')}
                          options={[
                            { value: 'low', label: tc('statusLabel.low', 'Low') },
                            { value: 'medium', label: tc('statusLabel.medium', 'Medium') },
                            { value: 'high', label: tc('statusLabel.high', 'High') },
                            { value: 'critical', label: tc('statusLabel.critical', 'Critical') },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="payload" label={t('auctionControl.details', 'Details')}>
                        <Input.TextArea rows={2} placeholder={t('auctionControl.enterAlertDetails', 'Enter alert details')} />
                      </Form.Item>
                      <Button type="primary" danger htmlType="submit" loading={flagAuction.isPending} block={isMobile}>
                        {t('auctionControl.flagButton', 'Flag')}
                      </Button>
                    </Form>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Emergency section */}
                    <Card title={<><ThunderboltOutlined /> {t('auctionControl.emergency', 'Emergency')}</>} style={{ borderRadius: 12 }}>
                      <Form form={triggerEmForm} layout="vertical" onFinish={handleTriggerEmergency}>
                        <Form.Item name="reason" label={t('auctionControl.reason', 'Reason')} rules={[{ required: true }]}>
                          <Input.TextArea rows={2} placeholder={t('auctionControl.emergencyReasonPlaceholder', 'Enter reason')} />
                        </Form.Item>
                        <Form.Item name="triggerSource" label={t('auctionControl.triggerSource', 'Trigger Source')} rules={[{ required: true }]}>
                          <Input placeholder={t('auctionControl.enterTriggerSource', 'Enter trigger source')} />
                        </Form.Item>
                        <Form.Item name="payload" label={t('auctionControl.detailsJson', 'Details (JSON)')}>
                          <Input.TextArea rows={2} placeholder={t('auctionControl.enterJsonDetails', 'Enter details as JSON, e.g. {"key": "value"}')} />
                        </Form.Item>
                        <Button danger htmlType="submit" loading={triggerEmergency.isPending} block={isMobile}>
                          {t('auctionControl.triggerEmergency', 'Trigger Emergency')}
                        </Button>
                      </Form>
                    </Card>

                    {/* Resolve Emergency section */}
                    <Card title={t('auctionControl.resolveEmergency', 'Resolve Emergency')} style={{ borderRadius: 12 }}>
                      <Form form={resolveEmForm} layout="vertical" onFinish={handleResolveEmergency}>
                        <Form.Item name="emergencyId" label={t('auctionControl.emergencyId', 'Emergency ID')} rules={[{ required: true }]}>
                          <Input placeholder={t('auctionControl.enterEmergencyId', 'Enter Emergency ID')} />
                        </Form.Item>
                        <Form.Item name="status" label={t('auctionControl.status', 'Status')} rules={[{ required: true }]}>
                          <Select
                            placeholder={t('auctionControl.selectStatus', 'Select status')}
                            options={[
                              { value: 'resolved', label: t('auctionControl.resolutionStatus.resolved', 'Resolved') },
                              { value: 'dismissed', label: t('auctionControl.resolutionStatus.dismissed', 'Dismissed') },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="payload" label={t('auctionControl.details', 'Details')}>
                          <Input.TextArea rows={2} placeholder={t('auctionControl.enterResolutionDetails', 'Enter resolution details')} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={resolveEmergency.isPending} block={isMobile}>
                          {t('auctionControl.resolveButton', 'Resolve Emergency')}
                        </Button>
                      </Form>
                    </Card>
                  </Space>
                </Col>
              </Row>
            )
          },
          {
            key: 'danger',
            label: t('auctionControl.tabDangerZone', 'Danger Zone'),
            children: (
              <div style={{ padding: 16, border: '1px solid var(--color-danger-light, #ffa39e)', backgroundColor: '#fff1f0', borderRadius: 8 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      {/* Admin Lifecycle Actions */}
                      <Card title={<><PoweroffOutlined /> {t('auctionControl.adminLifecycleActions', 'Admin Lifecycle Actions')}</>} style={{ borderRadius: 12 }}>
                        <Alert type="warning" showIcon message={t('auctionControl.destructiveWarning', 'These actions are irreversible and affect all bidders, deposits, and orders.')} style={{ marginBottom: 16 }} />
                        <Space wrap size={12}>
                          <Button danger icon={<StopOutlined />} onClick={() => { setLifecycleModal('forceCancel'); setLifecycleReason('') }}>
                            {t('auctionControl.forceCancelBtn', 'Force Cancel')}
                          </Button>
                          <Button danger type="primary" icon={<PoweroffOutlined />} onClick={() => { setLifecycleModal('terminate'); setLifecycleReason('') }}>
                            {t('auctionControl.terminateBtn', 'Terminate')}
                          </Button>
                          <Button type="primary" icon={<StopOutlined />} onClick={() => { setLifecycleModal('forceEnd'); setLifecycleReason('') }}>
                            {t('auctionControl.forceEndBtn', 'Force End')}
                          </Button>
                        </Space>
                      </Card>

                      {/* Override Status (Hidden in Modal) */}
                      <Card title={<><SwapOutlined /> {t('auctionControl.overrideStatusTitle', 'Override Auction Status')}</>} style={{ borderRadius: 12 }}>
                        <Alert type="error" showIcon message={t('auctionControl.overrideWarning', 'Status override bypasses normal state machine. No domain events are raised.')} style={{ marginBottom: 16 }} />
                        <Button type="primary" danger onClick={() => setOverrideModalOpen(true)} block={isMobile}>
                          {t('auctionControl.openOverrideForm', 'Open Override Form')}
                        </Button>
                      </Card>
                    </Space>
                  </Col>

                  <Col xs={24} lg={12}>
                    {/* Relist Auction */}
                    <Card title={<><RedoOutlined /> {t('auctionControl.relistAuction', 'Relist Auction')}</>} style={{ borderRadius: 12 }}>
                      <Typography.Text type="secondary">{t('auctionControl.relistDesc', 'Create a new auction from this one (for failed/cancelled/terminated auctions).')}</Typography.Text>
                      <Divider style={{ margin: '12px 0' }} />
                      <Button type="primary" onClick={() => setRelistModalOpen(true)} block={isMobile}>
                        {t('auctionControl.openRelistForm', 'Open Relist Form')}
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </div>
            )
          }
        ]}
      />

      {/* Lifecycle Action Modal (shared for force cancel / terminate / force end) */}
      <Modal
        title={lifecycleModal === 'forceCancel' ? t('auctionControl.forceCancelTitle', 'Force Cancel Auction') : lifecycleModal === 'terminate' ? t('auctionControl.terminateTitle', 'Terminate Auction') : t('auctionControl.forceEndTitle', 'Force End Auction')}
        open={!!lifecycleModal}
        onCancel={() => { if (!lifecycleLoading) { setLifecycleModal(null); setLifecycleReason('') } }}
        onOk={handleLifecycleAction}
        okText={tc('common.confirm', 'Confirm')}
        okButtonProps={{ danger: lifecycleModal !== 'forceEnd', loading: lifecycleLoading, disabled: !lifecycleReason.trim() }}
        cancelButtonProps={{ disabled: lifecycleLoading }}
        destroyOnClose
        width={520}
      >
        <Alert
          type={lifecycleModal === 'terminate' ? 'error' : 'warning'}
          showIcon
          message={
            lifecycleModal === 'forceCancel' ? t('auctionControl.forceCancelAlert', 'This will cancel the auction, release all bids, return deposits, and release the item back to active.')
            : lifecycleModal === 'terminate' ? t('auctionControl.terminateAlert', 'This will permanently terminate the auction. All bids are cancelled, winner is cleared, and the item cannot be relisted from this auction.')
            : t('auctionControl.forceEndAlert', 'This will immediately end the auction and resolve the winner (if any).')
          }
          style={{ marginBottom: 16 }}
        />
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          {t('auctionControl.reason', 'Reason')} <span style={{ color: 'var(--color-danger)' }}>*</span>
        </Typography.Text>
        <Input.TextArea
          rows={4}
          value={lifecycleReason}
          onChange={(e) => setLifecycleReason(e.target.value)}
          placeholder={t('auctionControl.lifecycleReasonPlaceholder', 'Enter the reason for this action...')}
          maxLength={500}
          showCount
          disabled={lifecycleLoading}
        />
      </Modal>

      {/* Override Status Modal */}
      <Modal
        title={t('auctionControl.overrideStatusTitle', 'Override Auction Status')}
        open={overrideModalOpen}
        onCancel={() => { if (!overrideAuctionStatus.isPending) setOverrideModalOpen(false) }}
        okText={t('auctionControl.confirmOverride', 'Confirm Override')}
        onOk={() => overrideForm.submit()}
        okButtonProps={{ loading: overrideAuctionStatus.isPending, danger: true }}
        cancelButtonProps={{ disabled: overrideAuctionStatus.isPending }}
        destroyOnClose
      >
        <Alert type="error" showIcon message={t('auctionControl.overrideWarning', 'Status override bypasses normal state machine. No domain events are raised.')} style={{ marginBottom: 16 }} />
        <Form form={overrideForm} layout="vertical" onFinish={handleOverrideStatus}>
          <Form.Item name="overrideStatus" label={t('auctionControl.newStatus', 'New Status')} rules={[{ required: true }]}>
            <Select placeholder={t('auctionControl.selectNewStatus', 'Select new status')} options={[
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'active', label: 'Active' },
              { value: 'ended', label: 'Ended' },
              { value: 'sold', label: 'Sold' },
              { value: 'completed', label: 'Completed' },
              { value: 'payment_defaulted', label: 'Payment Defaulted' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'failed', label: 'Failed' },
              { value: 'terminated', label: 'Terminated' },
            ]} />
          </Form.Item>
          <Form.Item name="overrideReason" label={t('auctionControl.reason', 'Reason')} rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder={t('auctionControl.overrideReasonPlaceholder', 'Reason for status override...')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Relist Modal */}
      <Modal
        title={t('auctionControl.relistTitle', 'Relist Auction')}
        open={relistModalOpen}
        onCancel={() => { if (!relistAuction.isPending) setRelistModalOpen(false) }}
        okText={t('auctionControl.createRelisted', 'Create Relisted Auction')}
        onOk={() => relistForm.submit()}
        okButtonProps={{ loading: relistAuction.isPending }}
        cancelButtonProps={{ disabled: relistAuction.isPending }}
        destroyOnClose
        width={600}
      >
        <Form form={relistForm} layout="vertical" onFinish={handleRelist}>
          <Form.Item name="relistQualStart" label={t('auctionControl.qualStart', 'Qualification Start')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="relistQualEnd" label={t('auctionControl.qualEnd', 'Qualification End')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="relistStart" label={t('auctionControl.auctionStart', 'Auction Start')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="relistEnd" label={t('auctionControl.auctionEnd', 'Auction End')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="relistReason" label={t('auctionControl.reasonOptional', 'Reason (optional)')}>
            <Input.TextArea rows={2} placeholder={t('auctionControl.relistReasonPlaceholder', 'Reason for relisting...')} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}
