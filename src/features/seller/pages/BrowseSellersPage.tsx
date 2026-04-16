import { useState } from 'react'
import { Input, Pagination, Flex, Row, Col, Spin, Empty } from 'antd'
import { SearchOutlined, ShopOutlined, SafetyCertificateOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import apiClient from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import type { PagedList, PaginationParams } from '@/types'

import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import { htmlToPlainTextExcerpt } from '@/components/ui/SafeHtmlRenderer'

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
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
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
          {t('browse.title')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14, margin: 0 }}>
          {t('browse.subtitle')}
        </p>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 28 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          placeholder={t('browse.searchPlaceholder')}
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
        <Empty description={t('browse.noResults')} />
      ) : (
        <>
          <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
            {sellers.map((seller) => (
              <Col key={seller.id} xs={12} sm={12} lg={8}>
                  <div
                    className="oio-press group"
                    onClick={() => navigate(`/sellers/${seller.id}`)}
                    style={{
                      cursor: 'pointer',
                      background: 'var(--color-bg-card, #11141b)',
                      border: '1px solid var(--color-border, rgba(255,255,255,0.05))',
                      borderRadius: isMobile ? 16 : 24,
                      padding: isMobile ? 10 : 16,
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent, rgba(59, 130, 246, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.05))';
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: isMobile ? 12 : 16,
                        overflow: 'hidden',
                        aspectRatio: '4/3',
                        marginBottom: isMobile ? 16 : 24,
                        background: 'linear-gradient(135deg, var(--color-bg-surface, #1f2937) 0%, var(--color-bg-base, #0a0c10) 100%)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        width: isMobile ? 60 : 80,
                        height: isMobile ? 60 : 80,
                        borderRadius: '50%',
                        background: 'var(--color-accent, rgba(59, 130, 246, 0.1))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? 24 : 32,
                        fontWeight: 700,
                        color: 'var(--color-accent, #3494f8)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                      }}>
                        {seller.storeName?.[0]?.toUpperCase() ?? <ShopOutlined />}
                      </div>

                      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                        <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 500 }}>
                           {new Date(seller.createdAt).toLocaleDateString(tc('locale') || 'vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: 18,
                          marginBottom: 8,
                          color: 'var(--color-text-primary, #f3f4f6)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        {seller.storeName}
                        {seller.status === 'approved' && (
                          <SafetyCertificateOutlined style={{ color: 'var(--color-success)', fontSize: 16 }} />
                        )}
                      </h3>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {htmlToPlainTextExcerpt(seller.storeDescription) || '—'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16 }}>
                        <Flex gap={8} align="center" style={{ flex: 1 }}>
                          <div style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StarOutlined style={{ color: 'var(--color-warning, #f59e0b)' }} />
                            <span style={{ fontFamily: MONO, fontWeight: 500 }}>
                              {seller.trustScore?.toFixed(0) ?? '—'}/100
                            </span>
                          </div>
                        </Flex>
                        
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                            {t('browse.sales')}
                          </div>
                          <div style={{ fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                            {seller.totalSalesCount ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
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
