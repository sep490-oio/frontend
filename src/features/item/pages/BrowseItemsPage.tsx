import { useState, useCallback, useEffect } from 'react'
import { Input, Select, Pagination, Flex, Row, Col, Empty, AutoComplete, Button } from 'antd'
import { SearchOutlined, EyeOutlined, AppstoreOutlined, ClearOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCategories, useSuggestItems, usePublicItems } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useDebounce } from '@/hooks/useDebounce'
import { useTheme } from '@/hooks/useTheme'
import { SERIF_FONT } from '@/styles/tokens'
import FilterWidget from '@/components/ui/FilterWidget'

const SERIF = SERIF_FONT

// ─── Component ───────────────────────────────────────────────────────────────

export default function BrowseItemsPage() {
  const { t, i18n } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const { isDark } = useTheme()
  const isNarrow = isMobile || isTablet
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────────────────────────────

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') ?? ''

  // What the user is currently typing → drives suggest dropdown
  const [inputValue, setInputValue] = useState(initialSearch)

  // Only updated on Enter / suggestion select → drives actual search query
  const [committedSearch, setCommittedSearch] = useState(initialSearch)

  // Category: id for browse endpoint, name for ES endpoint
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '')
  const [categoryName, setCategoryName] = useState(searchParams.get('categoryName') ?? '')

  // Widget Filters
  const [itemCondition, setItemCondition] = useState(searchParams.get('condition') ?? 'all')
  const [itemStatus, setItemStatus] = useState(searchParams.get('status') ?? 'all')
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') ?? 'newest')

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSearchMode = committedSearch.trim().length > 0

  // Debounce input before passing to suggest hook — no manual timers needed
  const debouncedInput = useDebounce(inputValue, 300)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: categories } = useCategories()

  const { data, isLoading } = usePublicItems({
    pageNumber: page,
    pageSize,
    ...(categoryId ? { categoryId } : {}),
    search: isSearchMode ? committedSearch.trim() : undefined,
    condition: itemCondition !== 'all' ? itemCondition : undefined,
    status: itemStatus !== 'all' ? itemStatus : undefined,
    sortBy: sortBy === 'oldest' ? 'CreatedAt Asc' : 'CreatedAt Desc'
  })

  // Suggestions receive debounced value — stale requests cancelled via signal
  const { data: suggestions } = useSuggestItems(debouncedInput)

  const items = data?.items ?? []

  // ── Handlers ─────────────────────────────────────────────────────────────

  const updateCondition = useCallback((val: string) => {
    setItemCondition(val)
    setPage(1)
  }, [])

  const updateStatus = useCallback((val: string) => {
    setItemStatus(val)
    setPage(1)
  }, [])

  const updateSortBy = useCallback((val: string) => {
    setSortBy(val)
    setPage(1)
  }, [])

  const commitSearch = useCallback((value: string) => {
    const trimmed = value.trim()
    setCommittedSearch(trimmed)
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
    const cat = (categories ?? []).find((c) => c.id === value)
    setCategoryName(cat?.name ?? '')
    setPage(1)
  }, [categories])

  // URL Sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (committedSearch.trim()) params.set('search', committedSearch.trim())
    if (categoryId) params.set('categoryId', categoryId)
    if (categoryName) params.set('categoryName', categoryName)
    if (itemCondition !== 'all') params.set('condition', itemCondition)
    if (itemStatus !== 'all') params.set('status', itemStatus)
    if (sortBy !== 'newest') params.set('sortBy', sortBy)
    setSearchParams(params)
  }, [committedSearch, categoryId, categoryName, itemCondition, itemStatus, sortBy, setSearchParams])

  // ── Options ───────────────────────────────────────────────────────────────

  const categoryOptions = [
    { value: '', label: t('browse.allCategories') },
    ...(categories ?? []).map((cat) => ({
      value: cat.id,
      label: tc(`categories.items.${cat.name}`, cat.name),
    })),
  ]

  const suggestOptions = (suggestions ?? []).map((s) => ({ value: s, label: s }))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', padding: isMobile ? '16px 12px 48px' : '32px 48px 80px' }}>
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

      {/* ── Filter bar (Mobile) ── */}
      {isMobile && (
        <Flex wrap="wrap" gap={12} style={{ marginBottom: 20 }} vertical={isMobile}>
          <AutoComplete
            options={suggestOptions}
            value={inputValue}
            onChange={handleInputChange}
            onSelect={handleSelect}
            style={{ flex: 1, borderRadius: 100, overflow: 'hidden', background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--color-border-light)' }}
            popupMatchSelectWidth={false}
          >
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              placeholder={t('browse.searchPlaceholder')}
              onPressEnter={handlePressEnter}
              allowClear
              variant="borderless"
              onClear={() => handleInputChange('')}
              style={{ height: 44 }}
            />
          </AutoComplete>
          <Select
            style={{ width: '100%' }}
            options={categoryOptions}
            value={categoryId}
            onChange={handleCategoryChange}
            size="large"
          />
        </Flex>
      )}

      {/* ── Main content Desktop/Grid ── */}
      <Flex gap={32} align="flex-start">
        {!isNarrow && (
          <div className="hide-scrollbar" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 'var(--navbar-offset-desktop)', maxHeight: 'calc(100vh - var(--navbar-offset-desktop) - 20px)', overflowY: 'auto', paddingRight: 4 }}>
            <div style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: 100,
              border: '1px solid var(--color-border-light)',
              overflow: 'hidden',
              marginBottom: 20
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
                  prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)', marginRight: 4 }} />}
                  placeholder={t('browse.searchPlaceholder')}
                  onPressEnter={handlePressEnter}
                  allowClear
                  onClear={() => handleInputChange('')}
                  size="large"
                  variant="borderless"
                  style={{ height: 48, fontSize: 15 }}
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

            <FilterWidget title={t('browse.filterCondition', 'Tình trạng vật phẩm')} icon={<EyeOutlined />} noPadding>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'all'} onChange={() => updateCondition('all')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionAll', 'Tất cả tình trạng')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'new'} onChange={() => updateCondition('new')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionNew', 'Mới')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'like_new'} onChange={() => updateCondition('like_new')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionLikeNew', 'Như mới')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'very_good'} onChange={() => updateCondition('very_good')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionVeryGood', 'Rất tốt')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'good'} onChange={() => updateCondition('good')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionGood', 'Tốt')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemCondition" checked={itemCondition === 'acceptable'} onChange={() => updateCondition('acceptable')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.conditionAcceptable', 'Có thể chấp nhận')}</span>
                </label>
              </div>
            </FilterWidget>

            <FilterWidget title={t('browse.filterStatus', 'Trạng thái')} noPadding>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemStatus" checked={itemStatus === 'all'} onChange={() => updateStatus('all')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.statusAll', 'Tất cả trạng thái')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemStatus" checked={itemStatus === 'active'} onChange={() => updateStatus('active')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.statusActive', 'Đang hoạt động')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="itemStatus" checked={itemStatus === 'in_auction'} onChange={() => updateStatus('in_auction')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.statusAuction', 'Đang đấu giá')}</span>
                </label>
              </div>
            </FilterWidget>

            <FilterWidget title={t('browse.filterSort', 'Sắp xếp theo thời gian đăng')} noPadding>
              <div style={{ padding: '16px 20px' }}>
                <Select
                  style={{ width: '100%' }}
                  value={sortBy}
                  onChange={updateSortBy}
                  options={[
                    { value: 'newest', label: t('browse.sortNewest', 'Mới nhất') },
                    { value: 'oldest', label: t('browse.sortOldest', 'Cũ nhất') },
                  ]}
                  size="large"
                  variant="filled"
                />
              </div>
            </FilterWidget>

            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={() => {
                setCategoryId('')
                setCategoryName('')
                setItemCondition('all')
                setItemStatus('all')
                setSortBy('newest')
                setPage(1)
              }}
              style={{ width: '100%', marginBottom: 20, color: 'var(--color-text-secondary)' }}
            >
              {tc('action.clearFilters')}
            </Button>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>

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
                    <Col key={item.id} xs={24} sm={12} lg={8}>
                      <div
                        className="oio-press group"
                        onClick={() => navigate(`/items/${item.id}`)}
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
                        <>
                          <div
                            style={{
                              position: 'relative',
                              borderRadius: isMobile ? 12 : 16,
                              overflow: 'hidden',
                              aspectRatio: isMobile ? '16/10' : '4/5',
                              marginBottom: isMobile ? 16 : 24,
                              background: 'var(--color-bg-surface, #1f2937)',
                              flexShrink: 0,
                            }}
                          >
                            {primaryImage?.url ? (
                              <img
                                src={primaryImage.url}
                                alt={item.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  transition: 'transform 0.5s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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

                            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 500 }}>
                                {t('browse.postedAt', 'Posted:')} {new Date(item.createdAt).toLocaleDateString(i18n.language || 'vi-VN')}
                              </div>
                              {item.auction && (
                                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                  <CountdownTimer endTime={item.auction.endTime} size="small" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <h3
                              style={{
                                fontWeight: 700,
                                fontSize: isMobile ? 14 : 18,
                                marginBottom: 8,
                                color: 'var(--color-text-primary, #f3f4f6)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.title}
                            </h3>
                            {item.sellerName && (
                              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent, #3494f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                  {item.sellerName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sellerName}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16 }}>
                              <Flex gap={8} align="center" style={{ flex: 1, flexWrap: 'wrap' }}>
                                <StatusBadge status={item.condition} size="small" />
                                <StatusBadge status={item.status} size="small" />
                              </Flex>
                              {item.auction && (
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                                    {item.hasLiveAuction ? t('browse.liveBid', 'Live Bid') : t('browse.currentPrice', 'Current Price')}
                                  </div>
                                  <div className="oio-price" style={{ fontSize: 16, color: 'var(--color-accent, #3494f8)', fontWeight: 700 }}>
                                    {new Intl.NumberFormat(i18n.language || 'vi-VN', { style: 'currency', currency: item.auction.currency }).format(item.auction.currentPrice)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      </div>
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
      </Flex>
    </div>
  )
}