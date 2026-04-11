import { useState } from 'react'
import { Input, Pagination, Flex, Row, Col, Card, Spin, Empty } from 'antd'
import { SearchOutlined, ShopOutlined, SafetyCertificateOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import apiClient from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import type { PagedList, PaginationParams } from '@/types'

import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT
const MONO = MONO_FONT

interface SellerListItem {
  id: string
  storeName: string
  storeDescription?: string
  status: string
  totalSalesCount: number
  trustScore: number
  createdAt: string
}

function useBrowseSellers(params?: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: ['sellers', 'browse', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<SellerListItem>>('/sellers', { params })
      return res.data
    },
  })
}

export default function BrowseSellersPage() {
  const { t } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useBrowseSellers({ pageNumber: page, pageSize, ...(search ? { search } : {}) })
  const sellers = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : isTablet ? '24px 16px 64px' : '32px 24px 80px' }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: isMobile ? 22 : isTablet ? 28 : 32,
          color: 'var(--color-text-primary)',
          marginBottom: 6,
          marginTop: 0,
        }}>
          Người bán
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14, margin: 0 }}>
          Khám phá các nhà bán hàng uy tín trên nền tảng
        </p>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 28 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          placeholder="Tìm kiếm người bán..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => setPage(1)}
          style={{
            maxWidth: isMobile ? '100%' : 360,
            width: '100%',
            borderRadius: 100,
            height: 44,
            borderColor: 'var(--color-border)',
          }}
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? 40 : 80 }}>
          <Spin size="large" />
        </div>
      ) : sellers.length === 0 ? (
        <Empty description="Không tìm thấy người bán" />
      ) : (
        <>
          <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
            {sellers.map((seller) => (
              <Col key={seller.id} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  onClick={() => navigate(`/sellers/${seller.id}`)}
                  style={{
                    borderRadius: 12,
                    border: '1px solid var(--color-border-light)',
                    height: '100%',
                  }}
                  styles={{ body: { padding: isMobile ? 14 : 20 } }}
                >
                  <Flex align="center" gap={isMobile ? 12 : 14}>
                    {/* Avatar circle */}
                    <div style={{
                      width: isMobile ? 44 : 52,
                      height: isMobile ? 44 : 52,
                      borderRadius: '50%',
                      background: 'var(--color-accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 16 : 18,
                      fontWeight: 600,
                      color: 'var(--color-accent)',
                      flexShrink: 0,
                    }}>
                      {seller.storeName?.[0]?.toUpperCase() ?? <ShopOutlined />}
                    </div>

                    {/* Store info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={5} style={{ marginBottom: 2 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: isMobile ? 13 : 14,
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {seller.storeName}
                        </div>
                        {seller.status === 'approved' && (
                          <SafetyCertificateOutlined style={{ color: 'var(--color-success)', fontSize: 13, flexShrink: 0 }} />
                        )}
                      </Flex>
                      <div style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.4,
                      }}>
                        {seller.storeDescription || '—'}
                      </div>
                    </div>
                  </Flex>

                  {/* Stats row */}
                  <Flex gap={14} style={{ marginTop: isMobile ? 10 : 14, paddingTop: 10, borderTop: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <StarOutlined style={{ marginRight: 4 }} />
                      Trust:{' '}
                      <span style={{ fontFamily: MONO, fontWeight: 500, color: 'var(--color-accent)' }}>
                        {seller.trustScore?.toFixed(0) ?? '—'}
                      </span>
                      /100
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {seller.totalSalesCount ?? 0} sales
                    </div>
                  </Flex>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Pagination ─────────────────────────────────────────── */}
          {totalCount > pageSize && (
            <Flex justify="center" style={{ marginTop: isMobile ? 24 : 40 }}>
              <Pagination
                current={data?.metadata?.currentPage ?? page}
                pageSize={data?.metadata?.pageSize ?? pageSize}
                total={totalCount}
                showSizeChanger={!isMobile}
                showTotal={isMobile ? undefined : (total) => t('pagination.total', { total })}
                onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
                size={isMobile ? 'small' : undefined}
              />
            </Flex>
          )}
        </>
      )}
    </div>
  )
}