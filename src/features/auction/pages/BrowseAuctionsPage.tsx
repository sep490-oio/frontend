import { useState, useCallback } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, InputNumber, Drawer, Button, AutoComplete } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuctions, useSuggestAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import apiClient from '@/lib/axios'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuctionStatus, AuctionType } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuctionFilterParams, PagedList, AuctionListItemDto } from '@/types'
import { SERIF_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT
const SUGGEST_MIN_LENGTH = 2

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchAuctionParams {
  q: string
  page?: number
  page_size?: number
  sort_by?: string
  desc?: boolean
  category?: string  // category name, not ID
  status?: string
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



// ─── Helper: split legacy "Field Dir" sort string ────────────────────────────

function parseSortString(sortBy: string | undefined): { sort_by?: string; desc?: boolean } {
  if (!sortBy) return {}
  const [field, dir] = sortBy.split(' ')
  return { sort_by: field?.toLowerCase(), desc: dir?.toLowerCase() !== 'asc' }
}

// ─── Pill styles (mirror AuctionListPage) ────────────────────────────────────

const pillBase: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 100,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
  background: 'var(--color-bg-surface, rgba(255,255,255,0.05))',
  color: 'var(--color-text-primary, #e5e7eb)',
  whiteSpace: 'nowrap',
}

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: 'var(--color-accent, #3b82f6)',
  borderColor: 'var(--color-accent, #3b82f6)',
  color: '#fff',
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  // ── State ─────────────────────────────────────────────────────────────────

  const [filters, setFilters] = useState<AuctionFilterParams>({
    pageNumber: 1,
    pageSize: 12,
    status: initialStatus as AuctionStatus | undefined,
  })

  // What the user is currently typing → drives suggest dropdown
  const [inputValue, setInputValue] = useState(initialSearch)

  // Only updated on Enter / suggestion select → drives actual search query
  const [committedSearch, setCommittedSearch] = useState(initialSearch)

  // Category: id for browse endpoint, name for ES endpoint
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [categoryName, setCategoryName] = useState('')

  // Price filters (browse-mode only)
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSearchMode = committedSearch.trim().length > 0

  // Debounce input before passing to suggest hook — no manual timers needed
  const debouncedInput = useDebounce(inputValue, 300)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: categories } = useCategories()

  const { data: browseData, isLoading: browseLoading } = useAuctions(
    !isSearchMode
      ? { ...filters, categoryId: categoryId || undefined, minPrice: minPrice ?? undefined, maxPrice: maxPrice ?? undefined }
      : undefined!,
    { refetchInterval: 30000 },
  )

  const { sort_by, desc } = parseSortString(filters.sortBy)
  const { data: searchData, isLoading: searchLoading } = useSearchAuctions(
    {
      q: committedSearch,
      page: filters.pageNumber,
      page_size: filters.pageSize,
      sort_by,
      desc,
      ...(categoryName ? { category: categoryName } : {}),
      ...(filters.status ? { status: filters.status } : {}),
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

    // Update URL params
    const newParams = new URLSearchParams(searchParams)
    if (trimmed) {
      newParams.set('search', trimmed)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    // Revert to browse mode immediately when input is cleared
    if (!value.trim()) {
      setCommittedSearch('')
      setFilters((prev) => ({ ...prev, pageNumber: 1 }))

      const newParams = new URLSearchParams(searchParams)
      newParams.delete('search')
      setSearchParams(newParams)
    }
  }, [searchParams, setSearchParams])

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: isNarrow ? 1200 : 1440,
        margin: '0 auto',
        padding: isMobile ? '16px 12px 64px' : isTablet ? '24px 16px 64px' : '40px 24px 80px',
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
        {!isMobile && (
          <a href="#" style={{ color: 'var(--color-accent, #3b82f6)', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            {t('viewAll', 'Xem tất cả')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </a>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          Single filter bar: [status pills ····] [category] [type] [sort] [search]
          ════════════════════════════════════════════════════════════════════ */}
      {!isNarrow && (
        <Flex wrap="wrap" justify="space-between" gap={16} align="center" style={{ marginBottom: 32 }}>
          {/* Status pills - will auto grow to push right side, or stack cleanly if wrapped */}
          <Flex gap={8} wrap="wrap" style={{ flex: '1 1 auto' }}>
            {STATUS_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                style={activeStatus === pill.value ? pillActive : pillBase}
                onClick={() => updateFilter('status', pill.value)}
              >
                {pill.label}
              </button>
            ))}
          </Flex>

          {/* Right Side: Selects + Search */}
          <Flex gap={12} align="center" wrap="wrap">
            {/* Category */}
            <Select
              style={{ minWidth: 160 }}
              options={categoryOptions}
              value={categoryId}
              onChange={handleCategoryChange}
              variant="borderless"
              popupMatchSelectWidth={false}
            />

            {/* Auction type */}
            <Select
              style={{ minWidth: 130 }}
              options={AUCTION_TYPE_OPTIONS}
              value={filters.auctionType ?? ''}
              onChange={(v) => updateFilter('auctionType', v)}
              variant="borderless"
              popupMatchSelectWidth={false}
            />

            {/* Sort */}
            <Select
              style={{ minWidth: 160 }}
              options={SORT_OPTIONS}
              value={filters.sortBy ?? 'EndTime Asc'}
              onChange={(v) => updateFilter('sortBy', v)}
              variant="borderless"
              popupMatchSelectWidth={false}
            />

            {/* Search with autocomplete */}
            <AutoComplete
              options={suggestOptions}
              value={inputValue}
              onChange={handleInputChange}
              onSelect={handleSelect}
              style={{ width: 220, borderRadius: 100, overflow: 'hidden' }}
              popupMatchSelectWidth={false}
            >
              <Input
                prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                placeholder={t('searchPlaceholder')}
                onPressEnter={handlePressEnter}
                allowClear
                onClear={() => handleInputChange('')}
                style={{ borderRadius: 100, height: 40, borderColor: 'var(--color-border)' }}
              />
            </AutoComplete>
          </Flex>
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

      {/* ── Grid ── */}
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
          {!isNarrow ? (
            <div
              className="oio-stagger"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}
            >
              {data.items.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <Row className="oio-stagger" gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
              {data.items.map((auction) => (
                <Col key={auction.id} xs={24} sm={12} md={8} xl={6}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
          )}

          {/* Pagination */}
          <Flex justify="center" style={{ marginTop: isNarrow ? (isMobile ? 28 : 48) : 64 }}>
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