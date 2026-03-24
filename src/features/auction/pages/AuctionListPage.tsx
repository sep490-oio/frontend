import { useState } from 'react'
import { Input, Select, Spin, Pagination, Flex } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuctionStatus } from '@/types/enums'
import type { AuctionFilterParams } from '@/types'

const SORT_OPTIONS = [
  { value: 'endTime_asc', label: 'Ending soon' },
  { value: 'currentPrice_asc', label: 'Price: Low to High' },
  { value: 'currentPrice_desc', label: 'Price: High to Low' },
  { value: 'bidCount_desc', label: 'Most bids' },
  { value: 'createdAt_desc', label: 'Newest' },
]

const STATUS_PILLS = [
  { value: '', label: 'All' },
  { value: AuctionStatus.Active, label: 'Live' },
  { value: AuctionStatus.Scheduled, label: 'Upcoming' },
  { value: AuctionStatus.Ended, label: 'Ended' },
] as const

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

export default function AuctionListPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')

  const [filters, setFilters] = useState<AuctionFilterParams>({
    pageNumber: 1,
    pageSize: 12,
    sortBy: 'endTime',
    sortOrder: 'asc',
  })
  const [searchText, setSearchText] = useState('')

  const { data, isLoading } = useAuctions(filters)
  const { data: categories } = useCategories()

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined, pageNumber: 1 }))
  }

  const updateFilter = (key: keyof AuctionFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, pageNumber: 1 }))
  }

  const handleSort = (value: string) => {
    const [sortBy, sortOrder] = value.split('_')
    setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
  }

  const categoryOptions = [
    { value: '', label: t('allCategories', 'All categories') },
    ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
  ]

  const activeStatus = filters.status ?? ''

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Filter bar */}
      <Flex
        wrap="wrap"
        gap={12}
        align="center"
        style={{ marginBottom: 32 }}
      >
        {/* Status pills */}
        <Flex gap={8} wrap="wrap" style={{ flex: '1 1 auto' }}>
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              style={activeStatus === pill.value ? pillActive : pillBase}
              onClick={() => updateFilter('status', pill.value as AuctionFilterParams['status'])}
            >
              {pill.label}
            </button>
          ))}
        </Flex>

        {/* Category */}
        <Select
          style={{ width: 180 }}
          options={categoryOptions}
          value={filters.categoryId ?? ''}
          onChange={(v) => updateFilter('categoryId', v)}
          variant="borderless"
          popupMatchSelectWidth={false}
        />

        {/* Sort */}
        <Select
          style={{ width: 180 }}
          options={SORT_OPTIONS}
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={handleSort}
          variant="borderless"
          popupMatchSelectWidth={false}
        />

        {/* Search */}
        <Input
          placeholder={t('searchPlaceholder', 'Search auctions...')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => handleSearch(searchText)}
          allowClear
          onClear={() => handleSearch('')}
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          style={{
            width: 240,
            borderRadius: 100,
            height: 40,
            borderColor: 'var(--color-border)',
          }}
        />
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" style={{ padding: 120 }}>
          <Spin size="large" />
        </Flex>
      ) : !data?.items?.length ? (
        <EmptyState
          title={t('noAuctions', 'No auctions found')}
          description="Try adjusting your filters or check back later."
        />
      ) : (
        <>
          {/* Grid */}
          <div
            className="oio-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
            }}
          >
            {data.items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          {/* Pagination */}
          <Flex justify="center" style={{ marginTop: 64 }}>
            <Pagination
              current={data.metadata.currentPage}
              pageSize={data.metadata.pageSize}
              total={data.metadata.totalCount}
              showSizeChanger
              showTotal={(total) => tc('pagination.total', { total })}
              onChange={(page, pageSize) =>
                setFilters((prev) => ({ ...prev, pageNumber: page, pageSize }))
              }
            />
          </Flex>
        </>
      )}
    </div>
  )
}
