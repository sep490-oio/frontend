import { useState, useCallback } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, InputNumber, Drawer, Button, AutoComplete } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuctions } from '@/features/auction/api'
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

/**
 * Auto-complete suggestions.
 * Receives already-debounced `q` from call site via useDebounce.
 * Only fires when q.length >= SUGGEST_MIN_LENGTH.
 * Stale in-flight requests are cancelled automatically via AbortController signal.
 */
function useSuggestAuctions(q: string) {
  return useQuery({
    queryKey: ['auctions', 'suggest', q],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<string[]>('/search/auctions/suggest', { params: { q }, signal })
      return res.data
    },
    enabled: q.trim().length >= SUGGEST_MIN_LENGTH,
    staleTime: 10_000,
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
  padding: '8px 20px',
  borderRadius: 100,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: 'var(--color-accent)',
  borderColor: 'var(--color-accent)',
  color: '#fff',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrowseAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const [searchParams] = useSearchParams()
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
    setCommittedSearch(value.trim())
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
      {/* ── Header (mobile/tablet only) ── */}
      {isNarrow && (
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: isMobile ? 22 : 26,
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
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
          Single filter bar: [status pills ····] [category] [type] [sort] [search]
          ════════════════════════════════════════════════════════════════════ */}
      {!isNarrow && (
        <Flex wrap="wrap" gap={12} align="center" style={{ marginBottom: 32 }}>
          {/* Status pills */}
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

          {/* Category */}
          <Select
            style={{ width: 180 }}
            options={categoryOptions}
            value={categoryId}
            onChange={handleCategoryChange}
            variant="borderless"
            popupMatchSelectWidth={false}
          />

          {/* Auction type */}
          <Select
            style={{ width: 150 }}
            options={AUCTION_TYPE_OPTIONS}
            value={filters.auctionType ?? ''}
            onChange={(v) => updateFilter('auctionType', v)}
            variant="borderless"
            popupMatchSelectWidth={false}
          />

          {/* Sort */}
          <Select
            style={{ width: 180 }}
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
            style={{ width: 240, borderRadius: 100, overflow: 'hidden' }}
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