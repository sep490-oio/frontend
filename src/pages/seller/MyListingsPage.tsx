/**
 * MyListingsPage — Seller's management dashboard for items and auctions.
 *
 * Two tabs:
 * 1. My Items — all seller's items with status badges and "Create Auction" action
 * 2. My Auctions — all seller's auctions with status-specific actions
 *
 * Requires seller role — shows "Become a Seller" prompt for non-sellers.
 * Uses separate SellerAuctionListItem component (not AuctionCard — Trung's no-go zone).
 */

import { useState } from 'react';
import axios from 'axios';
import {
  Card,
  Typography,
  Tabs,
  Table,
  Tag,
  Button,
  Flex,
  Image,
  Select,
  Result,
  Space,
  message,
} from 'antd';
import {
  ShopOutlined,
  PlusOutlined,
  RocketOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppSelector } from '@/app/hooks';
import { useMyItems, useMyAuctions, useSubmitAuction, usePublishAuction } from '@/hooks/useSellerManagement';
import { useSubmitItem } from '@/hooks/useItems';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND, STATUS_KEYS, STATUS_COLORS } from '@/utils/formatters';
import type { SellerItem } from '@/types/item';
import type { AuctionListItem } from '@/types/auction';
import type { AuctionStatus } from '@/types/enums';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// ─── Item status display helpers ────────────────────────────────────

const ITEM_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  pending_verify: 'gold',
  approved: 'cyan',
  active: 'green',
  in_auction: 'blue',
  sold: 'purple',
  removed: 'red',
};

const ITEM_STATUS_KEYS: Record<string, string> = {
  draft: 'myListings.itemStatusDraft',
  pending_review: 'myListings.itemStatusPendingReview',
  pending_verify: 'myListings.itemStatusPendingVerify',
  approved: 'myListings.itemStatusApproved',
  active: 'myListings.itemStatusActive',
  in_auction: 'myListings.itemStatusInAuction',
  sold: 'myListings.itemStatusSold',
  removed: 'myListings.itemStatusRemoved',
};

export function MyListingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const user = useAppSelector((state) => state.auth.user);

  // ─── Auction filters ────────────────────────────────────────────
  const [auctionStatus, setAuctionStatus] = useState<AuctionStatus | undefined>(undefined);
  const [auctionPage, setAuctionPage] = useState(1);

  // ─── Data ───────────────────────────────────────────────────────
  const { data: items = [], isLoading: itemsLoading } = useMyItems();
  const { data: auctionsData, isLoading: auctionsLoading } = useMyAuctions({
    status: auctionStatus,
    page: auctionPage,
    pageSize: 10,
  });
  const submitAuction = useSubmitAuction();
  const publishAuction = usePublishAuction();
  const submitItem = useSubmitItem();

  // ─── Seller role check ──────────────────────────────────────────
  if (!user?.hasSellerPermission) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
        <Result
          icon={<ShopOutlined />}
          title={t('myListings.sellerRequired')}
          subTitle={t('myListings.sellerRequiredHint')}
          extra={
            <Button type="primary" onClick={() => navigate('/profile')}>
              {t('createAuction.goToProfile')}
            </Button>
          }
        />
      </div>
    );
  }

  // ─── Submit item for review handler ─────────────────────────────
  const handleSubmitItem = async (itemId: string) => {
    try {
      await submitItem.mutateAsync(itemId);
      message.success(t('createItem.submitSuccess'));
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.response?.data?.title ?? t('common.error'))
        : t('common.error');
      message.error(errorMsg);
    }
  };

  // ─── Publish auction handler (Scheduled → Active) ─────────────
  const handlePublishAuction = async (auctionId: string) => {
    try {
      await publishAuction.mutateAsync(auctionId);
      message.success(t('createAuction.publishSuccess'));
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.response?.data?.title ?? t('common.error'))
        : t('common.error');
      message.error(errorMsg);
    }
  };

  // ─── Submit auction handler (Draft → Scheduled) ───────────────
  const handlePublish = async (auctionId: string) => {
    try {
      await submitAuction.mutateAsync(auctionId);
      message.success(t('createAuction.publishSuccess'));
    } catch (err) {
      // Map known BE rejection reasons to friendly i18n messages
      const beDetail: string = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.response?.data?.title ?? '')
        : err instanceof Error ? err.message : '';

      let errorMsg: string;
      if (beDetail.includes('pending_verify')) {
        errorMsg = t('myListings.submitErrorItemPendingVerify');
      } else if (beDetail.includes('pending_review')) {
        errorMsg = t('myListings.submitErrorItemPendingReview');
      } else if (beDetail.includes("Cannot perform") || beDetail.includes("cannot perform")) {
        errorMsg = t('myListings.submitErrorInvalidStatus');
      } else {
        errorMsg = beDetail || t('common.error');
      }
      message.error(errorMsg);
    }
  };

  // ─── Item table columns ─────────────────────────────────────────
  const itemColumns: ColumnsType<SellerItem> = [
    {
      title: '',
      dataIndex: 'primaryImageUrl',
      key: 'image',
      width: 64,
      render: (url: string | null) => (
        <Image
          src={url || '/placeholder-item.svg'}
          width={48}
          height={48}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
          fallback="/placeholder-item.svg"
        />
      ),
    },
    {
      title: t('myListings.itemTitle'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: t('myListings.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={ITEM_STATUS_COLORS[status] ?? 'default'}>
          {ITEM_STATUS_KEYS[status] ? t(ITEM_STATUS_KEYS[status]) : t('common.unknownStatus')}
        </Tag>
      ),
    },
    {
      title: t('myListings.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      responsive: ['md'],
    },
    {
      title: t('myListings.actions'),
      key: 'actions',
      width: 150,
      render: (_: unknown, record: SellerItem) => (
        <Space size="small">
          {record.status === 'draft' && (
            <Button
              size="small"
              loading={submitItem.isPending}
              onClick={() => handleSubmitItem(record.id)}
            >
              {t('myListings.submitForReview')}
            </Button>
          )}
          {(record.status === 'active' || record.status === 'approved') && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/create-auction/${record.id}`)}
            >
              {t('myListings.createAuction')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ─── Auction table columns ──────────────────────────────────────
  const auctionColumns: ColumnsType<AuctionListItem> = [
    {
      title: '',
      dataIndex: 'primaryImageUrl',
      key: 'image',
      width: 64,
      render: (url: string | null) => (
        <Image
          src={url || '/placeholder-item.svg'}
          width={48}
          height={48}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
          fallback="/placeholder-item.svg"
        />
      ),
    },
    {
      title: t('myListings.auctionTitle'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
    },
    {
      title: t('myListings.currentPrice'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 140,
      render: (price: number) => formatVND(price),
    },
    {
      title: t('myListings.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: AuctionStatus) => (
        <Tag color={STATUS_COLORS[status] ?? 'default'}>
          {STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : t('common.unknownStatus')}
        </Tag>
      ),
    },
    {
      title: t('myListings.bids'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 70,
      responsive: ['md'],
    },
    {
      title: t('myListings.endTime'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      responsive: ['md'],
    },
    {
      title: t('myListings.actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: AuctionListItem) => (
        <Space size="small">
          {record.status === 'draft' && (
            <Button
              size="small"
              icon={<RocketOutlined />}
              loading={submitAuction.isPending}
              onClick={() => handlePublish(record.id)}
            >
              {t('myListings.submit')}
            </Button>
          )}
          {record.status === 'scheduled' && (
            <Button
              type="primary"
              size="small"
              icon={<RocketOutlined />}
              loading={publishAuction.isPending}
              onClick={() => handlePublishAuction(record.id)}
            >
              {t('myListings.publish')}
            </Button>
          )}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/auction/${record.id}`)}
          >
            {t('myListings.view')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{t('myListings.title')}</Title>
          <Text type="secondary">{t('myListings.subtitle')}</Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/create-item')}>
            {t('myListings.newItem')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-auction')}>
            {t('myListings.newAuction')}
          </Button>
        </Space>
      </Flex>

      <Card>
        <Tabs
          defaultActiveKey="items"
          items={[
            {
              key: 'items',
              label: `${t('myListings.tabItems')} (${items.length})`,
              children: (
                <Table<SellerItem>
                  columns={itemColumns}
                  dataSource={items}
                  loading={itemsLoading}
                  rowKey="id"
                  size={isMobile ? 'small' : 'middle'}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 500 }}
                />
              ),
            },
            {
              key: 'auctions',
              label: `${t('myListings.tabAuctions')} (${auctionsData?.totalItems ?? 0})`,
              children: (
                <>
                  <Flex style={{ marginBottom: 12 }}>
                    <Select
                      allowClear
                      placeholder={t('myListings.filterByStatus')}
                      value={auctionStatus}
                      onChange={(value) => {
                        setAuctionStatus(value);
                        setAuctionPage(1);
                      }}
                      style={{ width: 180 }}
                      options={[
                        { value: 'draft', label: t('auction.statusDraft') },
                        { value: 'scheduled', label: t('auction.statusScheduled') },
                        { value: 'pending', label: t('auction.statusPending') },
                        { value: 'active', label: t('auction.statusActive') },
                        { value: 'ended', label: t('auction.statusEnded') },
                        { value: 'sold', label: t('auction.statusSold') },
                        { value: 'cancelled', label: t('auction.statusCancelled') },
                        { value: 'failed', label: t('auction.statusFailed') },
                      ]}
                    />
                  </Flex>
                  <Table<AuctionListItem>
                    columns={auctionColumns}
                    dataSource={auctionsData?.items ?? []}
                    loading={auctionsLoading}
                    rowKey="id"
                    size={isMobile ? 'small' : 'middle'}
                    pagination={{
                      current: auctionPage,
                      pageSize: 10,
                      total: auctionsData?.totalItems ?? 0,
                      onChange: setAuctionPage,
                    }}
                    scroll={{ x: 600 }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
