/**
 * ActiveBidsList — full list of auctions the user is actively participating in.
 *
 * Two view modes controlled by parent:
 * - Table: Ant Design Table (desktop) / List (mobile) with 6 columns
 * - Card: Responsive grid of compact bid cards
 *
 * Includes client-side filters:
 * - Status: All | Winning | Outbid | Waiting
 * - Auction type: All | Open | Sealed
 * - Sort: Time left | Price | My bid
 *
 * Pattern follows MyActiveBidsTable.tsx from Dashboard but with
 * more columns, filters, and expanded data set.
 */

import { useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Typography,
  List,
  Avatar,
  Button,
  Empty,
  Skeleton,
  Select,
  Flex,
  Card,
  Row,
  Col,
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyBidItem } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND, formatCountdown } from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface ActiveBidsListProps {
  bids: MyBidItem[];
  isLoading: boolean;
  viewMode: 'table' | 'card';
}

/** Maps bid status to color + i18n key for Tag rendering */
function getBidStatusTag(
  status: MyBidItem['myBidStatus'],
  t: (key: string) => string,
) {
  const map: Record<string, { color: string; label: string }> = {
    winning: { color: 'green', label: t('myBids.statusWinning') },
    active: { color: 'blue', label: t('myBids.statusWaiting') },
    outbid: { color: 'orange', label: t('myBids.statusOutbid') },
  };
  return map[status] ?? { color: 'default', label: status };
}

export function ActiveBidsList({ bids, isLoading, viewMode }: ActiveBidsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // ─── Filter state ──────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timeLeft');

  // ─── Client-side filtering + sorting ───────────────────────────
  const filteredBids = useMemo(() => {
    let result = [...bids];

    // Filter by bid status
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.myBidStatus === statusFilter);
    }

    // Filter by auction type
    if (typeFilter !== 'all') {
      result = result.filter((b) => b.auction.auctionType === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'timeLeft':
          return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
        case 'price':
          return (b.auction.currentPrice ?? b.auction.startingPrice)
            - (a.auction.currentPrice ?? a.auction.startingPrice);
        case 'myBid':
          return b.myLatestBid.amount - a.myLatestBid.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [bids, statusFilter, typeFilter, sortBy]);

  // ─── Empty state ───────────────────────────────────────────────
  const emptyContent = (
    <Empty
      description={
        <Space direction="vertical" size={4}>
          <Text>{t('myBids.emptyActive')}</Text>
          <Text type="secondary">{t('myBids.emptyActiveHint')}</Text>
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
            { value: 'winning', label: t('myBids.statusWinning') },
            { value: 'outbid', label: t('myBids.statusOutbid') },
            { value: 'active', label: t('myBids.statusWaiting') },
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
            { value: 'myBid', label: t('myBids.sortMyBid') },
          ]}
        />
      </Flex>
    </Flex>
  );

  // ─── Desktop: Table view ───────────────────────────────────────
  const columns = [
    {
      title: t('myBids.columnItem'),
      key: 'item',
      render: (_: unknown, record: MyBidItem) => (
        <Space>
          <img
            src={record.auction.primaryImageUrl || '/placeholder-item.svg'}
            alt={record.auction.itemTitle}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
          <Paragraph
            ellipsis={{ rows: 1 }}
            style={{ margin: 0 }}
          >
            {record.auction.itemTitle}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: t('myBids.columnCurrentPrice'),
      key: 'currentPrice',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text>
          {formatVND(record.auction.currentPrice ?? record.auction.startingPrice)}
        </Text>
      ),
    },
    {
      title: t('myBids.columnYourBid'),
      key: 'yourBid',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text strong>{formatVND(record.myLatestBid.amount)}</Text>
      ),
    },
    {
      title: t('myBids.columnStatus'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: MyBidItem) => {
        const tag = getBidStatusTag(record.myBidStatus, t);
        return <Tag color={tag.color}>{tag.label}</Tag>;
      },
    },
    {
      title: t('myBids.columnDeposit'),
      key: 'deposit',
      width: 120,
      render: () => (
        <Tag color="orange">{t('myBids.depositHolding')}</Tag>
      ),
    },
    {
      title: t('myBids.columnTimeLeft'),
      key: 'timeLeft',
      width: 150,
      render: (_: unknown, record: MyBidItem) => {
        const isLive =
          record.auction.status === 'active';
        return (
          <Space size={4}>
            <ClockCircleOutlined
              style={{ color: isLive ? '#52c41a' : '#999' }}
            />
            <Text type={isLive ? undefined : 'secondary'}>
              {isLive
                ? formatCountdown(record.auction.endTime, t)
                : t('auction.ended')}
            </Text>
          </Space>
        );
      },
    },
  ];

  // ─── Mobile: List view (used when viewMode=table on small screens) ──
  const mobileList = (
    <List
      dataSource={filteredBids}
      locale={{ emptyText: emptyContent }}
      renderItem={(item) => {
        const tag = getBidStatusTag(item.myBidStatus, t);
        const isLive =
          item.auction.status === 'active';
        return (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 0' }}
            onClick={() => navigate(`/auction/${item.auction.id}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={48}
                  src={item.auction.primaryImageUrl || '/placeholder-item.svg'}
                />
              }
              title={
                <Paragraph
                  ellipsis={{ rows: 1 }}
                  style={{ margin: 0, fontSize: 14 }}
                >
                  {item.auction.itemTitle}
                </Paragraph>
              }
              description={
                <Flex wrap="wrap" gap={4}>
                  <Text style={{ fontSize: 13 }}>
                    {formatVND(item.myLatestBid.amount)}
                  </Text>
                  <Tag color={tag.color} style={{ margin: 0 }}>
                    {tag.label}
                  </Tag>
                  {isLive && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> {formatCountdown(item.auction.endTime, t)}
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

  // ─── Card view ────────────────────────────────────────────────
  const cardGrid = (
    <Row gutter={[16, 16]}>
      {filteredBids.map((item) => {
        const tag = getBidStatusTag(item.myBidStatus, t);
        const isLive =
          item.auction.status === 'active';
        return (
          <Col key={item.auction.id} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              onClick={() => navigate(`/auction/${item.auction.id}`)}
              styles={{ body: { padding: 16 } }}
              cover={
                <div style={{ position: 'relative' }}>
                  <img
                    alt={item.auction.itemTitle}
                    src={item.auction.primaryImageUrl || '/placeholder-item.svg'}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                  {/* Status badge — top-right */}
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tag color={tag.color}>{tag.label}</Tag>
                  </div>
                </div>
              }
            >
              <Paragraph
                strong
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 8, fontSize: 15 }}
              >
                {item.auction.itemTitle}
              </Paragraph>

              {/* Price comparison */}
              <Flex justify="space-between" style={{ marginBottom: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('myBids.columnCurrentPrice')}
                  </Text>
                  <div>
                    <Text style={{ fontSize: 14 }}>
                      {formatVND(item.auction.currentPrice ?? item.auction.startingPrice)}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('myBids.columnYourBid')}
                  </Text>
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#1677ff' }}>
                      {formatVND(item.myLatestBid.amount)}
                    </Text>
                  </div>
                </div>
              </Flex>

              {/* Footer: deposit + time left */}
              <Flex justify="space-between" align="center">
                <Tag color="orange" style={{ margin: 0 }}>
                  {t('myBids.depositHolding')}
                </Tag>
                {isLive && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> {formatCountdown(item.auction.endTime, t)}
                  </Text>
                )}
              </Flex>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  // ─── Render logic ─────────────────────────────────────────────
  // Card mode: always use card grid. Table mode: table on desktop, list on mobile.
  const renderContent = () => {
    if (filteredBids.length === 0) return emptyContent;

    if (viewMode === 'card') return cardGrid;

    // Table mode: responsive — table on desktop, compact list on mobile
    return isMobile ? mobileList : (
      <Table
        dataSource={filteredBids}
        columns={columns}
        rowKey={(record) => record.auction.id}
        pagination={false}
        size="small"
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/auction/${record.auction.id}`),
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
