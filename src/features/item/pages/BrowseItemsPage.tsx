import { useState } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, Card, Empty } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import apiClient from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import type { PagedList, PaginationParams, ItemDto } from '@/types'

const SERIF = "'DM Serif Display', Georgia, serif"

function useBrowseItems(params?: PaginationParams & { categoryId?: string; search?: string; condition?: string }) {
  return useQuery({
    queryKey: ['items', 'browse', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/public', { params })
      return res.data
    },
  })
}

export default function BrowseItemsPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const { data: categories } = useCategories()
  const { data, isLoading } = useBrowseItems({
    pageNumber: page,
    pageSize,
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId } : {}),
  })

  const items = data?.items ?? []
  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : '32px 24px 80px' }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: isMobile ? 24 : 32, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        {t('browseTitle', 'Khám phá sản phẩm')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: isMobile ? 20 : 32 }}>
        {t('browseSubtitle', 'Duyệt qua bộ sưu tập sản phẩm đa dạng trên nền tảng')}
      </p>

      <Flex wrap="wrap" gap={12} style={{ marginBottom: isMobile ? 20 : 32 }} vertical={isMobile}>
        <Select
          style={{ width: isMobile ? '100%' : 200 }}
          options={categoryOptions}
          value={categoryId}
          onChange={(v) => { setCategoryId(v); setPage(1) }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          placeholder={t('searchPlaceholder', 'Tìm kiếm sản phẩm...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => setPage(1)}
          style={{ maxWidth: isMobile ? '100%' : 300, borderRadius: 100, height: 40, borderColor: 'var(--color-border)' }}
        />
      </Flex>

      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 4 }} />
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <Empty description={t('noItems', 'Không tìm thấy sản phẩm')} />
      ) : (
        <>
          <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
            {items.map((item) => {
              const primaryImage = item.images?.find((img) => img.isPrimary) ?? item.images?.[0]
              return (
                <Col key={item.id} xs={24} sm={12} lg={6}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/items/${item.id}`)}
                    style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-light)' }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-surface)', overflow: 'hidden' }}>
                      {primaryImage?.url ? (
                        <img src={primaryImage.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                          <EyeOutlined style={{ fontSize: 32, opacity: 0.3 }} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <Flex gap={8} align="center">
                        <StatusBadge status={item.condition} size="small" />
                        <StatusBadge status={item.status} size="small" />
                      </Flex>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
          {(data?.metadata?.totalCount ?? 0) > pageSize && (
            <Flex justify="center" style={{ marginTop: isMobile ? 24 : 40 }}>
              <Pagination
                current={data?.metadata?.currentPage ?? page}
                pageSize={data?.metadata?.pageSize ?? pageSize}
                total={data?.metadata?.totalCount ?? 0}
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
