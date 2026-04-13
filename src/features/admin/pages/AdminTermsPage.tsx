import { useState } from 'react'
import { Button, Modal, Space, Popconfirm, App, Select, Grid, Drawer } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminTerms, useCreateTerms, useActivateTerms } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MediaUploader } from '@/components/ui/MediaUploader'
import { formatDateTime, formatFileSize } from '@/utils/format'
import type { TermsDocumentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

const { useBreakpoint } = Grid

export default function AdminTermsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const TERMS_TYPES = [
    { value: 'platform', label: t('terms.typePlatform') },
    { value: 'bidder', label: t('terms.typeBidder') },
    { value: 'seller', label: t('terms.typeSeller') },
    { value: 'privacy', label: t('terms.typePrivacy') },
  ]

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null)

  const { data, isLoading } = useAdminTerms()
  const createTerms = useCreateTerms()
  const activateTerms = useActivateTerms()

  const handleCreate = async () => {
    if (!newType || !uploadedMediaId) {
      message.warning('Please select type and upload a PDF document')
      return
    }
    try {
      await createTerms.mutateAsync({ type: newType, mediaUploadId: uploadedMediaId })
      message.success(t('terms.createSuccess', 'Terms created successfully'))
      setCreateModalOpen(false)
      setNewType('')
      setUploadedMediaId(null)
    } catch {
      message.error(t('terms.createError', 'Failed to create terms'))
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await activateTerms.mutateAsync(id)
      message.success(t('terms.activateSuccess', 'Terms activated'))
    } catch {
      message.error(t('terms.activateError', 'Failed to activate terms'))
    }
  }

  const columns: ColumnsType<TermsDocumentDto> = [
    {
      title: t('terms.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{type}</span>
      ),
    },
    {
      title: t('terms.version'),
      dataIndex: 'version',
      key: 'version',
      width: 70,
      render: (v: number) => (
        <span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>v{v}</span>
      ),
    },
    {
      title: t('terms.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => <StatusBadge status={isActive ? 'active' : 'draft'} />,
    },
    {
      title: t('terms.document'),
      key: 'file',
      ellipsis: true,
      responsive: ['sm'],
      render: (_, record) => {
        if (!record.contentUrl) return <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
        return (
          <a
            href={record.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FileTextOutlined />
            {record.fileName ?? t('terms.download')}
            {record.fileSize != null && (
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                ({formatFileSize(record.fileSize)})
              </span>
            )}
          </a>
        )
      },
    },
    {
      title: tc('tableHeader.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      responsive: ['lg'],
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
    {
      title: tc('tableHeader.actions'),
      key: 'actions',
      width: 110,
      render: (_, record) => {
        if (record.isActive) return null
        return (
          <Popconfirm
            title={t('terms.activateConfirm')}
            description={t('terms.activateConfirmDesc')}
            onConfirm={() => handleActivate(record.id)}
          >
            <Button
              type="link"
              size="small"
              style={{
                color: 'var(--color-accent)',
                fontWeight: 500,
                padding: 0,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {t('terms.activate')}
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  // Shared create form content used in both Modal and Drawer
  const CreateFormContent = (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
          {t('terms.termsType')}
        </label>
        <Select
          value={newType || undefined}
          onChange={setNewType}
          options={TERMS_TYPES}
          placeholder={t('terms.selectTermsType')}
          style={{ width: '100%', minHeight: 44 }}
        />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
          <UploadOutlined style={{ marginRight: 6 }} />
          {t('terms.uploadPdf')}
        </label>
        <MediaUploader
          context="term_document"
          maxFiles={1}
          accept=".pdf"
          onUploadComplete={(files) => {
            if (files.length > 0) {
              setUploadedMediaId(files[0].mediaUploadId)
            }
          }}
        />
      </div>
    </Space>
  )

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
        marginBottom: isMobile ? 16 : 24,
      }}>
        <h1
          style={{
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: isMobile ? 22 : 28,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {t('terms.title')}
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            fontWeight: 500,
            minHeight: 44,
            width: isMobile ? '100%' : undefined,
          }}
        >
          {t('terms.createTerms')}
        </Button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <ResponsiveTable<TermsDocumentDto>
          rowKey="id"
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          mobileMode="list"
          pagination={{ pageSize: 10, showTotal: (total) => tc('pagination.total', { total }) }}
        />
      </div>

      {/* Create Terms — Drawer on mobile, Modal on desktop */}
      {isMobile ? (
        <Drawer
          title={
            <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>
              {t('terms.createTerms')}
            </span>
          }
          placement="bottom"
          height="auto"
          open={createModalOpen}
          onClose={() => { setCreateModalOpen(false); setNewType(''); setUploadedMediaId(null) }}
          styles={{ body: { paddingBottom: 80 } }}
          extra={
            <Button
              type="primary"
              disabled={!newType || !uploadedMediaId}
              loading={createTerms.isPending}
              onClick={handleCreate}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', minHeight: 44 }}
            >
              {tc('action.create')}
            </Button>
          }
        >
          {CreateFormContent}
        </Drawer>
      ) : (
        <Modal
          title={
            <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>
              {t('terms.createTerms')}
            </span>
          }
          open={createModalOpen}
          onOk={handleCreate}
          onCancel={() => { setCreateModalOpen(false); setNewType(''); setUploadedMediaId(null) }}
          confirmLoading={createTerms.isPending}
          okButtonProps={{
            disabled: !newType || !uploadedMediaId,
            style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
          }}
          okText={tc('action.create')}
          width={560}
        >
          {CreateFormContent}
        </Modal>
      )}
    </div>
  )
}