import { useState, useEffect } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, InputNumber } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuctionStatus, AuctionType } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuctionFilterParams } from '@/types'
import { SERIF_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT

const AUCTION_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: AuctionType.Regular, label: 'Regular' },
  { value: AuctionType.Sealed, label: 'Sealed' },
]

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
  const initialSearch = searchParams.get('search') ?? ''
  // Parse `status` from URL so /auctions?status=active still filters to live auctions,
  // but the default (no query param) is ALL statuses. Only accept known enum values.
  const rawStatus = searchParams.get('status')
  const validStatuses = Object.values(AuctionStatus) as string[]
  const initialStatus = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : undefined

  const [filters, setFilters] = useState<AuctionFilterParams>({
    pageNumber: 1,
    pageSize: 12,
    status: initialStatus as AuctionStatus | undefined,
    categoryId: initialCategoryId || undefined,
    search: initialSearch || undefined,
  })
  const [searchText, setSearchText] = useState(initialSearch)
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const debouncedSearch = useDebounce(searchText, 500)

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch || undefined, pageNumber: 1 }))
  }, [debouncedSearch])

  const { data, isLoading } = useAuctions(filters, { refetchInterval: 30000 })
  const { data: categories } = useCategories()

  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

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
          placeholder={t('searchPlaceholder', 'Search auctions...')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => setFilters((prev) => ({ ...prev, search: searchText || undefined, pageNumber: 1 }))}
          style={{ width: isMobile ? '100%' : 220, borderRadius: 100, height: 40, borderColor: 'var(--color-border)' }}
        />
        <InputNumber
          placeholder="Min"
          min={0}
          value={minPrice}
          addonAfter="VND"
          style={{ width: isMobile ? '100%' : 150 }}
          onChange={(val) => {
            setMinPrice(val)
            setFilters((prev) => ({ ...prev, minPrice: val ?? undefined, pageNumber: 1 }))
          }}
        />
        <InputNumber
          placeholder="Max"
          min={0}
          value={maxPrice}
          addonAfter="VND"
          style={{ width: isMobile ? '100%' : 150 }}
          onChange={(val) => {
            setMaxPrice(val)
            setFilters((prev) => ({ ...prev, maxPrice: val ?? undefined, pageNumber: 1 }))
          }}
        />
        <Select
          style={{ width: isMobile ? '100%' : 140 }}
          options={AUCTION_TYPE_OPTIONS}
          value={filters.auctionType ?? ''}
          onChange={(v) => updateFilter('auctionType', v)}
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
