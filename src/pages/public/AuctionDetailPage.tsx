/**
 * AuctionDetailPage — the most important page in the platform.
 *
 * Layer 1: Read-only display of all auction info (images, description,
 *          attributes, bid history, seller info).
 * Layer 2: Interactive bidding via BiddingPanel (deposit, bid, buy-now, watch).
 *
 * Layout:
 * - Desktop: two-column (image gallery left, BiddingPanel + seller right)
 * - Mobile: single column, stacked vertically
 *
 * The BiddingPanel orchestrator handles all auction-phase logic
 * (qualifying, active, ended) so this page stays focused on layout
 * and data fetching.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Spin,
  Flex,
  Result,
  Button,
  Descriptions,
  Avatar,
  Rate,
  message,
} from 'antd';
import {
  SafetyCertificateOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuction, useAuctionBids } from '@/hooks/useAuctions';
import { useAuctionHub } from '@/hooks/useAuctionHub';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppSelector } from '@/app/hooks';
import { formatVND } from '@/utils/formatters';
import { ImageGallery } from '@/components/auction/ImageGallery';
import { BidHistoryList } from '@/components/auction/BidHistoryList';
import { BiddingPanel } from '@/components/auction/BiddingPanel';

const { Text, Paragraph } = Typography;

export function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const queryClient = useQueryClient();
  const authState = useAppSelector((state) => state.auth);
  const isLoggedIn = !!authState.accessToken;
  const userId = authState.user?.id;

  const { data: auction, isLoading } = useAuction(id);
  const { data: bids } = useAuctionBids(id);

  // ─── SignalR real-time connection ──────────────────────────────
  // Only connect when logged in (hub requires [Authorize])
  const { isConnected, placeBid: hubPlaceBid, buyNow: hubBuyNow, configureAutoBid: hubConfigureAutoBid } = useAuctionHub(
    isLoggedIn ? id : undefined,
    {
      onBidPlaced: (data) => {
        // Refresh auction data + bid history when any bid is placed
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
        queryClient.invalidateQueries({ queryKey: ['auctionBids', id] });
        // Show success toast only for the current user's bid
        // NOTE: BidPlaced event is currently not firing from BE (confirmed 2026-03-12).
        // Success toast is handled optimistically in BidForm with keyed messages instead.
        if (data.bidderId === userId) {
          message.success({
            content: t('bidding.bidSuccess', { amount: formatVND(data.amount) }),
            key: 'bid-toast',
          });
        }
      },
      onOutbid: (data) => {
        message.warning(
          t('bidding.outbidNotification', {
            amount: formatVND(data.newHighAmount),
          }),
        );
      },
      onPriceUpdated: () => {
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
      },
      onAuctionExtended: (data) => {
        message.info(
          t('bidding.auctionExtended', { minutes: data.extensionMinutes }),
        );
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
      },
      onAuctionEnded: () => {
        message.info(t('bidding.auctionEnded'));
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
      },
      onBuyNowExecuted: () => {
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
      },
      onAuctionCancelled: () => {
        queryClient.invalidateQueries({ queryKey: ['auction', id] });
      },
      onError: (data) => {
        // Signal to BidForm that this bid was rejected — prevents success toast
        window.__bidError = true;
        // BE sends English error messages — show a generic localized error.
        // Uses 'bid-toast' key to REPLACE the loading toast from BidForm.
        console.warn('[AuctionHub] Server error:', data.message);
        message.error({
          content: t('bidding.bidFailed'),
          key: 'bid-toast',
          duration: 4,
        });
      },
    },
  );

  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 80 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  // Not found
  if (!auction) {
    return (
      <Result
        status="404"
        title={t('auctionDetail.notFound')}
        subTitle={t('auctionDetail.notFoundDescription')}
        extra={
          <Button type="primary" onClick={() => navigate('/browse')}>
            {t('auctionDetail.backToBrowse')}
          </Button>
        }
      />
    );
  }

  const isActive = auction.status === 'active';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/browse')}
        style={{ marginBottom: 16 }}
      >
        {t('auctionDetail.backToBrowse')}
      </Button>

      {/* ─── Main two-column layout ──────────────────────────────── */}
      <Row gutter={[24, 24]}>
        {/* Left column: Image gallery */}
        <Col xs={24} md={14}>
          <ImageGallery
            images={auction.item?.images ?? []}
            title={auction.item?.title ?? ''}
          />
        </Col>

        {/* Right column: BiddingPanel + seller info */}
        <Col xs={24} md={10}>
          <div style={isMobile ? undefined : { position: 'sticky', top: 24 }}>
            {/* Interactive bidding panel with SignalR actions */}
            <BiddingPanel
              auction={auction}
              bids={bids ?? []}
              hubPlaceBid={isConnected ? hubPlaceBid : undefined}
              hubBuyNow={isConnected ? hubBuyNow : undefined}
              hubConfigureAutoBid={isConnected ? hubConfigureAutoBid : undefined}
              isConnected={isConnected}
            />

            {/* Seller info card (clickable → seller profile) */}
            {auction.seller && (
              <Card
                size="small"
                hoverable
                onClick={() => navigate(`/seller/${auction.sellerId}`)}
                style={{ cursor: 'pointer' }}
              >
                <Flex align="center" gap={12}>
                  <Avatar
                    src={auction.seller.avatarUrl}
                    icon={<ShopOutlined />}
                    size={48}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap={8}>
                      <Text strong style={{ fontSize: 15 }}>
                        {auction.seller.storeName}
                      </Text>
                      {auction.seller.status === 'verified' && (
                        <SafetyCertificateOutlined
                          style={{ color: '#52c41a', fontSize: 14 }}
                        />
                      )}
                    </Flex>
                    <Flex align="center" gap={8} style={{ marginTop: 4 }}>
                      <Rate
                        disabled
                        allowHalf
                        value={auction.seller.ratingAverage}
                        style={{ fontSize: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('auctionDetail.ratingCount', {
                          count: auction.seller.ratingCount,
                        })}
                      </Text>
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('auctionDetail.sellerTrustScore')}:{' '}
                      <Text strong style={{ fontSize: 12 }}>
                        {auction.seller.trustScore}%
                      </Text>
                    </Text>
                  </div>
                </Flex>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      {/* ─── Full-width sections below ───────────────────────────── */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Item description */}
        <Col xs={24}>
          <Card title={t('auctionDetail.description')}>
            {auction.item?.description ? (
              <Paragraph
                ellipsis={{
                  rows: 6,
                  expandable: 'collapsible',
                  symbol: (expanded: boolean) =>
                    expanded ? t('common.close') : '...',
                }}
              >
                {auction.item.description}
              </Paragraph>
            ) : (
              <Text type="secondary">{t('auctionDetail.noDescription')}</Text>
            )}
          </Card>
        </Col>

        {/* Item attributes */}
        {auction.item?.attributes && auction.item.attributes.length > 0 && (
          <Col xs={24}>
            <Card title={t('auctionDetail.attributes')}>
              <Descriptions
                bordered
                size="small"
                column={isMobile ? 1 : 2}
              >
                {auction.item.attributes.map((attr) => (
                  <Descriptions.Item key={attr.id} label={attr.attributeName}>
                    {attr.attributeValue}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          </Col>
        )}

        {/* Bid history */}
        <Col xs={24}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <span>{t('auctionDetail.bidHistory')}</span>
                <Tag>{auction.bidCount}</Tag>
              </Flex>
            }
          >
            <BidHistoryList
              bids={bids ?? []}
              auctionType={auction.auctionType}
              isActive={isActive}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
