import { useMemo } from 'react'
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
} from 'antd'
import {
  CheckCircleOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  ShopOutlined,
  AuditOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useSearchParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import apiClient from '@/lib/axios'
import type { TermsDocumentDto } from '@/types'
import { formatFileSize } from '@/utils/format'

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

interface TypeConfig {
  label: string
  description: string
  icon: React.ReactNode
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  platform: {
    label: 'Platform Terms',
    description: 'These terms govern your use of the OIO auction platform, including account management, privacy, and acceptable use.',
    icon: <GlobalOutlined />,
  },
  seller: {
    label: 'Seller Agreement',
    description: 'These terms cover your obligations as a seller, including commission rates, shipping requirements, and dispute resolution.',
    icon: <ShopOutlined />,
  },
  bidder: {
    label: 'Bidder Terms',
    description: 'These terms cover your responsibilities when placing bids, including payment obligations, deposit requirements, and buyer protections.',
    icon: <AuditOutlined />,
  },
}

function getTypeConfig(type: string, t: (key: string, fallback: string) => string): TypeConfig {
  const config = TYPE_CONFIG[type]
  if (config) {
    return {
      label: t(`terms.type.${type}`, config.label),
      description: t(`terms.type.${type}Desc`, config.description),
      icon: config.icon,
    }
  }
  return {
    label: t(`terms.type.${type}`, type.charAt(0).toUpperCase() + type.slice(1) + ' Terms'),
    description: t(`terms.type.${type}Desc`, `Terms and conditions for ${type} usage.`),
    icon: <FileTextOutlined />,
  }
}

// ── Component ──────────────────────────────────────────────────────────

const TYPE_TITLES: Record<string, string> = {
  platform: 'Platform Terms of Service',
  seller: 'Seller Agreement',
  bidder: 'Bidder Terms',
}

export default function TermsPage() {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const filterType = searchParams.get('type') ?? undefined
  const returnTo = searchParams.get('returnTo')
  const validReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null
  const isFocusedMode = !!filterType

  const { data: activeTerms, isLoading: termsLoading } = useActiveTerms()
  const { data: acceptedTerms, isLoading: acceptedLoading } = useMyAcceptedTerms()
  const acceptMutation = useAcceptTerms()

  const acceptedIds = useMemo(
    () => new Set((acceptedTerms ?? []).map((a) => a.document?.id).filter(Boolean)),
    [acceptedTerms],
  )

  const getAcceptedDate = (termsId: string) =>
    acceptedTerms?.find((a) => a.document?.id === termsId)?.acceptedAt

  // Group terms by type, sorted: pending first within each group
  const groupedTerms = useMemo(() => {
    if (!activeTerms) return []
    const groups = new Map<string, TermsDocumentDto[]>()
    for (const term of activeTerms) {
      const existing = groups.get(term.type) ?? []
      existing.push(term)
      groups.set(term.type, existing)
    }
    // Sort within each group: pending first, then accepted
    for (const [type, terms] of groups) {
      groups.set(
        type,
        terms.sort((a, b) => {
          const aAccepted = acceptedIds.has(a.id) ? 1 : 0
          const bAccepted = acceptedIds.has(b.id) ? 1 : 0
          return aAccepted - bAccepted
        }),
      )
    }
    let entries = Array.from(groups.entries())
    // In focused mode, filter to only the requested type
    if (filterType) {
      entries = entries.filter(([type]) => type === filterType)
    }
    return entries
  }, [activeTerms, acceptedIds, filterType])

  // Check if all terms of the filtered type are accepted (for Continue button)
  const filteredTerms = filterType
    ? activeTerms?.filter((t) => t.type === filterType) ?? []
    : activeTerms ?? []
  const allAccepted = filteredTerms.length > 0
    ? filteredTerms.every((t) => acceptedIds.has(t.id))
    : false

  const onAccept = async (termsId: string) => {
    try {
      await acceptMutation.mutateAsync(termsId)
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        {isFocusedMode
          ? t(`terms.type.${filterType}`, TYPE_TITLES[filterType!] ?? 'Terms')
          : t('terms.pageTitle', 'Terms & Conditions')}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {isFocusedMode
          ? t('terms.focusedSubtitle', 'Please review and accept the following terms to continue.')
          : t('terms.pageSubtitle', 'Review and accept the terms that apply to your use of the platform.')}
      </Typography.Paragraph>

      {/* All accepted banner */}
      {allAccepted && filteredTerms.length > 0 && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message={t('terms.allAccepted', 'All terms have been accepted')}
          description={t('terms.allAcceptedDesc', "You're all set! You have accepted all required terms.")}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Continue button in focused mode after all accepted */}
      {isFocusedMode && allAccepted && validReturnTo && (
        <Button
          type="primary"
          size="large"
          block
          onClick={() => navigate(validReturnTo)}
          style={{ marginBottom: 24, height: 48, fontWeight: 500, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('terms.continue', 'Continue')}
        </Button>
      )}

      {/* No terms state */}
      {!activeTerms?.length && (
        <Alert
          type="info"
          showIcon
          message={t('terms.noTerms', 'No terms available')}
          description={t('terms.noTermsDesc', 'There are currently no terms to review.')}
        />
      )}

      {/* Grouped terms by type */}
      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        {groupedTerms.map(([type, terms]) => {
          const config = getTypeConfig(type, t)

          return (
            <section key={type}>
              {/* Section header */}
              <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 20, color: 'var(--color-accent)' }}>{config.icon}</span>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {config.label}
                </Typography.Title>
              </Flex>
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                {config.description}
              </Typography.Paragraph>

              {/* Term cards */}
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {terms.map((term) => {
                  const accepted = acceptedIds.has(term.id)
                  const acceptedDate = getAcceptedDate(term.id)

                  return (
                    <Card
                      key={term.id}
                      size="small"
                      style={{
                        borderColor: accepted
                          ? 'rgba(74, 124, 89, 0.2)'
                          : 'rgba(196, 146, 61, 0.3)',
                        background: accepted
                          ? undefined
                          : 'rgba(196, 146, 61, 0.03)',
                      }}
                    >
                      <Flex justify="space-between" align="flex-start" gap={isMobile ? 12 : 16} wrap="wrap" vertical={isMobile}>
                        {/* Left: document info */}
                        <div style={{ flex: 1, minWidth: isMobile ? undefined : 200 }}>
                          <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                            <FilePdfOutlined style={{ fontSize: 16, color: 'var(--color-accent)' }} />
                            <Typography.Text strong>
                              {term.fileName ?? `${config.label} v${term.version}`}
                            </Typography.Text>
                            <Tag color="blue" style={{ marginLeft: 4 }}>v{term.version}</Tag>
                          </Flex>

                          {/* Document link */}
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: 6,
                              background: 'var(--color-bg-surface)',
                              border: '1px solid var(--color-border-light)',
                              marginBottom: 8,
                            }}
                          >
                            {term.contentUrl ? (
                              <Flex align="center" gap={8}>
                                <FilePdfOutlined style={{ color: 'var(--color-text-secondary)' }} />
                                <div style={{ flex: 1 }}>
                                  <a
                                    href={term.contentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 13, fontWeight: 500 }}
                                  >
                                    {t('terms.viewDocument', 'View Document')} ↗
                                  </a>
                                  {term.fileSize != null && (
                                    <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                      ({formatFileSize(term.fileSize)})
                                    </Typography.Text>
                                  )}
                                </div>
                              </Flex>
                            ) : (
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {t('terms.noDocument', 'Document not available')}
                              </Typography.Text>
                            )}
                          </div>

                          {/* Published date */}
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {term.publishedAt
                              ? `${t('terms.published', 'Published')}: ${dayjs(term.publishedAt).format('DD/MM/YYYY')}`
                              : `${t('terms.created', 'Created')}: ${dayjs(term.createdAt).format('DD/MM/YYYY')}`}
                          </Typography.Text>
                        </div>

                        {/* Right: status + action */}
                        <div style={{ textAlign: isMobile ? 'left' : 'right', minWidth: isMobile ? undefined : 150 }}>
                          {accepted ? (
                            <>
                              <Tag icon={<CheckCircleOutlined />} color="success">
                                {t('terms.accepted', 'Accepted')}
                              </Tag>
                              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                {dayjs(acceptedDate).format('DD/MM/YYYY HH:mm')}
                              </Typography.Text>
                            </>
                          ) : (
                            <>
                              <Tag icon={<ClockCircleOutlined />} color="warning" style={{ marginBottom: 8 }}>
                                {t('terms.pending', 'Pending')}
                              </Tag>
                              <div>
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => onAccept(term.id)}
                                  loading={acceptMutation.isPending}
                                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                                >
                                  {t('terms.accept', 'Accept')}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </Flex>
                    </Card>
                  )
                })}
              </Space>
            </section>
          )
        })}
      </Space>
    </div>
  )
}
