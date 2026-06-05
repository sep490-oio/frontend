import { Flex, Tag, Typography, Avatar, Space } from 'antd'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { formatCurrency } from '@/utils/format'

export function AdminAuctionHeader({ auction, item, bids }: { auction: any, item: any, bids: any[] }) {
  const { t } = useTranslation('admin')

  const startTime = auction.startTime ? dayjs(auction.startTime).format('HH:mm:ss DD/MM/YYYY') : '—'
  const endTime = auction.actualEndTime 
    ? dayjs(auction.actualEndTime).format('HH:mm:ss DD/MM/YYYY') 
    : auction.endTime 
      ? dayjs(auction.endTime).format('HH:mm:ss DD/MM/YYYY') 
      : '—'

  const winnerBid = bids?.find(b => b.status === 'winning' || b.status === 'won')
  const isBuyNow = auction.currentPrice?.amount && auction.buyNowPrice?.amount && auction.currentPrice.amount >= auction.buyNowPrice.amount

  return (
    <Flex gap={24} align="flex-start" style={{ background: 'var(--color-bg-container)', padding: 24, borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <Avatar 
        shape="square" 
        size={100} 
        src={item?.images?.[0]?.url || item?.primaryImageUrl} 
        style={{ background: 'var(--color-bg-layout)', borderRadius: 8 }}
      />
      
      <Flex vertical gap={12} style={{ flex: 1 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            <Link to={`/admin/items/${auction.itemId}`}>{item?.title || auction.itemId}</Link>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }} copyable={{ text: auction.id }}>
            ID: {auction.id.substring(0, 8)}...
          </Typography.Text>
        </div>

        <Flex gap={32} wrap="wrap">
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auctionDetail.header.time', 'Time')}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>{startTime} - {endTime}</Typography.Text>
          </Space>

          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auctionDetail.header.startPriceIncrement', 'Start Price / Increment')}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {formatCurrency(auction.startPrice?.amount || 0)} / {formatCurrency(auction.increment?.amount || 0)}
            </Typography.Text>
          </Space>

          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auctionDetail.header.finalPrice', 'Final Price')}</Typography.Text>
            <Space size={8}>
              <Typography.Text strong style={{ fontSize: 13, color: 'var(--color-primary)' }}>
                {formatCurrency(auction.currentPrice?.amount || 0)}
              </Typography.Text>
              {isBuyNow && <Tag color="gold" style={{ margin: 0 }}>{t('auctionDetail.header.buyNow', 'BUY NOW')}</Tag>}
            </Space>
          </Space>

          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auctionDetail.header.winner', 'Winner')}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {winnerBid ? winnerBid.bidderDisplayName || 'Unknown' : '—'}
            </Typography.Text>
          </Space>

          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('auctionDetail.header.totalBids', 'Total Bids')}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {auction.bidCount || 0}
            </Typography.Text>
          </Space>
        </Flex>
      </Flex>
    </Flex>
  )
}
