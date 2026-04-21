import { useState } from 'react'
import { Button, Modal, Space, Popconfirm, App, Select, Grid, Drawer, Input, Typography } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useAdminTerms,
  useCreateTerms,
  useActivateTerms,
  useUpdateTerms,
  useArchiveTerms,
  useDeleteTerms,
} from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MediaUploader } from '@/components/ui/MediaUploader'
import { formatDateTime, formatFileSize } from '@/utils/format'
import type { TermsDocumentDto, TermsDocumentStatus } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

const { useBreakpoint } = Grid

/** One-release compat: prefer `status` field; fall back to `isActive` boolean.
 * BE serializes the enum as lowercase (`"active"`, `"draft"`, `"archived"`) per the
 * `EnumValueObject` pattern — normalize to PascalCase so UI comparisons match. */
function resolveStatus(record: TermsDocumentDto): TermsDocumentStatus {
  const raw = record.status as string | undefined
  if (raw) {
    const lower = raw.toLowerCase()
    if (lower === 'active') return 'Active'
    if (lower === 'archived') return 'Archived'
    if (lower === 'draft') return 'Draft'
  }
  return record.isActive ? 'Active' : 'Draft'
}

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

  // ── Create state ──────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null)

  // ── Edit state ────────────────────────────────────────────────────────
  const [editRecord, setEditRecord] = useState<TermsDocumentDto | null>(null)
  const [editMediaId, setEditMediaId] = useState<string | null>(null)

  // ── Archive state ─────────────────────────────────────────────────────
  const [archiveRecord, setArchiveRecord] = useState<TermsDocumentDto | null>(null)
  const [archiveReason, setArchiveReason] = useState('')

  // ── Preview state ─────────────────────────────────────────────────────
  const [previewRecord, setPreviewRecord] = useState<TermsDocumentDto | null>(null)

  const { data, isLoading } = useAdminTerms()
  const createTerms = useCreateTerms()
  const activateTerms = useActivateTerms()
  const updateTerms = useUpdateTerms()
  const archiveTerms = useArchiveTerms()
  const deleteTerms = useDeleteTerms()

  // ── Handlers ──────────────────────────────────────────────────────────

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

  const handleUpdate = async () => {
    if (!editRecord || !editMediaId) return
    try {
      await updateTerms.mutateAsync({ id: editRecord.id, mediaUploadId: editMediaId })
      message.success(t('terms.updateSuccess', 'Draft updated'))
      setEditRecord(null)
      setEditMediaId(null)
    } catch {
      message.error(t('terms.updateError', 'Failed to update terms'))
    }
  }

  const handleArchive = async () => {
    if (!archiveRecord) return
    try {
      await archiveTerms.mutateAsync({ id: archiveRecord.id, reason: archiveReason || undefined })
      message.success(t('terms.archiveSuccess', 'Terms archived'))
      setArchiveRecord(null)
      setArchiveReason('')
    } catch {
      message.error(t('terms.archiveError', 'Failed to archive terms'))
    }
  }

  const handleDelete = async (record: TermsDocumentDto) => {
    try {
      await deleteTerms.mutateAsync(record.id)
      message.success(t('terms.deleteSuccess', 'Terms deleted'))
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'TermsDocument.HasAcceptances') {
        message.error(t('terms.hasAcceptancesError'))
      } else if (code === 'TermsDocument.NotDeletable') {
        message.error(t('terms.notDeletableError'))
      } else {
        message.error(t('terms.deleteError', 'Failed to delete terms'))
      }
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────

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
      key: 'status',
      width: 110,
      render: (_: unknown, record: TermsDocumentDto) => {
        const s = resolveStatus(record)
        return <StatusBadge status={s.toLowerCase()} />
      },
    },
    {
      title: t('terms.document'),
      key: 'file',
      ellipsis: true,
      responsive: ['sm'],
      render: (_: unknown, record: TermsDocumentDto) => {
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
      width: 260,
      render: (_: unknown, record: TermsDocumentDto) => {
        const status = resolveStatus(record)
        return (
          <Space size={4} wrap>
            {/* Preview — all statuses when contentUrl present */}
            {record.contentUrl && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, minHeight: 32 }}
                onClick={() => setPreviewRecord(record)}
              >
                {t('terms.preview')}
              </Button>
            )}

            {status === 'Draft' && (
              <>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, minHeight: 32 }}
                  onClick={() => { setEditRecord(record); setEditMediaId(null) }}
                >
                  {t('terms.edit')}
                </Button>

                <Popconfirm
                  title={t('terms.activateConfirm')}
                  description={t('terms.activateConfirmDesc')}
                  onConfirm={() => handleActivate(record.id)}
                >
                  <Button
                    type="link"
                    size="small"
                    style={{ color: 'var(--color-accent)', padding: 0, minHeight: 32 }}
                  >
                    {t('terms.activate')}
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title={t('terms.deleteConfirmTitle')}
                  description={t('terms.deleteDraftOnlyWarning')}
                  okType="danger"
                  onConfirm={() => handleDelete(record)}
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    style={{ padding: 0, minHeight: 32 }}
                  >
                    {t('terms.delete')}
                  </Button>
                </Popconfirm>
              </>
            )}

            {status === 'Active' && (
              <>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, minHeight: 32 }}
                  onClick={() => { setArchiveRecord(record); setArchiveReason('') }}
                >
                  {t('terms.archive')}
                </Button>

                {record.contentUrl && (
                  <a href={record.contentUrl} download>
                    <Button type="link" size="small" style={{ padding: 0, minHeight: 32 }}>
                      {t('terms.download')}
                    </Button>
                  </a>
                )}
              </>
            )}

            {status === 'Archived' && record.contentUrl && (
              <a href={record.contentUrl} download>
                <Button type="link" size="small" style={{ padding: 0, minHeight: 32 }}>
                  {t('terms.download')}
                </Button>
              </a>
            )}
          </Space>
        )
      },
    },
  ]

  // ── Create form content ────────────────────────────────────────────────
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
            if (files.length > 0) setUploadedMediaId(files[0].mediaUploadId)
          }}
        />
      </div>
    </Space>
  )

  // ── Edit form content ─────────────────────────────────────────────────
  const EditFormContent = (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {t('terms.editPdfDescription')}
      </Typography.Text>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
          <UploadOutlined style={{ marginRight: 6 }} />
          {t('terms.uploadNewPdf')}
        </label>
        <MediaUploader
          context="term_document"
          maxFiles={1}
          accept=".pdf"
          onUploadComplete={(files) => {
            if (files.length > 0) setEditMediaId(files[0].mediaUploadId)
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
        <h1 style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: isMobile ? 22 : 28,
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
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

      {/* ── Create Terms — Drawer on mobile, Modal on desktop ── */}
      {isMobile ? (
        <Drawer
          title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>{t('terms.createTerms')}</span>}
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
          title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>{t('terms.createTerms')}</span>}
          open={createModalOpen}
          onOk={handleCreate}
          onCancel={() => { setCreateModalOpen(false); setNewType(''); setUploadedMediaId(null) }}
          confirmLoading={createTerms.isPending}
          okButtonProps={{ disabled: !newType || !uploadedMediaId, style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
          okText={tc('action.create')}
          width={560}
        >
          {CreateFormContent}
        </Modal>
      )}

      {/* ── Edit Draft PDF — Drawer on mobile, Modal on desktop ── */}
      {isMobile ? (
        <Drawer
          title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>{t('terms.editPdfTitle')}</span>}
          placement="bottom"
          height="auto"
          open={!!editRecord}
          onClose={() => { setEditRecord(null); setEditMediaId(null) }}
          styles={{ body: { paddingBottom: 80 } }}
          extra={
            <Button
              type="primary"
              disabled={!editMediaId}
              loading={updateTerms.isPending}
              onClick={handleUpdate}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', minHeight: 44 }}
            >
              {tc('action.save')}
            </Button>
          }
        >
          {EditFormContent}
        </Drawer>
      ) : (
        <Modal
          title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>{t('terms.editPdfTitle')}</span>}
          open={!!editRecord}
          onOk={handleUpdate}
          onCancel={() => { setEditRecord(null); setEditMediaId(null) }}
          confirmLoading={updateTerms.isPending}
          okButtonProps={{ disabled: !editMediaId, style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
          okText={tc('action.save')}
          width={560}
        >
          {EditFormContent}
        </Modal>
      )}

      {/* ── Archive Confirmation Modal ── */}
      <Modal
        title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>{t('terms.archiveConfirmTitle')}</span>}
        open={!!archiveRecord}
        onOk={handleArchive}
        onCancel={() => { setArchiveRecord(null); setArchiveReason('') }}
        confirmLoading={archiveTerms.isPending}
        okButtonProps={{ style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
        okText={t('terms.archive')}
        width={480}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
            {t('terms.archiveReasonLabel')}
          </label>
          <Input.TextArea
            rows={3}
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            placeholder={t('terms.archiveReasonPlaceholder')}
          />
        </Space>
      </Modal>

      {/* ── Preview Modal ── */}
      <Modal
        title={
          <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 20 }}>
            {t('terms.previewTitle')} — {previewRecord?.type} v{previewRecord?.version}
          </span>
        }
        open={!!previewRecord}
        onCancel={() => setPreviewRecord(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewRecord(null)}>
            {tc('action.close', 'Close')}
          </Button>,
          previewRecord?.contentUrl
            ? (
              <a key="dl" href={previewRecord.contentUrl} download>
                <Button type="primary" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
                  {t('terms.download')}
                </Button>
              </a>
            )
            : null,
        ]}
        width={800}
        styles={{ body: { padding: 0 } }}
      >
        {previewRecord?.contentUrl ? (
          <object
            data={`${previewRecord.contentUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
            type="application/pdf"
            style={{ width: '100%', height: '70vh', border: 'none' }}
          >
            <div style={{ padding: 24, textAlign: 'center' }}>
              <a href={previewRecord.contentUrl} target="_blank" rel="noopener noreferrer">
                {t('terms.download')}
              </a>
            </div>
          </object>
        ) : null}
      </Modal>
    </div>
  )
}
