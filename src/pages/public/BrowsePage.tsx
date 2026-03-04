/**
 * BrowsePage — public catalog page where users explore auctions.
 *
 * This is the "front door" of the platform — accessible without login.
 * Features:
 * - Search bar (400ms debounce to avoid query-per-keystroke)
 * - Category filter (parent groups with child options)
 * - Status filter (Live / Qualifying / Ended / All)
 * - Sort selector (Ending soonest, Price, Bids, Newest)
 * - Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
 * - Ant Design Pagination at the bottom
 *
 * Data is fetched via TanStack Query (useAuctions hook).
 * Filter changes automatically trigger a refetch because
 * the filters object is part of the query key.
 */

import { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Typography,
  Pagination,
  Spin,
  Empty,
  Space,
  Flex,
  Button,
} from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AuctionFilters, AuctionStatus } from '@/types';
import { useAuctions, useCategories } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const { Title, Text } = Typography;


/** Sort options for the sort dropdown */
const SORT_OPTIONS: {
  value: string;
  labelKey: string;
  sortBy: AuctionFilters['sortBy'];
  sortOrder: AuctionFilters['sortOrder'];
}[] = [
  { value: 'endingSoon', labelKey: 'auction.sortEndingSoon', sortBy: 'endTime', sortOrder: 'asc' },
  { value: 'lowestPrice', labelKey: 'auction.sortLowestPrice', sortBy: 'currentPrice', sortOrder: 'asc' },
  { value: 'highestPrice', labelKey: 'auction.sortHighestPrice', sortBy: 'currentPrice', sortOrder: 'desc' },
  { value: 'mostBids', labelKey: 'auction.sortMostBids', sortBy: 'bidCount', sortOrder: 'desc' },
  { value: 'newest', labelKey: 'auction.sortNewest', sortBy: 'createdAt', sortOrder: 'desc' },
];

export function BrowsePage() {
  const { t } = useTranslation();

  // ─── Filter state ────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortValue, setSortValue] = useState('endingSoon');
  const [page, setPage] = useState(1);

  // Debounce search input — waits 400ms after the user stops typing
  const debouncedSearch = useDebouncedValue(searchText, 400);

  // Resolve the selected sort option into sortBy + sortOrder
  const selectedSort = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];

  // Build the filter object passed to useAuctions
  const filters: AuctionFilters = useMemo(() => {
    const f: AuctionFilters = {
      page,
      sortBy: selectedSort.sortBy,
      sortOrder: selectedSort.sortOrder,
    };

    if (debouncedSearch) f.search = debouncedSearch;
    if (categoryId) f.categoryId = categoryId;

    // Map status filter to AuctionStatus values
    if (statusFilter === 'active') {
      f.status = ['active'] as AuctionStatus[];
    } else if (statusFilter === 'qualifying') {
      f.status = ['qualifying'] as AuctionStatus[];
    } else if (statusFilter === 'ended') {
      f.status = ['ended', 'sold', 'cancelled', 'failed'] as AuctionStatus[];
    }
    // 'all' → no status filter

    return f;
  }, [debouncedSearch, categoryId, statusFilter, selectedSort, page]);

  // ─── Data fetching ───────────────────────────────────────────
  const { data, isLoading } = useAuctions(filters);
  const { data: categories } = useCategories();

  // Build category options for Select — parent as group, children as options

  // Reset page to 1 when any filter changes
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

return (

    <div style={{ maxWidth: 1440  , margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title
          level={1}
          style={{
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 8,
            color: '#000',
          }}
        >
          Browse Auctions
        </Title>
        <Text
          style={{
            fontSize: 16,
            color: '#E5E7E0',
            display: 'block',
          }}
        >
          Discover authenticated luxury items from verified sellers
        </Text>
      </div>

      {/* Search + Sort + Filters bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Input
          placeholder="Search by brand, model, or keyword..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          allowClear
          size="large"
          style={{
            flex: 1,
            maxWidth: 600,
            height: 48,
            borderRadius: 8,
            fontSize: 16,
            background: '#fff',
            border: '1px solid #d9d9d9',
          }}
        />

        <Select
          value={sortValue}
          onChange={handleFilterChange(setSortValue)}
          options={SORT_OPTIONS.map((o) => ({
            label: t(o.labelKey),
            value: o.value,
          }))}
          size="large"
          style={{
            width: 180,
            height: 48,
            borderRadius: 8,
          }}
          placeholder="ending-soon"
        />

        <Button
          icon={<MenuOutlined />}
          size="large"
          style={{
            height: 48,
            borderRadius: 8,
            padding: '0 16px',
          }}
        >
          Filters
        </Button>
      </div>

      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <Space wrap size={[8, 12]}>
          <Button
            type={categoryId === undefined ? 'primary' : 'default'}
            onClick={() => {
              setCategoryId(undefined);
              setPage(1);
            }}
            style={{
              borderRadius: 9999,
              padding: '0 24px',
              height: 40,
              fontSize: 15,
              fontWeight: 600,
              background: categoryId === undefined ? '#000' : '#fff',
              color: categoryId === undefined ? '#fff' : '#000',
              border: categoryId === undefined ? 'none' : '1px solid #d9d9d9',
              boxShadow: categoryId === undefined ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            All Categories
          </Button>

          {categories?.map((cat) => (
            <Button
              key={cat.id}
              type={categoryId === cat.id ? 'primary' : 'default'}
              onClick={() => {
                setCategoryId(cat.id);
                setPage(1);
              }}
              style={{
                borderRadius: 9999,
                padding: '0 20px',
                height: 40,
                fontSize: 15,
                fontWeight: 500,
                background: categoryId === cat.id ? '#000' : '#fff',
                color: categoryId === cat.id ? '#fff' : '#000',
                border: categoryId === cat.id ? 'none' : '1px solid #d9d9d9',
                boxShadow: categoryId === cat.id ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {cat.name}
            </Button>
          ))}
        </Space>
      </div>


      {isLoading ? (
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </Flex>
      ) : !data || data.items.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={8}>
              <Text>No auctions found</Text>
              <Text type="secondary">Try adjusting filters or search term</Text>
            </Space>
          }
          style={{ margin: '120px 0' }}
        />
      ) : (
        <>
          <Row gutter={[24, 32]}>
            {data.items.map((auction) => (
              <Col key={auction.id} xs={24} sm={12} md={8} lg={6}>
                <AuctionCard auction={auction} />
              </Col>
            ))}
          </Row>

          {data.totalPages > 1 && (
            <Flex justify="center" style={{ marginTop: 48 }}>
              <Pagination
                current={data.page}
                total={data.totalItems}
                pageSize={data.pageSize}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </Flex>
          )}
        </>
      )}
    </div>

);
}
