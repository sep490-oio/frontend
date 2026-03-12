/**
 * WatchingList — auctions the user is watching (heart only, no deposit).
 *
 * Two view modes controlled by parent:
 * - Card: AuctionCard from Browse page in responsive grid (default)
 * - Table: Ant Design Table (desktop) / List (mobile) with auction info
 *
 * AuctionCard was designed for reuse here (its JSDoc says:
 * "Reusable across Browse page, Home page featured section,
 * and future Watchlist page").
 *
 * Includes client-side filters:
 * - Auction status: All | Active | Qualifying
 * - Auction type: All | Open | Sealed
 * - Sort: Time left | Price
 */

import { useMemo, useState } from 'react';
import {
  Row,
  Col,
  Empty,
  Button,
  Typography,
  Space,
  Skeleton,
  Select,
  Flex,
  Table,
  Tag,
  List,
  Avatar,
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { formatVND, formatCountdown, STATUS_KEYS, STATUS_COLORS } from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface WatchingListProps {
  auctions: AuctionListItem[];
  isLoading: boolean;
  viewMode: 'table' | 'card';
}

export function WatchingList({ auctions, isLoading, viewMode }: WatchingListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // ─── Filter state ──────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timeLeft');

  // ─── Client-side filtering + sorting ───────────────────────────
  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    // Filter by auction status
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by auction type
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.auctionType === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'timeLeft':
          return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
        case 'price':
          return (b.currentPrice ?? b.startingPrice)
            - (a.currentPrice ?? a.startingPrice);
        default:
          return 0;
      }
    });

    return result;
  }, [auctions, statusFilter, typeFilter, sortBy]);

  // ─── Empty state ───────────────────────────────────────────────
  const emptyContent = (
    <Empty
      description={
        <Space direction="vertical" size={4}>
          <Text>{t('myBids.emptyWatching')}</Text>
          <Text type="secondary">{t('myBids.emptyWatchingHint')}</Text>
        </Space>
      }
    >
      <Button type="primary" onClick={() => navigate('/browse')}>
        {t('myBids.browseNow')}
      </Button>
    </Empty>
  );

  // ─── Filter bar ────────────────────────────────────────────────
  const filterBar = (
    <Flex wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterStatus')}:
        </Text>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 130 }}
          options={[
            { value: 'all', label: t('myBids.filterAll') },
            { value: 'active', label: t('auction.statusActive') },
          ]}
        />
      </Flex>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterType')}:
        </Text>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 130 }}
          options={[
            { value: 'all', label: t('myBids.filterAll') },
            { value: 'open', label: t('myBids.typeOpen') },
            { value: 'sealed', label: t('myBids.typeSealed') },
          ]}
        />
      </Flex>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterSort')}:
        </Text>
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 150 }}
          options={[
            { value: 'timeLeft', label: t('myBids.sortTimeLeft') },
            { value: 'price', label: t('myBids.sortPrice') },
          ]}
        />
      </Flex>
    </Flex>
  );

  // ─── Card view (using AuctionCard) ────────────────────────────
  const cardGrid = (
    <Row gutter={[16, 16]}>
      {filteredAuctions.map((auction) => (
        <Col key={auction.id} xs={24} sm={12} lg={8}>
          <AuctionCard auction={auction} />
        </Col>
      ))}
    </Row>
  );

  // ─── Table view — columns ─────────────────────────────────────
  const columns = [
    {
      title: t('myBids.columnItem'),
      key: 'item',
      render: (_: unknown, record: AuctionListItem) => (
        <Space>
          <img
            src={record.primaryImageUrl || '/placeholder-item.svg'}
            alt={record.itemTitle}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
          <Paragraph
            ellipsis={{ rows: 1 }}
            style={{ margin: 0 }}
          >
            {record.itemTitle}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: t('myBids.columnCurrentPrice'),
      key: 'currentPrice',
      width: 160,
      render: (_: unknown, record: AuctionListItem) => (
        <Text>
          {formatVND(record.currentPrice ?? record.startingPrice)}
        </Text>
      ),
    },
    {
      title: t('myBids.columnStatus'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: AuctionListItem) => (
        <Tag color={STATUS_COLORS[record.status]}>
          {t(STATUS_KEYS[record.status])}
        </Tag>
      ),
    },
    {
      title: t('myBids.filterType'),
      key: 'type',
      width: 120,
      render: (_: unknown, record: AuctionListItem) => (
        <Text>
          {record.auctionType === 'sealed'
            ? t('myBids.typeSealed')
            : t('myBids.typeOpen')}
        </Text>
      ),
    },
    {
      title: t('myBids.columnTimeLeft'),
      key: 'timeLeft',
      width: 150,
      render: (_: unknown, record: AuctionListItem) => {
        const isLive = record.status === 'active';
        return (
          <Space size={4}>
            <ClockCircleOutlined
              style={{ color: isLive ? '#52c41a' : '#999' }}
            />
            <Text type={isLive ? undefined : 'secondary'}>
              {isLive
                ? formatCountdown(record.endTime, t)
                : t('auction.ended')}
            </Text>
          </Space>
        );
      },
    },
  ];

  // ─── Mobile list view (for table mode on small screens) ───────
  const mobileList = (
    <List
      dataSource={filteredAuctions}
      locale={{ emptyText: emptyContent }}
      renderItem={(auction) => {
        const isLive = auction.status === 'active';
        return (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 0' }}
            onClick={() => navigate(`/auction/${auction.id}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={48}
                  src={auction.primaryImageUrl || '/placeholder-item.svg'}
                />
              }
              title={
                <Paragraph
                  ellipsis={{ rows: 1 }}
                  style={{ margin: 0, fontSize: 14 }}
                >
                  {auction.itemTitle}
                </Paragraph>
              }
              description={
                <Flex wrap="wrap" gap={4}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {formatVND(auction.currentPrice ?? auction.startingPrice)}
                  </Text>
                  <Tag color={STATUS_COLORS[auction.status]} style={{ margin: 0 }}>
                    {t(STATUS_KEYS[auction.status])}
                  </Tag>
                  {isLive && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> {formatCountdown(auction.endTime, t)}
                    </Text>
                  )}
                </Flex>
              }
            />
          </List.Item>
        );
      }}
    />
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  // ─── Render logic ─────────────────────────────────────────────
  const renderContent = () => {
    if (filteredAuctions.length === 0) return emptyContent;

    if (viewMode === 'card') return cardGrid;

    // Table mode: responsive — table on desktop, compact list on mobile
    return isMobile ? mobileList : (
      <Table
        dataSource={filteredAuctions}
        columns={columns}
        rowKey={(record) => record.id}
        pagination={false}
        size="small"
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/auction/${record.id}`),
        })}
      />
    );
  };

  return (
    <div>
      {filterBar}
      {renderContent()}
    </div>
  );
}
