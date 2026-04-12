import { useState, useEffect } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, InputNumber, Drawer, Button } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
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

export default function BrowseAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const [searchParams] = useSearchParams()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Option arrays defined inside component to access t()
  const AUCTION_TYPE_OPTIONS = [
    { value: '', label: t('browse.allTypes') },
    { value: AuctionType.Regular, label: t('browse.typeRegular') },
    { value: AuctionType.Sealed, label: t('browse.typeSealed') },
  ]

  const SORT_OPTIONS = [
    { value: 'EndTime Asc', label: t('browse.sortEndingSoon') },
    { value: 'CurrentPrice Asc', label: t('browse.sortPriceLowHigh') },
    { value: 'CurrentPrice Desc', label: t('browse.sortPriceHighLow') },
    { value: 'BidCount Desc', label: t('browse.sortMostBids') },
    { value: 'CreatedAt Desc', label: t('browse.sortNewest') },
  ]

  const STATUS_PILLS = [
    { value: '', label: t('browse.statusAll') },
    { value: AuctionStatus.Active, label: t('browse.statusActive') },
    { value: AuctionStatus.Scheduled, label: t('browse.statusScheduled') },
    { value: AuctionStatus.Ended, label: t('browse.statusEnded') },
  ]

  const initialCategoryId = searchParams.get('categoryId') ?? ''
  const initialSearch = searchParams.get('search') ?? ''
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
    { value: '', label: t('browse.allCategories') },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  const updateFilter = (key: keyof AuctionFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, pageNumber: 1 }))
  }

  const activeStatus = filters.status ?? ''
  const isNarrow = isMobile || isTablet

  const filterControls = (
    <Flex vertical={isNarrow} gap={isNarrow ? 12 : 10} wrap={isNarrow ? undefined : 'wrap'}>
      <Select
        style={{ width: '100%', minWidth: isNarrow ? undefined : 180 }}
        options={categoryOptions}
        value={filters.categoryId ?? ''}
        onChange={(v) => updateFilter('categoryId', v)}
      />
      <Select
        style={{ width: '100%', minWidth: isNarrow ? undefined : 170 }}
        options={SORT_OPTIONS}
        value={filters.sortBy ?? 'EndTime Asc'}
        onChange={(v) => updateFilter('sortBy', v)}
      />
      <Select
        style={{ width: '100%', minWidth: isNarrow ? undefined : 130 }}
        options={AUCTION_TYPE_OPTIONS}
        value={filters.auctionType ?? ''}
        onChange={(v) => updateFilter('auctionType', v)}
      />
      <Flex gap={8} style={{ width: isNarrow ? '100%' : undefined }}>
        <InputNumber
          placeholder={t('min')}
          min={0}
          value={minPrice}
          addonAfter="₫"
          style={{ flex: 1 }}
          onChange={(val) => {
            setMinPrice(val)
            setFilters((prev) => ({ ...prev, minPrice: val ?? undefined, pageNumber: 1 }))
          }}
        />
        <InputNumber
          placeholder={t('max')}
          min={0}
          value={maxPrice}
          addonAfter="₫"
          style={{ flex: 1 }}
          onChange={(val) => {
            setMaxPrice(val)
            setFilters((prev) => ({ ...prev, maxPrice: val ?? undefined, pageNumber: 1 }))
          }}
        />
      </Flex>
    </Flex>
  )

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '16px 12px 64px' : isTablet ? '24px 16px 64px' : '32px 24px 80px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: isMobile ? 22 : isTablet ? 26 : 32,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          {t('browse.title')}
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: isMobile ? 13 : 14,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          {t('browse.subtitle')}
        </p>
      </div>

      {/* Search bar + filter button (mobile) */}
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          placeholder={t('searchPlaceholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => setFilters((prev) => ({ ...prev, search: searchText || undefined, pageNumber: 1 }))}
          style={{
            flex: 1,
            borderRadius: 100,
            height: 44,
            borderColor: 'var(--color-border)',
          }}
        />
        {isNarrow && (
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerOpen(true)}
            style={{ height: 44, minWidth: 44, borderRadius: 100, padding: '0 14px' }}
          >
            {!isMobile && t('browse.filters')}
          </Button>
        )}
      </Flex>

      {/* Status pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
          overflowX: isMobile ? 'auto' : undefined,
          paddingBottom: isMobile ? 4 : 0,
          scrollbarWidth: 'none',
        }}
      >
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => updateFilter('status', pill.value)}
            style={{
              padding: isMobile ? '6px 14px' : '7px 18px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: 36,
              border: `1px solid ${activeStatus === pill.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: activeStatus === pill.value ? 'var(--color-accent)' : 'transparent',
              color: activeStatus === pill.value ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 200ms ease',
              flexShrink: 0,
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Desktop filter row */}
      {!isNarrow && (
        <div style={{ marginBottom: 28 }}>
          <Flex wrap="wrap" gap={10} align="center">
            {filterControls}
          </Flex>
        </div>
      )}

      {/* Mobile/Tablet filter drawer */}
      <Drawer
        title={t('browse.filterDrawerTitle')}
        placement="bottom"
        height="auto"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        styles={{
          body: { paddingTop: 8, paddingBottom: 24 },
          wrapper: { borderRadius: '16px 16px 0 0', overflow: 'hidden' },
        }}
      >
        {filterControls}
        <Button
          type="primary"
          block
          size="large"
          onClick={() => setFilterDrawerOpen(false)}
          style={{
            marginTop: 16,
            height: 48,
            borderRadius: 8,
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            fontWeight: 600,
          }}
        >
          {t('browse.applyFilters')}
        </Button>
      </Drawer>

      {/* Grid */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[...Array(isMobile ? 4 : 8)].map((_, i) => (
            <Col key={i} xs={12} sm={12} md={8} xl={6}>
              <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 8 }} />
            </Col>
          ))}
        </Row>
      ) : !data?.items?.length ? (
        <EmptyState title={t('noAuctions')} />
      ) : (
        <>
          <Row className="oio-stagger" gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
            {data.items.map((auction) => (
              <Col key={auction.id} xs={24} sm={12} md={8} xl={6}>
                <AuctionCard auction={auction} />
              </Col>
            ))}
          </Row>
          <Flex justify="center" style={{ marginTop: isMobile ? 28 : 48 }}>
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
