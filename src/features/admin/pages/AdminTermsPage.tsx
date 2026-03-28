import { useState } from 'react'
import { Button, Modal, Space, Popconfirm, App, Select } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminTerms, useCreateTerms, useActivateTerms } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MediaUploader } from '@/components/ui/MediaUploader'
import { formatDateTime, formatFileSize } from '@/utils/format'
import type { TermsDocumentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

const TERMS_TYPES = [
  { value: 'bidder', label: 'Bidder Terms' },
  { value: 'seller', label: 'Seller Terms' },
  { value: 'general', label: 'General Terms' },
  { value: 'privacy', label: 'Privacy Policy' },
]

export default function AdminTermsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (type: string) => (
        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{type}</span>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => (
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>v{v}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => <StatusBadge status={isActive ? 'active' : 'draft'} />,
    },
    {
      title: 'Document',
      key: 'file',
      ellipsis: true,
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
            {record.fileName ?? 'Download'}
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
      title: 'Published',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: (date: string | undefined) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {date ? formatDateTime(date) : '—'}
        </span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (record.isActive) return null
        return (
          <Popconfirm
            title="Activate this terms document?"
            description="This will deactivate the current active version."
            onConfirm={() => handleActivate(record.id)}
          >
            <Button
              type="link"
              size="small"
              style={{ color: 'var(--color-accent)', fontWeight: 500, padding: 0 }}
            >
              Activate
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: 28,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {t('terms.title', 'Terms & Conditions')}
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }}
        >
          {t('terms.createTerms', 'Create Terms')}
        </Button>
      </div>

      {/* Table */}
      <ResponsiveTable<TermsDocumentDto>
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{ pageSize: 10, showTotal: (total) => tc('pagination.total', { total }) }}
      />

      {/* Create Terms Modal */}
      <Modal
        title={
          <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>
            {t('terms.createTerms', 'Create Terms Document')}
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
        okText="Create"
        width={560}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={20}>
          {/* Type selection */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
              Terms Type
            </label>
            <Select
              value={newType || undefined}
              onChange={setNewType}
              options={TERMS_TYPES}
              placeholder="Select terms type"
              style={{ width: '100%' }}
            />
          </div>

          {/* PDF Upload */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
              <UploadOutlined style={{ marginRight: 6 }} />
              Upload PDF Document
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
      </Modal>
    </div>
  )
}
