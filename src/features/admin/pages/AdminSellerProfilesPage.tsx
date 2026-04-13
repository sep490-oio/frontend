import { useState } from 'react'
import { Typography, Select, Space, Button, Modal, Input, App, Grid, Row, Col } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ShopOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminSellerProfiles, useVerifySellerProfile, useRejectSellerProfile } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { SellerProfileDto } from '@/types'
import { MONO_FONT } from '@/styles/tokens'
import { htmlToPlainTextExcerpt } from '@/components/ui/SafeHtmlRenderer'
import type { ColumnsType } from 'antd/es/table'

const { useBreakpoint } = Grid

// ─── Shared style constants ───────────────────────────────────────────────────
const TOUCH_MIN_HEIGHT = 44
const ACTION_BTN_STYLE_BASE = { minHeight: 36, padding: '0' }
const ACTION_BTN_STYLE_MOBILE = { minHeight: TOUCH_MIN_HEIGHT, padding: '4px 0' }

export default function AdminSellerProfilesPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const isTablet = screens.md && !screens.lg

  const STATUS_OPTIONS = [
    { value: '', label: '' },
    { value: SellerProfileStatus.Pending, label: tc('statusLabel.pending') },
    { value: SellerProfileStatus.Verified, label: tc('statusLabel.verified') },
    { value: SellerProfileStatus.Rejected, label: tc('statusLabel.rejected') },
    { value: SellerProfileStatus.Suspended, label: tc('statusLabel.suspended') },
  ]

  const { message } = App.useApp()

  // ─── State (unchanged) ──────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // ─── API hooks (unchanged) ──────────────────────────────────────────────────
  const { data, isLoading } = useAdminSellerProfiles({
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const verifyProfile = useVerifySellerProfile()
  const rejectProfile = useRejectSellerProfile()

  // ─── Handlers (unchanged) ───────────────────────────────────────────────────
  const handleVerify = async (id: string) => {
    try {
      await verifyProfile.mutateAsync(id)
      message.success(t('sellers.verifySuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectProfile.mutateAsync({ id: rejectId, reason: rejectReason })
      message.success(t('sellers.rejectSuccess'))
      setRejectModalOpen(false)
      setRejectReason('')
    } catch {
      message.error(t('common.error'))
    }
  }

  // ─── Action button style helper ─────────────────────────────────────────────
  const actionBtnStyle = isMobile ? ACTION_BTN_STYLE_MOBILE : ACTION_BTN_STYLE_BASE

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<SellerProfileDto> = [
    {
      title: t('sellers.storeName'),
      dataIndex: 'storeName',
      key: 'storeName',
      ellipsis: true,
    },
    {
      title: t('sellers.description'),
      dataIndex: 'storeDescription',
      key: 'storeDescription',
      ellipsis: true,
      responsive: ['md'],
      render: (desc: string) => htmlToPlainTextExcerpt(desc) || '—',
    },
    {
      title: t('sellers.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('sellers.trustScore'),
      dataIndex: 'trustScore',
      key: 'trustScore',
      width: 100,
      responsive: ['sm'],
      render: (score: number) => (
        <span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>
          {score != null ? score.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      title: t('sellers.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      responsive: ['lg'],
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('sellers.actions'),
      key: 'actions',
      // Give more width on tablet so buttons don't crowd
      width: isMobile ? 100 : isTablet ? 150 : 180,
      render: (_, record) => (
        <Space
          size={4}
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: isMobile ? '100%' : undefined }}
        >
          {record.status === SellerProfileStatus.Pending && (
            <>
              <Button
                type="link"
                size="small"
                style={actionBtnStyle}
                onClick={() => handleVerify(record.id)}
              >
                {t('sellers.verify')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                style={actionBtnStyle}
                onClick={() => {
                  setRejectId(record.id)
                  setRejectModalOpen(true)
                }}
              >
                {t('sellers.reject')}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  // ─── Responsive modal positioning ───────────────────────────────────────────
  const modalStyle = isMobile
    ? { top: 'auto', bottom: 0, margin: 0, maxWidth: '100vw', paddingBottom: 0 }
    : undefined

  const modalBodyStyles = isMobile
    ? { body: { borderRadius: '16px 16px 0 0' } }
    : undefined

  const modalWidth = isMobile ? '100%' : isTablet ? 460 : 520

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: isMobile ? 80 : 48 }}>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <Row
        align="middle"
        justify="space-between"
        style={{ marginBottom: isMobile ? 16 : 24 }}
        gutter={[0, 12]}
      >
        <Col xs={24} sm="auto">
          <Typography.Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShopOutlined />
            {t('sellers.title')}
          </Typography.Title>
        </Col>
      </Row>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 20 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('sellers.filterStatus')}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: '100%' }}
            allowClear
            onClear={() => setStatusFilter('')}
            options={STATUS_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.value ? opt.label : t('sellers.allStatuses'),
            }))}
          />
        </Col>
      </Row>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Row>
        <Col xs={24}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <ResponsiveTable<SellerProfileDto>
              rowKey="id"
              columns={columns}
              dataSource={data ?? []}
              loading={isLoading}
              mobileMode="list"
              pagination={{
                pageSize: 20,
                showSizeChanger: !isMobile,
                simple: isMobile,
              }}
            />
          </div>
        </Col>
      </Row>

      {/* ── Reject Modal ───────────────────────────────────────────────────── */}
      <Modal
        title={t('sellers.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false)
          setRejectReason('')
        }}
        confirmLoading={rejectProfile.isPending}
        style={modalStyle}
        styles={modalBodyStyles}
        width={modalWidth}
        okButtonProps={{ style: { minHeight: TOUCH_MIN_HEIGHT } }}
        cancelButtonProps={{ style: { minHeight: TOUCH_MIN_HEIGHT } }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Typography.Text strong>
            {t('sellers.rejectReason')}
          </Typography.Text>
          <Input.TextArea
            rows={isMobile ? 4 : 3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('sellers.rejectReasonPlaceholder')}
            style={{
              fontSize: isMobile ? 16 : 14,
              resize: 'vertical',
            }}
          />
        </Space>
      </Modal>

    </div>
  )
}