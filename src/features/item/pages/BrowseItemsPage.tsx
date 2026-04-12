import { useState, useCallback } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, Card, Empty, AutoComplete } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDebounce } from '@/hooks/useDebounce'
import apiClient from '@/lib/axios'
import type { PagedList, PaginationParams, ItemDto } from '@/types'
import { SERIF_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT
const SUGGEST_MIN_LENGTH = 2

// ─── Types ───────────────────────────────────────────────────────────────────

interface BrowseParams extends PaginationParams {
  categoryId?: string
  search?: string
  condition?: string
}

interface SearchParams {
  q: string
  page?: number
  page_size?: number
  category?: string // category name, not ID
  status?: string
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Browse all items — no keyword required. Uses legacy /items/public endpoint. */
function useBrowseItems(params?: BrowseParams) {
  return useQuery({
    queryKey: ['items', 'browse', params],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/public', { params, signal })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * Elasticsearch full-text search — requires a keyword.
 * Only fires when `enabled` is true (i.e. committedSearch is non-empty).
 * Stale in-flight requests are cancelled automatically via AbortController signal.
 */
function useSearchItems(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['items', 'search', params],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<PagedList<ItemDto>>('/search/items', { params, signal })
      return res.data
    },
    enabled,
    placeholderData: keepPreviousData,
  })
}

/**
 * Auto-complete suggestions.
 * Receives already-debounced `q` from call site via useDebounce.
 * Only fires when q.length >= SUGGEST_MIN_LENGTH.
 * Stale in-flight requests are cancelled automatically via AbortController signal.
 */
function useSuggestItems(q: string) {
  return useQuery({
    queryKey: ['items', 'suggest', q],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<string[]>('/search/items/suggest', { params: { q }, signal })
      return res.data
    },
    enabled: q.trim().length >= SUGGEST_MIN_LENGTH,
    staleTime: 10_000,
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrowseItemsPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────────────────────────────

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // What the user is currently typing → drives suggest dropdown
  const [inputValue, setInputValue] = useState('')

  // Only updated on Enter / suggestion select → drives actual search query
  const [committedSearch, setCommittedSearch] = useState('')

  // Category: id for browse endpoint, name for ES endpoint
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSearchMode = committedSearch.trim().length > 0

  // Debounce input before passing to suggest hook — no manual timers needed
  const debouncedInput = useDebounce(inputValue, 300)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: categories } = useCategories()

  const { data: browseData, isLoading: browseLoading } = useBrowseItems(
    !isSearchMode
      ? { pageNumber: page, pageSize, ...(categoryId ? { categoryId } : {}) }
      : undefined,
  )

  const { data: searchData, isLoading: searchLoading } = useSearchItems(
    {
      q: committedSearch,
      page,
      page_size: pageSize,
      ...(categoryName ? { category: categoryName } : {}),
    },
    isSearchMode,
  )

  // Suggestions receive debounced value — stale requests cancelled via signal
  const { data: suggestions } = useSuggestItems(debouncedInput)

  const data = isSearchMode ? searchData : browseData
  const isLoading = isSearchMode ? searchLoading : browseLoading
  const items = data?.items ?? []

  // ── Handlers ─────────────────────────────────────────────────────────────

  const commitSearch = useCallback((value: string) => {
    setCommittedSearch(value.trim())
    setPage(1)
  }, [])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    // Revert to browse mode immediately when input is cleared
    if (!value.trim()) {
      setCommittedSearch('')
      setPage(1)
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
    setPage(1)
  }, [categories])

  // ── Options ───────────────────────────────────────────────────────────────

  const categoryOptions = [
    { value: '', label: t('browse.allCategories') },
    ...(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  const suggestOptions = (suggestions ?? []).map((s) => ({ value: s, label: s }))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : '32px 24px 80px' }}>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: isMobile ? 24 : 32,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
        }}
      >
        {t('browse.title')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: isMobile ? 20 : 32 }}>
        {t('browse.subtitle')}
      </p>

      {/* ── Filter bar ── */}
      <Flex wrap="wrap" gap={12} style={{ marginBottom: isMobile ? 20 : 32 }} vertical={isMobile}>
        <Select
          style={{ width: isMobile ? '100%' : 200 }}
          options={categoryOptions}
          value={categoryId}
          onChange={handleCategoryChange}
        />

        <AutoComplete
          options={suggestOptions}
          value={inputValue}
          onChange={handleInputChange}
          onSelect={handleSelect}
          style={{ maxWidth: isMobile ? '100%' : 300 }}
          popupMatchSelectWidth={false}
        >
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
            placeholder={t('browse.searchPlaceholder')}
            onPressEnter={handlePressEnter}
            style={{ borderRadius: 100, height: 40, borderColor: 'var(--color-border)' }}
          />
        </AutoComplete>
      </Flex>

      {/* ── Item grid ── */}
      {isLoading ? (
        <Row gutter={[16, 16]}>
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 4 }} />
            </Col>
          ))}
        </Row>
      ) : items.length === 0 ? (
        <Empty description={t('browse.noItems')} />
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
                        <img
                          src={primaryImage.url}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          <EyeOutlined style={{ fontSize: 32, opacity: 0.3 }} />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: 'var(--color-text-primary)',
                          marginBottom: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
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