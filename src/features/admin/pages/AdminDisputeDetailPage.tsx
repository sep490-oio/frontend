import { useState, useMemo, useEffect } from 'react'
import {
  Typography, Card, Tag, Space, Spin, Empty, Button, Input,
  Modal, Select, Image, Popconfirm, Row, Col, App, Result, Tabs, Drawer, Collapse, Tooltip, Alert,
} from 'antd'
import {
  SendOutlined, UserOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, CopyOutlined,
  ExclamationCircleOutlined, TeamOutlined,
  PictureOutlined, VideoCameraOutlined, MessageOutlined, PaperClipOutlined,
} from '@ant-design/icons'
import DisputeAttachmentRenderer from '@/components/ui/DisputeAttachmentRenderer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router'
import {
  useAdminDisputeDetail,
  useDisputeAssignableUsers,
  useAssignDispute,
  useTransitionDisputeStatus,
  useRequestDisputeEvidence,
  useAddDisputeFinding,
  useResolveCaseDispute,
  useRejectDispute,
  useAddAdminDisputeMessage,
} from '@/features/dispute/api'
import ResolutionActionBuilder, { getPresetForOutcome, validateActionSet } from '@/features/admin/components/ResolutionActionBuilder'
import type { ResolutionActionSet } from '@/features/dispute/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DisputeStatus } from '@/types/enums'
import type { DisputeMessageV2Dto, DisputeFindingDto } from '@/types'
import dayjs from 'dayjs'

const TERMINAL_STATUSES = [DisputeStatus.Resolved, DisputeStatus.Rejected, DisputeStatus.Cancelled] as string[]

export default function AdminDisputeDetailPage() {
  const { t } = useTranslation('dispute')
  const { t: ta } = useTranslation('admin')

  const OUTCOME_OPTIONS = [
    { value: 'favor_buyer', label: ta('disputeDetail.outcomeOption.favorBuyer') },
    { value: 'favor_seller', label: ta('disputeDetail.outcomeOption.favorSeller') },
    { value: 'favor_platform', label: ta('disputeDetail.outcomeOption.favorPlatform') },
    { value: 'partial_split', label: ta('disputeDetail.outcomeOption.partialSplit') },
    { value: 'void_claim', label: ta('disputeDetail.outcomeOption.voidClaim') },
    { value: 'operational_rework', label: ta('disputeDetail.outcomeOption.operationalRework') },
  ]

  const RECOMMENDATION_OPTIONS = [
    { value: 'favor_buyer', label: ta('disputeDetail.outcomeOption.favorBuyer') },
    { value: 'favor_seller', label: ta('disputeDetail.outcomeOption.favorSeller') },
    { value: 'favor_platform', label: ta('disputeDetail.outcomeOption.favorPlatform') },
    { value: 'partial_split', label: ta('disputeDetail.outcomeOption.partialSplit') },
    { value: 'void_claim', label: ta('disputeDetail.outcomeOption.voidClaim') },
    { value: 'operational_rework', label: ta('disputeDetail.outcomeOption.operationalRework') },
  ]

  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
  const { message: msg } = App.useApp()
  const disputeId = id ?? ''

  const { data: dispute, isLoading } = useAdminDisputeDetail(disputeId)
  const { data: assignableUsers } = useDisputeAssignableUsers(disputeId)

  // Mutations
  const assignMutation = useAssignDispute()
  const transitionMutation = useTransitionDisputeStatus()
  const requestEvidenceMutation = useRequestDisputeEvidence()
  const addFindingMutation = useAddDisputeFinding()
  const resolveMutation = useResolveCaseDispute()
  const rejectMutation = useRejectDispute()
  const addMessageMutation = useAddAdminDisputeMessage()

  // Local state
  const [assignUserId, setAssignUserId] = useState<string | undefined>(undefined)
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [evidenceRequestMsg, setEvidenceRequestMsg] = useState(t('evidenceRequestDefault'))
  const [findingModalOpen, setFindingModalOpen] = useState(false)
  const [findingDomain, setFindingDomain] = useState('')
  const [findingRecommendation, setFindingRecommendation] = useState('')
  const [findingSummary, setFindingSummary] = useState('')
  const [findingSelectedRefs, setFindingSelectedRefs] = useState<{ referenceType: string; targetId: string; label: string }[]>([])
  const [findingNote, setFindingNote] = useState('')
  const [resolveDrawerOpen, setResolveDrawerOpen] = useState(false)
  const [resolveOutcome, setResolveOutcome] = useState('')
  const [resolveReason, setResolveReason] = useState('')
  const [resolveActionSet, setResolveActionSet] = useState<ResolutionActionSet>({})
  const [rejectReason, setRejectReason] = useState('')
  const [externalMessageText, setExternalMessageText] = useState('')
  const [internalMessageText, setInternalMessageText] = useState('')
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)

  const isTerminal = TERMINAL_STATUSES.includes(dispute?.status ?? '')

  // Auto-fill action set presets when outcome changes
  useEffect(() => {
    if (resolveOutcome) {
      const preset = getPresetForOutcome(resolveOutcome, dispute?.domain)
      setResolveActionSet((prev) => ({ ...prev, ...preset }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveOutcome, dispute?.domain])

  // Validate action set
  const actionSetValidation = useMemo(() => validateActionSet(resolveActionSet, ta), [resolveActionSet, ta])

  // Parse context snapshot
  const contextSnapshot = useMemo(() => {
    if (!dispute?.contextSnapshotJson) return null
    try {
      return JSON.parse(dispute.contextSnapshotJson) as Record<string, unknown>
    } catch {
      return null
    }
  }, [dispute?.contextSnapshotJson])

  const formatContextValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return t('contextValue.empty', '—')
    const raw = String(value)
    if (key.endsWith('At')) {
      const d = dayjs(raw)
      if (d.isValid()) return d.format('DD/MM/YYYY HH:mm')
      return raw
    }
    if (key === 'auctionStatus' || key === 'orderStatus') return t(`contextValue.${key}.${raw}`, raw)
    if (key === 'totalAmount' || key === 'amount') {
      const n = Number(value)
      if (!isNaN(n)) return new Intl.NumberFormat().format(n)
    }
    return raw
  }

  // Map an id-shaped key to the admin detail route for its resource.
  // Returns null when no dedicated detail page exists (falls back to copy-only display).
  const getContextLinkPath = (key: string, id: string): string | null => {
    switch (key) {
      case 'buyerId':
      case 'sellerId':
      case 'winnerId':
      case 'userId':
        return `/admin/users/${id}`
      case 'itemId':
        return `/admin/items/${id}`
      case 'auctionId':
        return `/admin/auctions/${id}`
      default:
        return null
    }
  }

  const shortId = (id: string): string => (id.length > 12 ? `…${id.slice(-8)}` : id)

  const renderContextFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '')
      return <Typography.Text style={{ fontSize: 12 }}>{t('contextValue.empty', '—')}</Typography.Text>

    // Id-shaped keys get link + monospace short form + full-id tooltip + copy button.
    const isIdKey = key.endsWith('Id') && typeof value === 'string'
    if (isIdKey) {
      const id = String(value)
      const linkTo = getContextLinkPath(key, id)
      const display = (
        <Typography.Text code style={{ fontSize: 12 }}>
          {shortId(id)}
        </Typography.Text>
      )
      return (
        <Space size={4}>
          <Tooltip title={id}>
            {linkTo ? (
              <Link to={linkTo} style={{ color: 'var(--color-accent, #1677ff)' }}>
                {display}
              </Link>
            ) : (
              display
            )}
          </Tooltip>
          <Tooltip title={t('copyId', 'Copy ID')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard.writeText(id)
                msg.success(t('copied', 'Copied'))
              }}
            />
          </Tooltip>
        </Space>
      )
    }

    // orderNumber / transactionNumber — human-readable identifiers, no link but monospace.
    if (key === 'orderNumber' || key === 'transactionNumber' || key === 'carrierTrackingNumber' || key === 'gatewayTransactionId') {
      return (
        <Typography.Text code style={{ fontSize: 12 }}>
          {String(value)}
        </Typography.Text>
      )
    }

    // Status keys render as a small badge.
    if (key === 'auctionStatus' || key === 'orderStatus' || key === 'status') {
      return <StatusBadge status={String(value)} size="small" />
    }

    return <Typography.Text style={{ fontSize: 12 }}>{formatContextValue(key, value)}</Typography.Text>
  }

  // Split messages
  const externalMessages = useMemo(
    () => (dispute?.messages ?? []).filter((m) => m.visibility === 'external'),
    [dispute?.messages],
  )
  const internalMessages = useMemo(
    () => (dispute?.messages ?? []).filter((m) => m.visibility === 'internal'),
    [dispute?.messages],
  )

  // All attachments merged
  const allAttachments = useMemo(
    () => dispute?.evidence ?? [],
    [dispute?.evidence],
  )

  // Evidence picker options built from messages and evidence
  const evidencePickerOptions = useMemo(() => {
    if (!dispute) return []
    const opts: { value: string; label: string; type: string; secureUrl?: string; resourceType?: string }[] = []
    for (const ev of dispute.evidence ?? []) {
      opts.push({ value: ev.id, label: ev.fileName || t('evidenceDefaultLabel'), type: 'evidence', secureUrl: ev.secureUrl, resourceType: ev.resourceType })
    }
    for (const m of dispute.messages ?? []) {
      for (const att of m.attachments ?? []) {
        if (att.secureUrl) {
          opts.push({ value: att.id, label: att.fileName || t('attachmentDefaultLabel'), type: 'attachment', secureUrl: att.secureUrl, resourceType: att.resourceType })
        }
      }
      if (m.content) {
        opts.push({ value: m.id, label: `${m.authorDisplayName}: ${m.content.substring(0, 60)}`, type: 'message' })
      }
    }
    return opts
  }, [dispute, t])

  // Latest finding recommendation
  const latestFinding = useMemo(() => {
    const findings = dispute?.findings ?? []
    return findings.length > 0 ? findings[findings.length - 1] : null
  }, [dispute?.findings])

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!dispute) {
    return <Empty description={t('notFound')} />
  }

  const handleAssign = async () => {
    if (!assignUserId) return
    try {
      await assignMutation.mutateAsync({ id: disputeId, assignedToUserId: assignUserId })
      msg.success(t('toastDisputeAssigned'))
      setAssignUserId(undefined)
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleTransitionTo = async (targetStatus: string) => {
    try {
      await transitionMutation.mutateAsync({ id: disputeId, status: targetStatus })
      msg.success(t('toastStatusTransitioned'))
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleRequestEvidence = async () => {
    if (!evidenceRequestMsg.trim()) return
    try {
      await requestEvidenceMutation.mutateAsync({ id: disputeId, message: evidenceRequestMsg.trim() })
      msg.success(t('toastEvidenceRequested'))
      setEvidenceModalOpen(false)
      setEvidenceRequestMsg(t('evidenceRequestDefault'))
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleAddFinding = async () => {
    if (!findingSummary.trim() || !findingDomain.trim()) return
    try {
      await addFindingMutation.mutateAsync({
        id: disputeId,
        domain: findingDomain,
        verdictRecommendation: findingRecommendation || undefined,
        summary: findingSummary,
        findingNote: findingNote || undefined,
        references: findingSelectedRefs.length > 0
          ? findingSelectedRefs.map((r) => ({ referenceType: r.referenceType, targetId: r.targetId }))
          : undefined,
      })
      msg.success(t('toastFindingAdded'))
      setFindingModalOpen(false)
      setFindingDomain('')
      setFindingRecommendation('')
      setFindingSummary('')
      setFindingSelectedRefs([])
      setFindingNote('')
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleResolve = async () => {
    if (!resolveOutcome || !resolveReason.trim()) return
    if (actionSetValidation.errors.length > 0) return
    try {
      const hasActions = Object.values(resolveActionSet).some((v) => v != null && v !== '' && v !== 'no_action' && v !== 'no_refund')
      await resolveMutation.mutateAsync({
        id: disputeId,
        outcome: resolveOutcome,
        reason: resolveReason,
        actionSet: hasActions ? resolveActionSet : undefined,
      })
      msg.success(t('toastDisputeResolved'))
      setResolveDrawerOpen(false)
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      await rejectMutation.mutateAsync({ id: disputeId, reason: rejectReason })
      msg.success(t('toastDisputeRejected'))
      setRejectReason('')
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleSendExternalMessage = async () => {
    if (!externalMessageText.trim()) return
    try {
      await addMessageMutation.mutateAsync({
        id: disputeId,
        content: externalMessageText.trim(),
        visibility: 'external',
      })
      msg.success(t('toastMessageSent'))
      setExternalMessageText('')
    } catch {
      msg.error(t('toastError'))
    }
  }

  const handleSendInternalMessage = async () => {
    if (!internalMessageText.trim()) return
    try {
      await addMessageMutation.mutateAsync({
        id: disputeId,
        content: internalMessageText.trim(),
        visibility: 'internal',
      })
      msg.success(t('toastMessageSent'))
      setInternalMessageText('')
    } catch {
      msg.error(t('toastError'))
    }
  }

  const copyDisputeNumber = () => {
    navigator.clipboard.writeText(dispute.disputeNumber)
    msg.success(t('toastCopied'))
  }

  const renderMessage = (m: DisputeMessageV2Dto, borderColor: string) => (
    <div key={m.id} style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--color-bg-primary)', borderRadius: 8, borderLeft: `3px solid ${borderColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {m.authorDisplayName}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
          {dayjs(m.createdAt).format('DD/MM/YYYY HH:mm')}
        </Typography.Text>
      </div>
      <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>
        {m.content}
      </Typography.Paragraph>
      {m.attachments?.filter(a => a.secureUrl).map((att, i) => (
        <DisputeAttachmentRenderer key={i} {...att} />
      ))}
    </div>
  )

  const renderFindingRefIcon = (ref: { referenceType: string; resourceType?: string }) => {
    if (ref.referenceType === 'message') return <MessageOutlined />
    if (ref.resourceType === 'image') return <PictureOutlined />
    if (ref.resourceType === 'video') return <VideoCameraOutlined />
    return <PaperClipOutlined />
  }

  const renderFinding = (f: DisputeFindingDto) => (
    <Card key={f.id} size="small" style={{ marginBottom: 8 }}>
      <Space size={4} wrap style={{ marginBottom: 4 }}>
        <Tag><UserOutlined style={{ marginRight: 2 }} />{f.authorDisplayName}</Tag>
        <Tag color="purple">{t(`domainLabel.${f.domain}`, f.domain)}</Tag>
        {f.verdictRecommendation && <Tag color="blue">{ta(`disputeDetail.outcomeOption.${f.verdictRecommendation}`, f.verdictRecommendation)}</Tag>}
      </Space>
      <Typography.Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
        {f.summary}
      </Typography.Paragraph>
      {(f.references?.length ?? 0) > 0 && (
        <Space wrap style={{ marginBottom: 4 }}>
          {f.references!.map((ref) => {
            const canOpen = (ref.referenceType === 'attachment' || ref.referenceType === 'evidence') && ref.secureUrl
            const chip = (
              <Tag
                key={ref.targetId}
                icon={renderFindingRefIcon(ref)}
                style={{ cursor: canOpen ? 'pointer' : 'default', fontSize: 11 }}
                onClick={canOpen ? () => window.open(ref.secureUrl, '_blank') : undefined}
              >
                {ref.label.length > 40 ? ref.label.substring(0, 40) + '…' : ref.label}
              </Tag>
            )
            return ref.referenceType === 'message' && ref.messagePreview ? (
              <Tooltip key={ref.targetId} title={ref.messagePreview}>{chip}</Tooltip>
            ) : chip
          })}
        </Space>
      )}
      {f.findingNote && (
        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
          {t('findingNote')}: {f.findingNote}
        </Typography.Text>
      )}
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
          {dayjs(f.createdAt).format('DD/MM/YYYY HH:mm')}
        </Typography.Text>
      </div>
    </Card>
  )

  const isAwaitingEvidence = dispute.status === DisputeStatus.AwaitingEvidence && !!dispute.requestedEvidenceAt

  const hasNewEvidence = dispute.status === DisputeStatus.AwaitingEvidence && !!dispute.requestedEvidenceAt &&
    (dispute.messages ?? []).some(
      (m) => m.visibility === 'external' &&
        new Date(m.createdAt) > new Date(dispute.requestedEvidenceAt!) &&
        ((m.attachments?.length ?? 0) > 0 || m.content?.trim())
    )

  // ── Case Actions content (shared between card and mobile drawer) ──
  const renderCaseActions = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* Assign */}
      {dispute.canAssign && (
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
            {t('assign')}
          </Typography.Text>
          <Space wrap>
            <Select
              value={assignUserId}
              onChange={setAssignUserId}
              placeholder={t('selectAssignee')}
              style={{ width: 280 }}
              options={(assignableUsers ?? []).map((u) => ({
                value: u.userId,
                label: (
                  <Space size={4}>
                    <span>{u.displayName}</span>
                    <Typography.Text type="secondary">{u.role}</Typography.Text>
                    {u.domainCapabilities.map((cap) => (
                      <Tag key={cap} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{cap}</Tag>
                    ))}
                  </Space>
                ),
              }))}
            />
            <Button onClick={handleAssign} loading={assignMutation.isPending} disabled={!assignUserId}>
              {t('assign')}
            </Button>
          </Space>
        </div>
      )}

      {/* State-aware action buttons */}
      {dispute.status === DisputeStatus.Open && (
        <Space wrap>
          <Button
            type="primary"
            onClick={() => handleTransitionTo('under_review')}
            loading={transitionMutation.isPending}
          >
            {t('startReview')}
          </Button>
          {dispute.canRequestEvidence && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setEvidenceModalOpen(true)}>
              {t('requestEvidenceFromParties')}
            </Button>
          )}
          <Popconfirm
            title={t('cancelCaseConfirm')}
            onConfirm={() => handleTransitionTo('cancelled')}
            okButtonProps={{ loading: transitionMutation.isPending, danger: true }}
          >
            <Button danger>{t('cancelCase')}</Button>
          </Popconfirm>
        </Space>
      )}

      {dispute.status === DisputeStatus.AwaitingRespondent && (
        <Space wrap>
          <Button
            type="primary"
            onClick={() => handleTransitionTo('under_review')}
            loading={transitionMutation.isPending}
          >
            {t('startReview')}
          </Button>
          <Popconfirm
            title={t('cancelCaseConfirm')}
            onConfirm={() => handleTransitionTo('cancelled')}
            okButtonProps={{ loading: transitionMutation.isPending, danger: true }}
          >
            <Button danger>{t('cancelCase')}</Button>
          </Popconfirm>
        </Space>
      )}

      {dispute.status === DisputeStatus.AwaitingEvidence && (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Alert
            type="info"
            showIcon
            message={t('awaitingEvidenceInfo')}
          />
          {hasNewEvidence && (
            <Tag color="success" style={{ marginBottom: 4 }}>{t('newEvidenceReceived')}</Tag>
          )}
          <Space wrap>
            <Button
              type="primary"
              onClick={() => handleTransitionTo('under_review')}
              loading={transitionMutation.isPending}
            >
              {t('resumeReview')}
            </Button>
            <Button onClick={() => handleTransitionTo('awaiting_internal_review')} loading={transitionMutation.isPending}>
              {t('moveToInternalReview')}
            </Button>
            {dispute.canRequestEvidence && (
              <Button icon={<ExclamationCircleOutlined />} onClick={() => setEvidenceModalOpen(true)}>
                {t('requestMoreEvidence')}
              </Button>
            )}
            <Popconfirm
              title={t('cancelCaseConfirm')}
              onConfirm={() => handleTransitionTo('cancelled')}
              okButtonProps={{ loading: transitionMutation.isPending, danger: true }}
            >
              <Button danger>{t('cancelCase')}</Button>
            </Popconfirm>
          </Space>
        </Space>
      )}

      {dispute.status === DisputeStatus.UnderReview && (
        <Space wrap>
          {dispute.canRequestEvidence && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setEvidenceModalOpen(true)}>
              {t('requestEvidenceFromParties')}
            </Button>
          )}
          <Button onClick={() => handleTransitionTo('awaiting_internal_review')} loading={transitionMutation.isPending}>
            {t('moveToInternalReview')}
          </Button>
          {dispute.canAddFinding && (
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                setFindingDomain(dispute.domain ?? '')
                setFindingModalOpen(true)
              }}
            >
              {t('addInternalFinding')}
            </Button>
          )}
          {dispute.canResolve && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveDrawerOpen(true)}>
              {t('resolveCase')}
            </Button>
          )}
          {dispute.canReject && (
            <Popconfirm
              title={t('rejectDisputeConfirm')}
              description={
                <Input.TextArea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReason')}
                />
              }
              onConfirm={handleReject}
              okButtonProps={{ loading: rejectMutation.isPending, disabled: !rejectReason.trim(), danger: true }}
            >
              <Button danger icon={<CloseCircleOutlined />}>{t('rejectCase')}</Button>
            </Popconfirm>
          )}
        </Space>
      )}

      {dispute.status === DisputeStatus.AwaitingInternalReview && (
        <Space wrap>
          <Button onClick={() => handleTransitionTo('under_review')} loading={transitionMutation.isPending}>
            {t('returnToReview')}
          </Button>
          {dispute.canAddFinding && (
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                setFindingDomain(dispute.domain ?? '')
                setFindingModalOpen(true)
              }}
            >
              {t('addInternalFinding')}
            </Button>
          )}
          {dispute.canResolve && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveDrawerOpen(true)}>
              {t('resolveCase')}
            </Button>
          )}
          {dispute.canReject && (
            <Popconfirm
              title={t('rejectDisputeConfirm')}
              description={
                <Input.TextArea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReason')}
                />
              }
              onConfirm={handleReject}
              okButtonProps={{ loading: rejectMutation.isPending, disabled: !rejectReason.trim(), danger: true }}
            >
              <Button danger icon={<CloseCircleOutlined />}>{t('rejectCase')}</Button>
            </Popconfirm>
          )}
        </Space>
      )}

      {dispute.status === DisputeStatus.AwaitingResolutionApproval && (
        <Space wrap>
          {dispute.canResolve && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveDrawerOpen(true)}>
              {t('resolveCase')}
            </Button>
          )}
          {dispute.canReject && (
            <Popconfirm
              title={t('rejectDisputeConfirm')}
              description={
                <Input.TextArea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReason')}
                />
              }
              onConfirm={handleReject}
              okButtonProps={{ loading: rejectMutation.isPending, disabled: !rejectReason.trim(), danger: true }}
            >
              <Button danger icon={<CloseCircleOutlined />}>{t('rejectCase')}</Button>
            </Popconfirm>
          )}
        </Space>
      )}

      {/* Fallback for other non-terminal statuses: legacy request-evidence + add-finding + resolve + reject */}
      {!isTerminal &&
        dispute.status !== DisputeStatus.Open &&
        dispute.status !== DisputeStatus.AwaitingRespondent &&
        dispute.status !== DisputeStatus.AwaitingEvidence &&
        dispute.status !== DisputeStatus.UnderReview &&
        dispute.status !== DisputeStatus.AwaitingInternalReview &&
        dispute.status !== DisputeStatus.AwaitingResolutionApproval && (
        <Space wrap>
          {dispute.canRequestEvidence && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setEvidenceModalOpen(true)}>
              {t('requestEvidenceFromParties')}
            </Button>
          )}
          {dispute.canAddFinding && (
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                setFindingDomain(dispute.domain ?? '')
                setFindingModalOpen(true)
              }}
            >
              {t('addInternalFinding')}
            </Button>
          )}
          {dispute.canResolve && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveDrawerOpen(true)}>
              {t('resolveCase')}
            </Button>
          )}
          {dispute.canReject && (
            <Popconfirm
              title={t('rejectDisputeConfirm')}
              description={
                <Input.TextArea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReason')}
                />
              }
              onConfirm={handleReject}
              okButtonProps={{ loading: rejectMutation.isPending, disabled: !rejectReason.trim(), danger: true }}
            >
              <Button danger icon={<CloseCircleOutlined />}>{t('rejectCase')}</Button>
            </Popconfirm>
          )}
        </Space>
      )}
    </Space>
  )

  return (
    <div style={{ padding: isMobile ? 0 : undefined }}>
      {/* Resolution banner */}
      {dispute.resolvedAt && (
        <Result
          status="success"
          title={t('caseResolved')}
          subTitle={dispute.resolutionReason}
          style={{ marginBottom: 16, padding: '16px 24px' }}
          extra={
            <Space direction="vertical" size={4} style={{ textAlign: 'center' }}>
              {dispute.resolutionOutcome && <Tag color="green" style={{ fontSize: 14 }}>{ta(`disputeDetail.outcomeOption.${dispute.resolutionOutcome}`, dispute.resolutionOutcome)}</Tag>}
              {dispute.resolvedByDisplayName && (
                <Typography.Text type="secondary">
                  {t('resolvedBy')}: {dispute.resolvedByDisplayName} - {dayjs(dispute.resolvedAt).format('DD/MM/YYYY HH:mm')}
                </Typography.Text>
              )}
            </Space>
          }
        />
      )}

      {/* Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle" style={{ marginBottom: 8 }}>
          <Space size={4}>
            <Typography.Title level={4} style={{ margin: 0 }} copyable={false}>
              {dispute.disputeNumber}
            </Typography.Title>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyDisputeNumber} />
          </Space>
          <StatusBadge status={dispute.status} />
          {dispute.domain && <Tag color="geekblue">{t(`domainLabel.${dispute.domain}`, dispute.domain)}</Tag>}
          {dispute.caseType && <Tag color="cyan">{t(`caseTypeLabel.${dispute.caseType}`, dispute.caseType)}</Tag>}
          {dispute.assignedToDisplayName ? (
            <Tag icon={<TeamOutlined />} color="processing">
              {t('assignedTo')} {dispute.assignedToDisplayName}
            </Tag>
          ) : (
            <Tag>{t('unassigned')}</Tag>
          )}
          {isAwaitingEvidence && (
            <Tag color="warning">
              {t('awaitingEvidenceSince')} {dayjs(dispute.requestedEvidenceAt).format('DD/MM/YYYY HH:mm')}
            </Tag>
          )}
        </Space>
        {dispute.title && (
          <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
            {dispute.title}
          </Typography.Paragraph>
        )}
        {dispute.description && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            {dispute.description}
          </Typography.Paragraph>
        )}
      </Card>

      {/* Context snapshot - collapsible */}
      {contextSnapshot && (
        <Collapse
          items={[{
            key: 'context',
            label: t('caseContext'),
            children: (
              <div>
                {Object.entries(contextSnapshot).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                    <Typography.Text strong style={{ minWidth: 160, fontSize: 12 }}>{t(`contextField.${key}`, key)}:</Typography.Text>
                    {renderContextFieldValue(key, value)}
                  </div>
                ))}
              </div>
            ),
          }]}
          defaultActiveKey={[]}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Two-column main body */}
      <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
        {/* Left column - External thread */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Space>
                <span>{t('externalThread')}</span>
                <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 'normal' }}>
                  {t('visibleToBuyerSeller')}
                </Typography.Text>
              </Space>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            <div style={{ flex: 1, maxHeight: 400, overflow: 'auto', marginBottom: 12 }}>
              {externalMessages.length === 0 ? (
                <Empty description={t('noMessages')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                externalMessages.map((m) => renderMessage(m, 'var(--color-accent, #1677ff)'))
              )}
            </div>
            {!isTerminal && (
              <Space.Compact style={{ width: '100%' }}>
                <Input.TextArea
                  value={externalMessageText}
                  onChange={(e) => setExternalMessageText(e.target.value)}
                  placeholder={t('typeExternalMessage')}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendExternalMessage()
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendExternalMessage}
                  loading={addMessageMutation.isPending}
                  disabled={!externalMessageText.trim()}
                >
                  {t('send')}
                </Button>
              </Space.Compact>
            )}
          </Card>
        </Col>

        {/* Right column - Internal */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            style={{ height: '100%' }}
            styles={{ body: { padding: 0 } }}
          >
            <Tabs
              defaultActiveKey="notes"
              style={{ padding: '0 12px' }}
              items={[
                {
                  key: 'notes',
                  label: t('internalNotes'),
                  children: (
                    <div style={{ padding: '0 0 12px' }}>
                      <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 12 }}>
                        {internalMessages.length === 0 ? (
                          <Empty description={t('noInternalNotes')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          internalMessages.map((m) => renderMessage(m, 'var(--color-warning, orange)'))
                        )}
                      </div>
                      {!isTerminal && (
                        <>
                          <Space.Compact style={{ width: '100%' }}>
                            <Input.TextArea
                              value={internalMessageText}
                              onChange={(e) => setInternalMessageText(e.target.value)}
                              placeholder={t('typeInternalNote')}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              style={{ flex: 1 }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendInternalMessage()
                                }
                              }}
                            />
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={handleSendInternalMessage}
                              loading={addMessageMutation.isPending}
                              disabled={!internalMessageText.trim()}
                            >
                              {t('send')}
                            </Button>
                          </Space.Compact>
                          <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                            {t('internalOnly')}
                          </Typography.Text>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'findings',
                  label: t('findings'),
                  children: (
                    <div style={{ maxHeight: 500, overflow: 'auto', padding: '0 0 12px' }}>
                      {(dispute.findings ?? []).length === 0 ? (
                        <Empty description={t('noFindings')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        dispute.findings.map(renderFinding)
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Case Actions */}
      {!dispute.resolvedAt && (
        <>
          {isMobile ? (
            <>
              <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: 'var(--color-bg-primary)', zIndex: 10, borderTop: '1px solid var(--color-border)' }}>
                <Button type="primary" block onClick={() => setMobileActionsOpen(true)}>
                  {t('actions')}
                </Button>
              </div>
              <Drawer
                title={t('caseActions')}
                placement="bottom"
                open={mobileActionsOpen}
                onClose={() => setMobileActionsOpen(false)}
                height="auto"
              >
                {renderCaseActions()}
              </Drawer>
            </>
          ) : (
            <Card size="small" title={t('caseActions')} style={{ marginBottom: 16 }}>
              {renderCaseActions()}
            </Card>
          )}
        </>
      )}

      {/* Evidence gallery - collapsible */}
      {allAttachments.length > 0 && (
        <Collapse
          items={[{
            key: 'evidence',
            label: t('allEvidence'),
            children: (
              <Image.PreviewGroup>
                <Space wrap>
                  {allAttachments.map((e) => (
                    <DisputeAttachmentRenderer
                      key={e.id}
                      resourceType={e.resourceType}
                      format={e.format}
                      secureUrl={e.secureUrl ?? ''}
                      fileName={e.fileName}
                      bytes={e.bytes}
                      durationSeconds={e.durationSeconds}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ),
          }]}
          defaultActiveKey={[]}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Request Evidence Modal */}
      <Modal
        title={t('requestEvidence')}
        open={evidenceModalOpen}
        onOk={handleRequestEvidence}
        onCancel={() => setEvidenceModalOpen(false)}
        confirmLoading={requestEvidenceMutation.isPending}
        okButtonProps={{ disabled: !evidenceRequestMsg.trim() }}
      >
        <div style={{ marginBottom: 4 }}>{t('messageToParties')}</div>
        <Input.TextArea
          rows={3}
          value={evidenceRequestMsg}
          onChange={(e) => setEvidenceRequestMsg(e.target.value)}
          placeholder={t('evidenceRequestMessage')}
        />
      </Modal>

      {/* Add Finding Modal */}
      <Modal
        title={t('addFinding')}
        open={findingModalOpen}
        onOk={handleAddFinding}
        onCancel={() => setFindingModalOpen(false)}
        confirmLoading={addFindingMutation.isPending}
        okButtonProps={{ disabled: !findingDomain.trim() || !findingSummary.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 4 }}>{t('domain')}</div>
            <Select
              value={findingDomain || undefined}
              onChange={setFindingDomain}
              style={{ width: '100%' }}
              placeholder={t('selectDomain')}
              options={[
                { value: 'order', label: ta('disputeDetail.domainOption.order') },
                { value: 'payment', label: ta('disputeDetail.domainOption.payment') },
                { value: 'shipping', label: ta('disputeDetail.domainOption.shipping') },
                { value: 'auction', label: ta('disputeDetail.domainOption.auction') },
                { value: 'warehouse', label: ta('disputeDetail.domainOption.warehouse') },
                { value: 'verification', label: ta('disputeDetail.domainOption.verification') },
              ]}
              showSearch
              allowClear
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('findingSummary')} *</div>
            <Input.TextArea rows={3} value={findingSummary} onChange={(e) => setFindingSummary(e.target.value)} placeholder={t('describeFinding')} />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('recommendation')}</div>
            <Select
              value={findingRecommendation || undefined}
              onChange={setFindingRecommendation}
              style={{ width: '100%' }}
              placeholder={t('selectRecommendation')}
              options={RECOMMENDATION_OPTIONS}
              allowClear
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('referencedEvidence')}</div>
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              placeholder={t('selectEvidenceRefs')}
              value={findingSelectedRefs.map((r) => r.targetId)}
              onChange={(vals: string[]) => {
                setFindingSelectedRefs(
                  vals.map((v) => {
                    const existing = findingSelectedRefs.find((r) => r.targetId === v)
                    if (existing) return existing
                    const opt = evidencePickerOptions.find((o) => o.value === v)
                    return { targetId: v, label: opt?.label ?? v, referenceType: opt?.type ?? 'evidence' }
                  })
                )
              }}
              options={evidencePickerOptions.map((o) => ({
                value: o.value,
                label: o.label,
                title: o.label,
              }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('referenceNote')}</div>
            <Input.TextArea
              rows={2}
              maxLength={500}
              value={findingNote}
              onChange={(e) => setFindingNote(e.target.value)}
              placeholder={t('referenceNotePlaceholder')}
              showCount
            />
          </div>
        </Space>
      </Modal>

      {/* Resolve Drawer */}
      <Drawer
        title={t('resolveCase')}
        open={resolveDrawerOpen}
        onClose={() => setResolveDrawerOpen(false)}
        width={520}
        extra={
          <Button
            type="primary"
            onClick={handleResolve}
            loading={resolveMutation.isPending}
            disabled={!resolveOutcome || !resolveReason.trim() || actionSetValidation.errors.length > 0}
          >
            {t('confirm')}
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {latestFinding?.verdictRecommendation && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {t('latestFindingRecommendation')}:
              </Typography.Text>
              <div><Tag color="blue" style={{ marginTop: 4 }}>{ta(`disputeDetail.outcomeOption.${latestFinding.verdictRecommendation}`, latestFinding.verdictRecommendation)}</Tag></div>
            </div>
          )}
          <div>
            <div style={{ marginBottom: 4 }}>{t('outcome')} *</div>
            <Select
              value={resolveOutcome || undefined}
              onChange={setResolveOutcome}
              options={OUTCOME_OPTIONS}
              style={{ width: '100%' }}
              placeholder={t('selectOutcome')}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('reason')} *</div>
            <Input.TextArea rows={3} value={resolveReason} onChange={(e) => setResolveReason(e.target.value)} placeholder={t('resolutionReason')} />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>{t('resolutionActions')}</div>
            <ResolutionActionBuilder
              value={resolveActionSet}
              onChange={setResolveActionSet}
              domain={dispute.domain}
              outcome={resolveOutcome}
              errors={actionSetValidation.errors}
            />
            {actionSetValidation.warnings.map((w, i) => (
              <Alert key={i} type="warning" showIcon message={w} style={{ marginTop: 8 }} />
            ))}
          </div>
        </Space>
      </Drawer>
    </div>
  )
}
