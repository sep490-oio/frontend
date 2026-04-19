import { useState, useCallback, useEffect } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, InputNumber, Drawer, Button, AutoComplete } from 'antd'
import { SearchOutlined, FilterOutlined, AppstoreOutlined, SortAscendingOutlined, TagOutlined, CheckCircleOutlined, ClearOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuctions, useSuggestAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import apiClient from '@/lib/axios'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import FilterWidget from '@/components/ui/FilterWidget'
import { AuctionStatus, AuctionType } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuctionFilterParams, PagedList, AuctionListItemDto } from '@/types'
import { SERIF_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchAuctionParams {
  q: string
  page?: number
  page_size?: number
  sort_by?: string
  desc?: boolean
  category?: string  // category name, not ID
  status?: string
  auction_type?: string
  condition?: string
  min_price?: number
  max_price?: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Elasticsearch full-text search — requires a keyword.
 * Only fires when `enabled` is true (i.e. committedSearch is non-empty).
 * Stale in-flight requests are cancelled automatically via AbortController signal.
 */
function useSearchAuctions(params: SearchAuctionParams, enabled: boolean) {
  return useQuery({
    queryKey: ['auctions', 'search', params],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<PagedList<AuctionListItemDto>>('/search/auctions', { params, signal })
      return res.data
    },
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

function mapSearchSortBy(sortBy: string | undefined): string | undefined {
  switch (sortBy) {
    case 'EndTime Asc': return 'ending_soon'
    case 'CurrentPrice Asc': return 'price_asc'
    case 'CurrentPrice Desc': return 'price_desc'
    case 'BidCount Desc': return 'most_bids'
    case 'CreatedAt Desc': return 'newest'
    default: return 'newest'
  }
}

export default function BrowseAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const isNarrow = isMobile || isTablet

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

  // ── URL param initialisation ──────────────────────────────────────────────

  const initialCategoryId = searchParams.get('categoryId') ?? ''
  const initialSearch = searchParams.get('search') ?? ''
  const rawStatus = searchParams.get('status')
  const validStatuses = Object.values(AuctionStatus) as string[]
  const initialStatus = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : undefined

  const rawAuctionType = searchParams.get('auctionType')
  const validTypes = Object.values(AuctionType) as string[]
  const initialAuctionType = rawAuctionType && validTypes.includes(rawAuctionType) ? rawAuctionType : undefined

  const initialSortBy = searchParams.get('sortBy') ?? 'EndTime Asc'
  const initialMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
  const initialMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null

  // ── State ─────────────────────────────────────────────────────────────────

  const [filters, setFilters] = useState<AuctionFilterParams>({
    pageNumber: 1,
    pageSize: 12,
    status: initialStatus as AuctionStatus | undefined,
    auctionType: initialAuctionType as AuctionType | undefined,
    sortBy: initialSortBy,
  })

  // What the user is currently typing → drives suggest dropdown
  const [inputValue, setInputValue] = useState(initialSearch)

  // Only updated on Enter / suggestion select → drives actual search query
  const [committedSearch, setCommittedSearch] = useState(initialSearch)

  // Category: id for browse endpoint, name for ES endpoint
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [categoryName, setCategoryName] = useState('')

  // Price filters (browse-mode only)
  const [minPrice, setMinPrice] = useState<number | null>(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState<number | null>(initialMaxPrice)

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSearchMode = committedSearch.trim().length > 0

  // Debounce input before passing to suggest hook — no manual timers needed
  const debouncedInput = useDebounce(inputValue, 300)
  const debouncedMinPrice = useDebounce(minPrice, 600)
  const debouncedMaxPrice = useDebounce(maxPrice, 600)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: categories } = useCategories()

  const { data: browseData, isLoading: browseLoading } = useAuctions(
    !isSearchMode
      ? { ...filters, categoryId: categoryId || undefined, minPrice: debouncedMinPrice ?? undefined, maxPrice: debouncedMaxPrice ?? undefined }
      : undefined!,
    { refetchInterval: 30000 },
  )

  const { data: searchData, isLoading: searchLoading } = useSearchAuctions(
    {
      q: committedSearch || '*',
      page: filters.pageNumber,
      page_size: filters.pageSize,
      sort_by: mapSearchSortBy(filters.sortBy),
      ...(categoryName ? { category: categoryName } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.auctionType ? { auction_type: filters.auctionType } : {}),
      ...(debouncedMinPrice != null ? { min_price: debouncedMinPrice } : {}),
      ...(debouncedMaxPrice != null ? { max_price: debouncedMaxPrice } : {}),
    },
    isSearchMode,
  )

  // Suggestions receive debounced value — stale requests cancelled via signal
  const { data: suggestions } = useSuggestAuctions(debouncedInput)

  const data = isSearchMode ? searchData : browseData
  const isLoading = isSearchMode ? searchLoading : browseLoading

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updateFilter = useCallback((key: keyof AuctionFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, pageNumber: 1 }))
  }, [])

  const commitSearch = useCallback((value: string) => {
    const trimmed = value.trim()
    setCommittedSearch(trimmed)
    setFilters((prev) => ({ ...prev, pageNumber: 1 }))
  }, [])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    // Revert to browse mode immediately when input is cleared
    if (!value.trim()) {
      setCommittedSearch('')
      setFilters((prev) => ({ ...prev, pageNumber: 1 }))
    }
  }, [])

  const handleSelect = useCallback((value: string) => {
    setInputValue(value)
    commitSearch(value)
  }, [commitSearch])

  const handlePressEnter = useCallback(() => {
    commitSearch(inputValue)
  }, [commitSearch, inputValue])

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value)
    setCategoryName((categories ?? []).find((c) => c.id === value)?.name ?? '')
    setFilters((prev) => ({ ...prev, pageNumber: 1 }))
  }, [categories])

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (committedSearch.trim()) params.set('search', committedSearch.trim())
    if (categoryId) params.set('categoryId', categoryId)
    if (filters.status) params.set('status', filters.status)
    if (filters.auctionType) params.set('auctionType', filters.auctionType)
    if (filters.sortBy && filters.sortBy !== 'EndTime Asc') params.set('sortBy', filters.sortBy)
    if (debouncedMinPrice != null) params.set('minPrice', debouncedMinPrice.toString())
    if (debouncedMaxPrice != null) params.set('maxPrice', debouncedMaxPrice.toString())
    setSearchParams(params)
  }, [committedSearch, categoryId, filters.status, filters.auctionType, filters.sortBy, debouncedMinPrice, debouncedMaxPrice, setSearchParams])

  // ── Options ───────────────────────────────────────────────────────────────

  const categoryOptions = [
    { value: '', label: t('browse.allCategories') },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  const suggestOptions = (suggestions ?? []).map((s) => ({ value: s, label: s }))

  const activeStatus = filters.status ?? ''

  // ── Mobile/Tablet filter controls (drawer) ────────────────────────────────

  const filterControls = (
    <Flex vertical gap={12}>
      <Select
        style={{ width: '100%' }}
        options={categoryOptions}
        value={categoryId}
        onChange={handleCategoryChange}
      />
      <Select
        style={{ width: '100%' }}
        options={SORT_OPTIONS}
        value={filters.sortBy ?? 'EndTime Asc'}
        onChange={(v) => updateFilter('sortBy', v)}
      />
      <Select
        style={{ width: '100%' }}
        options={AUCTION_TYPE_OPTIONS}
        value={filters.auctionType ?? ''}
        onChange={(v) => updateFilter('auctionType', v)}
      />
      <Flex gap={8}>
        <InputNumber
          placeholder={t('min')}
          min={0}
          value={minPrice}
          addonAfter="₫"
          style={{ flex: 1 }}
          onChange={(val) => {
            setMinPrice(val)
            if (maxPrice != null && val && val > maxPrice) setMinPrice(maxPrice)
            setFilters((prev) => ({ ...prev, pageNumber: 1 }))
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
            if (minPrice != null && val && val < minPrice) setMaxPrice(minPrice)
            setFilters((prev) => ({ ...prev, pageNumber: 1 }))
          }}
        />
      </Flex>
    </Flex>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        width: '100%',
        padding: isMobile ? '16px 12px 64px' : isTablet ? '24px 16px 64px' : '40px 48px 80px',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: isMobile ? 32 : 40,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            {t('browse.title')}
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 16,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            {t('browse.subtitle')}
          </p>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          Sidebar: [Search Widget] [Category Widget] [Status Widget] [Sort Widget]
          ════════════════════════════════════════════════════════════════════ */}
      {!isNarrow && (
        <Flex gap={32} align="flex-start" style={{ marginBottom: 32 }}>
          {/* Left Sidebar */}
          <div 
            className="hide-scrollbar"
            style={{
              width: 280,
              flexShrink: 0,
              position: 'sticky',
              top: 100,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              paddingRight: 8,
            }}
          >
            <div style={{
              marginBottom: 24,
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 100,
              border: '1px solid var(--color-border-light)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}>
              <AutoComplete
                options={suggestOptions}
                value={inputValue}
                onChange={handleInputChange}
                onSelect={handleSelect}
                style={{ width: '100%' }}
                popupMatchSelectWidth={false}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)', marginRight: 8 }} />}
                  placeholder={t('searchPlaceholder')}
                  onPressEnter={handlePressEnter}
                  allowClear
                  onClear={() => handleInputChange('')}
                  size="large"
                  variant="borderless"
                  style={{
                    height: 52,
                    fontSize: 15,
                    background: 'transparent',
                  }}
                />
              </AutoComplete>
            </div>

            <FilterWidget title={t('browse.allCategories', 'Danh mục')} icon={<AppstoreOutlined />}>
              <Select
                style={{ width: '100%' }}
                options={categoryOptions}
                value={categoryId}
                onChange={handleCategoryChange}
                size="large"
                variant="filled"
                popupMatchSelectWidth={false}
              />
            </FilterWidget>

            <FilterWidget title={t('browse.filterState', 'Trạng thái')} icon={<CheckCircleOutlined />} noPadding>
              <Flex vertical>
                {STATUS_PILLS.map((pill, idx) => {
                  const isActive = activeStatus === pill.value;
                  return (
                    <div
                      key={pill.value}
                      onClick={() => updateFilter('status', pill.value)}
                      style={{
                        padding: '14px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: idx < STATUS_PILLS.length - 1 ? '1px solid var(--color-border)' : 'none',
                        background: isActive ? 'var(--color-accent-light)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18,
                        borderRadius: '50%',
                        border: `2px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                      }}>
                        {isActive && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                      </div>
                      <span style={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)'
                      }}>
                        {pill.label}
                      </span>
                    </div>
                  );
                })}
              </Flex>
            </FilterWidget>

            <FilterWidget title={t('browse.filterType', 'Hình thức')} icon={<TagOutlined />}>
              <Select
                style={{ width: '100%' }}
                options={AUCTION_TYPE_OPTIONS}
                value={filters.auctionType ?? ''}
                onChange={(v) => updateFilter('auctionType', v)}
                size="large"
                variant="filled"
                popupMatchSelectWidth={false}
              />
            </FilterWidget>

            <FilterWidget title={t('browse.filterSort', 'Sắp xếp')} icon={<SortAscendingOutlined />}>
              <Select
                style={{ width: '100%' }}
                options={SORT_OPTIONS}
                value={filters.sortBy ?? 'EndTime Asc'}
                onChange={(v) => updateFilter('sortBy', v)}
                size="large"
                variant="filled"
                popupMatchSelectWidth={false}
              />
            </FilterWidget>

            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={() => {
                setCategoryId('')
                setCategoryName('')
                setMinPrice(null)
                setMaxPrice(null)
                setFilters({ pageNumber: 1, pageSize: 12, sortBy: 'EndTime Asc' })
              }}
              style={{ width: '100%', marginBottom: 20, color: 'var(--color-text-secondary)' }}
            >
              {tc('action.clearFilters')}
            </Button>
          </div>

          {/* Right Grid Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <Row gutter={[16, 16]}>
                {[...Array(6)].map((_, i) => (
                  <Col key={i} xs={24} sm={12} md={12} xl={8}>
                    <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 8 }} />
                  </Col>
                ))}
              </Row>
            ) : !data?.items?.length ? (
              <EmptyState title={t('noAuctions')} />
            ) : (
              <>
                <div
                  className="oio-stagger"
                  style={{ display: 'grid', gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 24 }}
                >
                  {data.items.map((auction: AuctionListItemDto) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>

                <Flex justify="center" style={{ marginTop: 64 }}>
                  <Pagination
                    current={data.metadata.currentPage}
                    pageSize={data.metadata.pageSize}
                    total={data.metadata.totalCount}
                    showSizeChanger={true}
                    showTotal={(total) => tc('pagination.total', { total })}
                    onChange={(p, ps) => setFilters((prev) => ({ ...prev, pageNumber: p, pageSize: ps }))}
                  />
                </Flex>
              </>
            )}
          </div>
        </Flex>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE / TABLET LAYOUT
          ════════════════════════════════════════════════════════════════════ */}
      {isNarrow && (
        <>
          {/* Search bar + filter button */}
          <Flex gap={8} style={{ marginBottom: 12 }}>
            <AutoComplete
              options={suggestOptions}
              value={inputValue}
              onChange={handleInputChange}
              onSelect={handleSelect}
              style={{ flex: 1, borderRadius: 100, overflow: 'hidden' }}
              popupMatchSelectWidth={false}
            >
              <Input
                prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                placeholder={t('searchPlaceholder')}
                onPressEnter={handlePressEnter}
                style={{ borderRadius: 100, height: 44, borderColor: 'var(--color-border)' }}
              />
            </AutoComplete>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerOpen(true)}
              style={{ height: 44, minWidth: 44, borderRadius: 100, padding: '0 14px' }}
            >
              {!isMobile && t('browse.filters')}
            </Button>
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

          {/* Filter drawer */}
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
        </>
      )}

      {/* ── Grid Mobile ── */}
      {isNarrow && (
        isLoading ? (
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
              {data.items.map((auction: AuctionListItemDto) => (
                <Col key={auction.id} xs={24} sm={12} md={8} xl={6}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
            {/* Pagination */}
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
        )
      )}
    </div>
  )
}