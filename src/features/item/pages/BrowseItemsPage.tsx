import { useState, useCallback, useRef } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, Card, Empty, AutoComplete } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import apiClient from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import type { PagedList, PaginationParams, ItemDto } from '@/types'
import { SERIF_FONT } from '@/styles/tokens'

const SERIF = SERIF_FONT
const SUGGEST_DEBOUNCE_MS = 300

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
  category?: string // category name (not ID)
  status?: string
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Browse all items (no keyword required) — original endpoint */
function useBrowseItems(params?: BrowseParams) {
  return useQuery({
    queryKey: ['items', 'browse', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/items/public', { params })
      return res.data
    },
  })
}

/** Elasticsearch full-text search — requires a keyword */
function useSearchItems(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['items', 'search', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ItemDto>>('/search/items', { params })
      return res.data
    },
    enabled,
  })
}

/** Auto-complete suggestions from Elasticsearch */
function useSuggestItems(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ['items', 'suggest', q],
    queryFn: async () => {
      const res = await apiClient.get<string[]>('/search/items/suggest', { params: { q } })
      return res.data
    },
    enabled: enabled && q.trim().length > 0,
    staleTime: 10_000,
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrowseItemsPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Search input (what the user is currently typing)
  const [inputValue, setInputValue] = useState('')

  // Committed search keyword (only set when user presses Enter or selects a suggestion)
  const [committedSearch, setCommittedSearch] = useState('')

  // Category: keep both id (for browse) and name (for ES search)
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')

  // Suggest state
  const [suggestEnabled, setSuggestEnabled] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: categories } = useCategories()

  const isSearchMode = committedSearch.trim().length > 0

  // Browse (no keyword)
  const { data: browseData, isLoading: browseLoading } = useBrowseItems(
    !isSearchMode
      ? { pageNumber: page, pageSize, ...(categoryId ? { categoryId } : {}) }
      : undefined,
  )

  // Search (has keyword)
  const { data: searchData, isLoading: searchLoading } = useSearchItems(
    {
      q: committedSearch,
      page,
      page_size: pageSize,
      ...(categoryName ? { category: categoryName } : {}),
    },
    isSearchMode,
  )

  // Suggestions
  const { data: suggestions } = useSuggestItems(inputValue, suggestEnabled)

  const data = isSearchMode ? searchData : browseData
  const isLoading = isSearchMode ? searchLoading : browseLoading
  const items = data?.items ?? []

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)

    // Debounce suggest calls
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (value.trim().length > 0) {
      debounceTimer.current = setTimeout(() => {
        setSuggestEnabled(true)
      }, SUGGEST_DEBOUNCE_MS)
    } else {
      setSuggestEnabled(false)
      // Clear search when input is emptied
      setCommittedSearch('')
      setPage(1)
    }
  }, [])

  const commitSearch = useCallback((value: string) => {
    setSuggestEnabled(false)
    setCommittedSearch(value.trim())
    setPage(1)
  }, [])

  const handleSelect = useCallback((value: string) => {
    setInputValue(value)
    commitSearch(value)
  }, [commitSearch])

  const handlePressEnter = useCallback(() => {
    commitSearch(inputValue)
  }, [commitSearch, inputValue])

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategoryId(value)
      const cat = (categories ?? []).find((c) => c.id === value)
      setCategoryName(cat?.name ?? '')
      setPage(1)
    },
    [categories],
  )

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
            style={{
              borderRadius: 100,
              height: 40,
              borderColor: 'var(--color-border)',
            }}
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
                onChange={(p, ps) => {
                  setPage(p)
                  setPageSize(ps)
                }}
                size={isMobile ? 'small' : undefined}
              />
            </Flex>
          )}
        </>
      )}
    </div>
  )
}