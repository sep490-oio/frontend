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
  Empty,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { SANS_FONT } from '@/styles/tokens'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import apiClient from '@/lib/axios'
import { useAppSelector } from '@/app/store'
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
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  const roles = useMemo(() => {
    if (!accessToken) return []
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const r: string[] = Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []
      return r.map((role) => role.toLowerCase())
    } catch {
      return []
    }
  }, [accessToken])

  const { data: activeTermsRaw, isLoading: termsLoading } = useActiveTerms()
  
  const activeTerms = useMemo(() => {
    if (!activeTermsRaw) return []
    const universalTypes = new Set(['platform', 'bidder', 'privacy', 'other'])
    const userRoles = new Set(roles)
    return activeTermsRaw.filter(t => universalTypes.has(t.type) || userRoles.has(t.type))
  }, [activeTermsRaw, roles])

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
    <Space direction="vertical" style={{ width: '100%' }} size={24}>
      {grouped.length === 0 && (
        <Alert
          type="info"
          showIcon
          message={t('terms.noTerms', 'No terms available')}
          description={t('terms.noTermsDesc', 'There are currently no terms to review.')}
          style={{ borderRadius: 16 }}
        />
      )}
      {grouped.map(([groupKey, list]) => (
        <section key={groupKey}>
          <Typography.Title level={5} style={{ marginBottom: 12, fontFamily: SANS_FONT, fontWeight: 600, textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
            {groupLabel(groupKey, t)}
          </Typography.Title>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {list.map((term) => {
              const accepted = acceptedMap.has(term.id)
              const isSelected = term.id === selectedId
              return (
                <Card
                  key={term.id}
                  hoverable
                  onClick={() => setSelectedId(term.id)}
                  style={{
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                    background: isSelected ? 'var(--color-accent-light)' : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    borderRadius: 16,
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Flex justify="space-between" align="center" gap={12}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <FilePdfOutlined style={{ color: 'var(--color-accent)', fontSize: 18 }} />
                        <Typography.Text strong ellipsis style={{ fontSize: 15, color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                          {term.fileName ?? groupLabel(groupKey, t)}
                        </Typography.Text>
                      </Flex>
                      <Flex align="center" gap={8}>
                        <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>v{term.version}</Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {term.publishedAt
                            ? `${dayjs(term.publishedAt).format('DD/MM/YYYY')}`
                            : `${dayjs(term.createdAt).format('DD/MM/YYYY')}`}
                        </Typography.Text>
                      </Flex>
                    </div>
                    {accepted ? (
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 20 }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: 'var(--color-warning)', fontSize: 20 }} />
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
    <Card 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)'
      }}
      styles={{ body: { padding: isMobile ? '20px' : '32px' } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
          <div>
            <Typography.Title level={3} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600 }}>
              {selected.fileName ?? groupLabel(selected.type, t)}
            </Typography.Title>
            <Space size={12} wrap style={{ marginTop: 8 }}>
              <Tag color="blue" style={{ borderRadius: 8, padding: '4px 12px' }}>v{selected.version}</Tag>
              {selected.publishedAt && (
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  {t('terms.published', 'Published')}: {dayjs(selected.publishedAt).format('DD/MM/YYYY')}
                </Typography.Text>
              )}
            </Space>
          </div>
          {selectedAccepted ? (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 10, padding: '6px 16px', fontSize: 12 }}>
              {t('terms.accepted', 'Accepted')}
              {selectedAcceptedAt ? ` · ${dayjs(selectedAcceptedAt).format('DD/MM/YYYY')}` : ''}
            </Tag>
          ) : (
            <Tag icon={<ClockCircleOutlined />} color="warning" style={{ borderRadius: 10, padding: '6px 16px', fontSize: 12 }}>
              {t('terms.pending', 'Pending')}
            </Tag>
          )}
        </Flex>

        {selected.contentUrl && !previewErrored ? (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <object
              data={`${selected.contentUrl}#toolbar=1`}
              type="application/pdf"
              onError={() => setPreviewErrored(true)}
              style={{
                width: '100%',
                height: isMobile ? '50vh' : '70vh',
                minHeight: isMobile ? 400 : 600,
                display: 'block'
              }}
            >
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--color-bg-surface)' }}>
                <Alert
                  type="info"
                  showIcon
                  message={t('terms.previewUnavailable', 'Preview unavailable')}
                  description={t('terms.useActionsBelow', 'Use the actions below to open or download the document.')}
                />
              </div>
            </object>
          </div>
        ) : (
          <Alert
            type="warning"
            showIcon
            style={{ borderRadius: 16, padding: 16 }}
            message={t('terms.previewUnavailable', 'Preview unavailable')}
            description={
              selected.contentUrl
                ? t('terms.useActionsBelow', 'Use the actions below to open or download the document.')
                : t('terms.noDocument', 'Document not available')
            }
          />
        )}

        <Flex gap={12} wrap="wrap" justify={isMobile ? 'stretch' : 'flex-start'}>
          {selected.contentUrl && (
            <>
              <Button
                size="large"
                block={isMobile}
                onClick={() => window.open(selected.contentUrl, '_blank', 'noopener,noreferrer')}
                style={{ borderRadius: 12, fontWeight: 600 }}
              >
                {t('terms.openInNewTab', 'Open in new tab')}
              </Button>
              <a href={selected.contentUrl} download style={{ display: isMobile ? 'block' : 'inline-block', width: isMobile ? '100%' : 'auto' }}>
                <Button size="large" block={isMobile} style={{ borderRadius: 12, fontWeight: 600, width: '100%' }}>{t('terms.download', 'Download')}</Button>
              </a>
            </>
          )}
          {!selectedAccepted && (
            <Button
              type="primary"
              size="large"
              block={isMobile}
              loading={acceptMutation.isPending}
              onClick={handleAccept}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', borderRadius: 12, fontWeight: 600, padding: '0 40px' }}
            >
              {t('terms.accept', 'Accept')}
            </Button>
          )}
        </Flex>
      </Space>
    </Card>
  ) : (
    <Card style={{ borderRadius: 24, textAlign: 'center', padding: 80, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <Empty description={t('terms.selectToPreview', 'Select a document to preview')} />
    </Card>
  )

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 16px 80px' : '0 24px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <Typography.Title level={2} style={{ marginBottom: 4, fontFamily: SANS_FONT, fontWeight: 600, fontSize: isMobile ? 24 : 32 }}>
          {t('terms.pageTitle', 'Terms & Conditions')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
          {t('terms.pageSubtitle', 'Review and accept the terms that apply to your use of the platform.')}
        </Typography.Paragraph>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={8}>
          {leftPane}
        </Col>
        <Col xs={24} lg={16}>
          {rightPane}
        </Col>
      </Row>
    </div>
  )
}
