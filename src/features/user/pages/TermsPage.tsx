import {
  Typography,
  Card,
  Button,
  Spin,
  Tag,
  Space,
  Empty,
  App,
} from 'antd'
import {
  CheckCircleOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import apiClient from '@/lib/axios'
import type { TermsDocumentDto } from '@/types'
import { formatFileSize } from '@/utils/format'

const { Title, Text, Paragraph } = Typography

// ── Types (local, for accepted terms) ────────────────────────────────

interface AcceptedTermsDto {
  termsId: string
  termsVersion: string
  acceptedAt: string
}

// ── API hooks ─────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────

export default function TermsPage() {
  const { t: _t } = useTranslation('common')
  const { message } = App.useApp()

  const { data: activeTerms, isLoading: termsLoading } = useActiveTerms()
  const { data: acceptedTerms, isLoading: acceptedLoading } = useMyAcceptedTerms()
  const acceptTerms = useAcceptTerms()

  const isAccepted = (termsId: string) =>
    acceptedTerms?.some((a) => a.termsId === termsId) ?? false

  const getAcceptedDate = (termsId: string) =>
    acceptedTerms?.find((a) => a.termsId === termsId)?.acceptedAt

  const onAccept = async (termsId: string) => {
    try {
      await acceptTerms.mutateAsync(termsId)
      message.success('Accepted terms successfully')
    } catch {
      message.error('Failed to accept terms')
    }
  }

  if (termsLoading || acceptedLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Terms of Service</Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Please review and accept the following terms to use the service.
      </Paragraph>

      {!activeTerms?.length ? (
        <Empty description="No terms available" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {activeTerms.map((terms) => {
            const accepted = isAccepted(terms.id)
            const acceptedDate = getAcceptedDate(terms.id)

            return (
              <Card
                key={terms.id}
                title={
                  <Space>
                    <FilePdfOutlined />
                    <span>{terms.fileName ?? `${terms.type} v${terms.version}`}</span>
                    <Tag color="blue">v{terms.version}</Tag>
                  </Space>
                }
                extra={
                  accepted ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Accepted
                    </Tag>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      Not accepted
                    </Tag>
                  )
                }
              >
                <div
                  style={{
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 8,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  {terms.contentUrl ? (
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={terms.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {terms.fileName ?? 'View document'}
                      {terms.fileSize != null && (
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          ({formatFileSize(terms.fileSize)})
                        </Text>
                      )}
                    </Button>
                  ) : (
                    <Text type="secondary">No document available</Text>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {terms.publishedAt
                      ? `Published: ${dayjs(terms.publishedAt).format('DD/MM/YYYY')}`
                      : `Created: ${dayjs(terms.createdAt).format('DD/MM/YYYY')}`}
                  </Text>

                  {accepted ? (
                    <Text type="success" style={{ fontSize: 12 }}>
                      <CheckCircleOutlined /> Accepted on {dayjs(acceptedDate).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  ) : (
                    <Button
                      type="primary"
                      onClick={() => onAccept(terms.id)}
                      loading={acceptTerms.isPending}
                    >
                      Accept terms
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </Space>
      )}
    </div>
  )
}
