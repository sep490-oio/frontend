import { useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Spin,
  Tag,
  Space,
  Alert,
  App,
  Flex,
  Row,
  Col,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import apiClient from '@/lib/axios'
import type { TermsDocumentDto } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────

interface AcceptedTermsDto {
  id: string
  acceptedAt: string
  document: { id: string; type: string; version: number }
}

// ── API hooks ──────────────────────────────────────────────────────────

function useActiveTerms() {
  return useQuery({
    queryKey: queryKeys.terms.active(),
    queryFn: async () => {
      const res = await apiClient.get<TermsDocumentDto[]>('/terms/active')
      return res.data
    },
  })
}

function useMyAcceptedTerms() {
  return useQuery({
    queryKey: queryKeys.terms.myAccepted(),
    queryFn: async () => {
      const res = await apiClient.get<AcceptedTermsDto[]>('/me/terms')
      return res.data
    },
  })
}

function useAcceptTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (termsId: string) => {
      await apiClient.post(`/me/terms/${termsId}/accept`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.terms.myAccepted() })
    },
  })
}

// ── Type config ────────────────────────────────────────────────────────

const GROUP_ORDER = ['platform', 'bidder', 'seller'] as const
const OTHER_GROUP = 'other'

function groupLabel(type: string, t: (k: string, d: string) => string): string {
  switch (type) {
    case 'platform':
      return t('terms.type.platform', 'Platform Terms')
    case 'bidder':
      return t('terms.type.bidder', 'Bidder Terms')
    case 'seller':
      return t('terms.type.seller', 'Seller Agreement')
    case 'privacy':
      return t('terms.type.privacy', 'Privacy Policy')
    case OTHER_GROUP:
      return t('terms.type.other', 'Other')
    default:
      return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function TermsPage() {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const { data: activeTerms, isLoading: termsLoading } = useActiveTerms()
  const { data: acceptedTerms, isLoading: acceptedLoading } = useMyAcceptedTerms()
  const acceptMutation = useAcceptTerms()

  const acceptedMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of acceptedTerms ?? []) {
      if (a.document?.id) map.set(a.document.id, a.acceptedAt)
    }
    return map
  }, [acceptedTerms])

  // Group terms: platform/bidder/seller first, then archive group.
  const grouped = useMemo(() => {
    const bucket = new Map<string, TermsDocumentDto[]>()
    for (const term of activeTerms ?? []) {
      const key = (GROUP_ORDER as readonly string[]).includes(term.type) ? term.type : OTHER_GROUP
      const list = bucket.get(key) ?? []
      list.push(term)
      bucket.set(key, list)
    }
    const ordered: Array<[string, TermsDocumentDto[]]> = []
    for (const key of GROUP_ORDER) {
      if (bucket.has(key)) ordered.push([key, bucket.get(key)!])
    }
    if (bucket.has(OTHER_GROUP)) ordered.push([OTHER_GROUP, bucket.get(OTHER_GROUP)!])
    return ordered
  }, [activeTerms])

  const flatTerms = useMemo(() => grouped.flatMap(([, list]) => list), [grouped])

  const firstPending = useMemo(
    () => flatTerms.find((term) => !acceptedMap.has(term.id)) ?? null,
    [flatTerms, acceptedMap],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Default selection: first pending if any, else first item.
  useEffect(() => {
    if (selectedId) return
    const target = firstPending ?? flatTerms[0] ?? null
    if (target) setSelectedId(target.id)
  }, [firstPending, flatTerms, selectedId])

  const selected = useMemo(
    () => flatTerms.find((term) => term.id === selectedId) ?? null,
    [flatTerms, selectedId],
  )
  const selectedAccepted = selected ? acceptedMap.has(selected.id) : false
  const selectedAcceptedAt = selected ? acceptedMap.get(selected.id) : undefined

  const [previewErrored, setPreviewErrored] = useState(false)
  useEffect(() => {
    setPreviewErrored(false)
  }, [selectedId])

  const handleAccept = async () => {
    if (!selected) return
    try {
      await acceptMutation.mutateAsync(selected.id)
      message.success(t('terms.acceptSuccess', 'Terms accepted successfully'))
    } catch {
      message.error(t('terms.acceptError', 'Failed to accept terms. Please try again.'))
    }
  }

  if (termsLoading || acceptedLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  // ── Left pane: grouped list ────────────────────────────────────────
  const leftPane = (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {grouped.length === 0 && (
        <Alert
          type="info"
          showIcon
          message={t('terms.noTerms', 'No terms available')}
          description={t('terms.noTermsDesc', 'There are currently no terms to review.')}
        />
      )}
      {grouped.map(([groupKey, list]) => (
        <section key={groupKey}>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            {groupLabel(groupKey, t)}
          </Typography.Title>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {list.map((term) => {
              const accepted = acceptedMap.has(term.id)
              const isSelected = term.id === selectedId
              return (
                <Card
                  key={term.id}
                  size="small"
                  hoverable
                  onClick={() => setSelectedId(term.id)}
                  style={{
                    borderColor: isSelected ? 'var(--color-accent)' : undefined,
                    background: isSelected ? 'rgba(196, 146, 61, 0.05)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <Flex justify="space-between" align="center" gap={8}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                        <FilePdfOutlined style={{ color: 'var(--color-accent)' }} />
                        <Typography.Text strong ellipsis>
                          {term.fileName ?? groupLabel(groupKey, t)}
                        </Typography.Text>
                        <Tag color="blue">v{term.version}</Tag>
                      </Flex>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {term.publishedAt
                          ? `${t('terms.published', 'Published')}: ${dayjs(term.publishedAt).format('DD/MM/YYYY')}`
                          : `${t('terms.created', 'Created')}: ${dayjs(term.createdAt).format('DD/MM/YYYY')}`}
                      </Typography.Text>
                    </div>
                    {accepted ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        {t('terms.accepted', 'Accepted')}
                      </Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} color="warning">
                        {t('terms.pending', 'Pending')}
                      </Tag>
                    )}
                  </Flex>
                </Card>
              )
            })}
          </Space>
        </section>
      ))}
    </Space>
  )

  // ── Right pane: preview + actions ──────────────────────────────────
  const rightPane = selected ? (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selected.fileName ?? groupLabel(selected.type, t)}
            </Typography.Title>
            <Space size={6} wrap style={{ marginTop: 4 }}>
              <Tag>{groupLabel(selected.type, t)}</Tag>
              <Tag color="blue">v{selected.version}</Tag>
              {selected.publishedAt && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('terms.published', 'Published')}: {dayjs(selected.publishedAt).format('DD/MM/YYYY')}
                </Typography.Text>
              )}
            </Space>
          </div>
          {selectedAccepted ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('terms.accepted', 'Accepted')}
              {selectedAcceptedAt ? ` · ${dayjs(selectedAcceptedAt).format('DD/MM/YYYY')}` : ''}
            </Tag>
          ) : (
            <Tag icon={<ClockCircleOutlined />} color="warning">
              {t('terms.pending', 'Pending')}
            </Tag>
          )}
        </Flex>

        {selected.contentUrl && !previewErrored ? (
          <object
            data={`${selected.contentUrl}#toolbar=1`}
            type="application/pdf"
            onError={() => setPreviewErrored(true)}
            style={{
              width: '100%',
              height: '70vh',
              minHeight: 480,
              border: '1px solid var(--color-border)',
              borderRadius: 6,
            }}
          >
            <Alert
              type="info"
              showIcon
              message={t('terms.previewUnavailable', 'Preview unavailable')}
              description={t('terms.useActionsBelow', 'Use the actions below to open or download the document.')}
            />
          </object>
        ) : (
          <Alert
            type="warning"
            showIcon
            message={t('terms.previewUnavailable', 'Preview unavailable')}
            description={
              selected.contentUrl
                ? t('terms.useActionsBelow', 'Use the actions below to open or download the document.')
                : t('terms.noDocument', 'Document not available')
            }
          />
        )}

        <Flex gap={8} wrap="wrap">
          {selected.contentUrl && (
            <>
              <Button
                onClick={() => window.open(selected.contentUrl, '_blank', 'noopener,noreferrer')}
              >
                {t('terms.openInNewTab', 'Open in new tab')}
              </Button>
              <a href={selected.contentUrl} download>
                <Button>{t('terms.download', 'Download')}</Button>
              </a>
            </>
          )}
          {!selectedAccepted && (
            <Button
              type="primary"
              loading={acceptMutation.isPending}
              onClick={handleAccept}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('terms.accept', 'Accept')}
            </Button>
          )}
        </Flex>
      </Space>
    </Card>
  ) : (
    <Alert
      type="info"
      showIcon
      message={t('terms.selectToPreview', 'Select a document to preview')}
    />
  )

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        {t('terms.pageTitle', 'Terms & Conditions')}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {t('terms.pageSubtitle', 'Review and accept the terms that apply to your use of the platform.')}
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={9}>
          {leftPane}
        </Col>
        <Col xs={24} md={15}>
          {rightPane}
        </Col>
      </Row>
    </div>
  )
}
