import { useState } from 'react'
import { Input, Select, Pagination, Flex, Row, Col } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuctionStatus } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { AuctionFilterParams } from '@/types'

const SERIF = "'DM Serif Display', Georgia, serif"

const SORT_OPTIONS = [
  { value: 'EndTime Asc', label: 'Ending soon' },
  { value: 'CurrentPrice Asc', label: 'Price: Low → High' },
  { value: 'CurrentPrice Desc', label: 'Price: High → Low' },
  { value: 'BidCount Desc', label: 'Most bids' },
  { value: 'CreatedAt Desc', label: 'Newest' },
]

const STATUS_PILLS = [
  { value: '', label: 'Tất cả' },
  { value: AuctionStatus.Active, label: 'Đang diễn ra' },
  { value: AuctionStatus.Scheduled, label: 'Sắp diễn ra' },
  { value: AuctionStatus.Ended, label: 'Đã kết thúc' },
]

export default function BrowseAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const [searchParams] = useSearchParams()

  const initialCategoryId = searchParams.get('categoryId') ?? ''

  const [filters, setFilters] = useState<AuctionFilterParams>({
    pageNumber: 1,
    pageSize: 12,
    status: AuctionStatus.Active,
    categoryId: initialCategoryId || undefined,
  })
  const [searchText, setSearchText] = useState('')

  const { data, isLoading } = useAuctions(filters, { refetchInterval: 30000 })
  const { data: categories } = useCategories()

  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined, pageNumber: 1 }))
  }

  const updateFilter = (key: keyof AuctionFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, pageNumber: 1 }))
  }

  const activeStatus = filters.status ?? ''

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : '32px 24px 80px' }}>
      {/* Header */}
      <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: isMobile ? 24 : 32, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        {t('browseTitle', 'Khám phá phiên đấu giá')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: isMobile ? 20 : 32 }}>
        {t('browseSubtitle', 'Tìm kiếm và lọc các phiên đấu giá theo danh mục, trạng thái và giá')}
      </p>

      {/* Status pills */}
      <Flex gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => updateFilter('status', pill.value)}
            style={{
              padding: isMobile ? '6px 14px' : '8px 20px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1px solid ${activeStatus === pill.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: activeStatus === pill.value ? 'var(--color-accent)' : 'transparent',
              color: activeStatus === pill.value ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 200ms ease',
            }}
          >
            {pill.label}
          </button>
        ))}
      </Flex>

      {/* Filters row */}
      <Flex wrap="wrap" gap={12} align="center" style={{ marginBottom: isMobile ? 20 : 32 }} vertical={isMobile}>
        <Select
          style={{ width: isMobile ? '100%' : 200 }}
          options={categoryOptions}
          value={filters.categoryId ?? ''}
          onChange={(v) => updateFilter('categoryId', v)}
        />
        <Select
          style={{ width: isMobile ? '100%' : 180 }}
          options={SORT_OPTIONS}
          value={filters.sortBy ?? 'EndTime Asc'}
          onChange={(v) => updateFilter('sortBy', v)}
        />
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          placeholder={t('searchPlaceholder', 'Tìm kiếm...')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => handleSearch(searchText)}
          style={{ width: isMobile ? '100%' : 260, borderRadius: 100, height: 40, borderColor: 'var(--color-border)' }}
        />
      </Flex>

      {/* Grid */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={24} sm={12} xl={6}>
              <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 4 }} />
            </Col>
          ))}
        </Row>
      ) : !data?.items?.length ? (
        <EmptyState title={t('noAuctions', 'Không tìm thấy phiên đấu giá')} />
      ) : (
        <>
          <Row className="oio-stagger" gutter={[16, 16]}>
            {data.items.map((auction) => (
              <Col key={auction.id} xs={24} sm={12} xl={6}>
                <AuctionCard auction={auction} />
              </Col>
            ))}
          </Row>
          <Flex justify="center" style={{ marginTop: isMobile ? 32 : 48 }}>
            <Pagination
              current={data.metadata.currentPage}
              pageSize={data.metadata.pageSize}
              total={data.metadata.totalCount}
              showSizeChanger={!isMobile}
              showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
              onChange={(p, ps) => setFilters((prev) => ({ ...prev, pageNumber: p, pageSize: ps }))}
              size={isMobile ? 'small' : undefined}
            />
          </Flex>
        </>
      )}
    </div>
  )
}
