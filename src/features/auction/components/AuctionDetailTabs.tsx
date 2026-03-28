import { Tabs, Typography, Flex } from 'antd'
import { CheckCircleOutlined, SafetyOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { ItemQA } from '@/features/item/components/ItemQA'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

export interface AuctionDetailTabsProps {
  item: {
    id: string
    title?: string
    description?: string
    condition?: string
    quantity?: number
    categoryId?: string
    status?: string
    createdAt?: string
    images?: { url: string }[]
    sellerId?: string
  }
  auction: {
    sellerId?: string
    bidCount?: number
    verifyByPlatform?: boolean
    assignedAdminId?: string
    reservePrice?: { amount: number; currency?: string } | null
    isReserveMet?: boolean
  }
  recentBids: Array<{
    id?: string
    bidderId?: string
    amount?: { amount: number; currency?: string } | number
    isAutoBid?: boolean
    status?: string
    createdAt?: string
  }>
  currency: string
  bidCount: number
  isSeller: boolean
  categoryName?: string
  qaConnected?: boolean
  qaLastSyncedAt?: number | null
}

function SellerIdentity({ sellerId }: { sellerId?: string }) {
  if (!sellerId) {
    return (
      <Typography.Text type="secondary">
        Seller profile is not available for this listing.
      </Typography.Text>
    )
  }

  return (
    <>
      <div
        style={{
          alignItems: 'center',
          background: 'var(--color-accent-light)',
          borderRadius: '50%',
          color: 'var(--color-accent)',
          display: 'flex',
          fontSize: 20,
          fontWeight: 600,
          height: 56,
          justifyContent: 'center',
          width: 56,
        }}
      >
        {sellerId[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {sellerId}
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Public seller activity and catalogue are available on the seller profile page.
        </Typography.Text>
        <div style={{ marginTop: 12 }}>
          <Link to={`/sellers/${sellerId}`}>View seller profile</Link>
        </div>
      </div>
    </>
  )
}

export function AuctionDetailTabs({
  item,
  auction,
  recentBids,
  currency,
  bidCount,
  isSeller,
  categoryName,
  qaConnected = false,
  qaLastSyncedAt = null,
}: AuctionDetailTabsProps) {
  const { t } = useTranslation()
  const sellerId = item.sellerId ?? auction.sellerId

  return (
    <Tabs
      defaultActiveKey="condition"
      items={[
        {
          key: 'condition',
          label: t('specifications', 'Thông số kỹ thuật'),
          children: (
            <div style={{ maxWidth: 600 }}>
              <Flex gap={8} align="center" style={{ marginBottom: 16 }}>
                {item.condition ? <StatusBadge status={item.condition} /> : null}
              </Flex>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px 16px', fontSize: 14 }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('condition', 'Tình trạng')}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{item.condition}</span>
                {item.categoryId && (
                  <>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('category', 'Danh mục')}</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{categoryName ?? item.categoryId}</span>
                  </>
                )}
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('quantity', 'Số lượng')}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{item.quantity ?? 1}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('itemStatus', 'Trạng thái')}</span>
                <span>{item.status ? <StatusBadge status={item.status} size="small" /> : '—'}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t('createdAt', 'Ngày tạo')}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{item.createdAt ? formatDate(item.createdAt) : '—'}</span>
              </div>
            </div>
          ),
        },
        {
          key: 'description',
          label: t('productDescription', 'Mô tả sản phẩm'),
          children: (
            <div style={{ maxWidth: 720 }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 12, textTransform: 'uppercase' }}>
                  {t('productOverview', 'Tổng quan sản phẩm')}
                </h3>
                {item.description ? (
                  <Typography.Paragraph style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">{t('noDescription', 'No description available.')}</Typography.Text>
                )}
              </div>

              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: 'var(--color-text-primary)', fontSize: 16, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 16, textTransform: 'uppercase' }}>
                  {t('conditionDetails', 'Tình trạng chi tiết')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {item.condition && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', flexShrink: 0, fontSize: 16, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('conditionLabel', 'Tình trạng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{item.condition}</strong>
                      </span>
                    </div>
                  )}
                  {item.quantity && item.quantity > 1 && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', flexShrink: 0, fontSize: 16, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('quantity', 'Số lượng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{item.quantity}</strong>
                      </span>
                    </div>
                  )}
                  {item.categoryId && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', flexShrink: 0, fontSize: 16, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('category', 'Danh mục')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{categoryName ?? item.categoryId}</strong>
                      </span>
                    </div>
                  )}
                  {auction.verifyByPlatform && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', flexShrink: 0, fontSize: 16, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('platformVerified', 'Đã được nền tảng xác minh')}
                      </span>
                    </div>
                  )}
                  {item.createdAt && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
                      <CheckCircleOutlined style={{ color: 'var(--color-success)', flexShrink: 0, fontSize: 16, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('listedDate', 'Ngày đăng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(item.createdAt)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'bidHistory',
          label: (
            <span>
              {t('bidHistory', 'Bid History')}
              {bidCount > 0 && (
                <span style={{ background: 'var(--color-accent-light)', borderRadius: 10, color: 'var(--color-accent)', fontSize: 11, fontWeight: 600, marginLeft: 6, padding: '1px 6px' }}>
                  {bidCount}
                </span>
              )}
            </span>
          ),
          children: recentBids.length === 0 ? (
            <Typography.Text type="secondary">{t('noBids', 'No bids yet')}</Typography.Text>
          ) : (
            <div style={{ maxWidth: 600 }}>
              {recentBids.map((bid, index) => (
                <Flex
                  key={bid.id ?? `${bid.bidderId}-${index}`}
                  justify="space-between"
                  align="center"
                  style={{
                    borderBottom:
                      index < recentBids.length - 1 ? '1px solid var(--color-border-light)' : undefined,
                    padding: '12px 0',
                  }}
                >
                  <Flex gap={8} align="center">
                    <span className="oio-price" style={{ fontSize: 15 }}>
                      {formatCurrency(
                        typeof bid.amount === 'number' ? bid.amount : bid.amount?.amount ?? 0,
                        typeof bid.amount === 'number' ? currency : bid.amount?.currency ?? currency,
                      )}
                    </span>
                    {bid.isAutoBid && <StatusBadge status="auto" size="small" />}
                    {bid.status && <StatusBadge status={bid.status} size="small" />}
                  </Flex>
                  <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    {bid.createdAt ? formatDateTime(bid.createdAt) : '—'}
                  </Typography.Text>
                </Flex>
              ))}
            </div>
          ),
        },
        {
          key: 'seller',
          label: t('sellerTab', 'Người bán'),
          children: (
            <div style={{ maxWidth: 600 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 16, marginBottom: 20 }}>
                <SellerIdentity sellerId={sellerId} />
              </div>
            </div>
          ),
        },
        {
          key: 'certification',
          label: t('certificationTab', 'Chứng nhận và kiểm định'),
          children: (
            <div style={{ maxWidth: 720 }}>
              <div
                style={{
                  background: auction.verifyByPlatform ? 'rgba(74, 124, 89, 0.06)' : 'rgba(139, 115, 85, 0.06)',
                  border: `1px solid ${auction.verifyByPlatform ? 'rgba(74, 124, 89, 0.2)' : 'var(--color-border)'}`,
                  borderRadius: 8,
                  marginBottom: 24,
                  padding: '20px 24px',
                }}
              >
                <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 12 }}>
                  <SafetyOutlined
                    style={{
                      color: auction.verifyByPlatform ? 'var(--color-success)' : 'var(--color-text-secondary)',
                      fontSize: 20,
                    }}
                  />
                  <div>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: 15, fontWeight: 600 }}>
                      {t('inspectionStatus', 'Trạng thái kiểm định')}:{' '}
                      {auction.verifyByPlatform ? (
                        <span style={{ color: 'var(--color-success)' }}>
                          {t('approved', 'Đã phê duyệt')} <CheckCircleOutlined />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {t('pending', 'Chưa có kiểm định nền tảng')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.8, paddingLeft: 32 }}>
                  <div>
                    {auction.verifyByPlatform
                      ? t(
                          'verifiedByPlatformNote',
                          'OIO đã xác minh listing này trước khi mở đấu giá. Trang này hiện chỉ hiển thị trạng thái xác minh và thông tin kiểm định cơ bản.',
                        )
                      : t(
                          'noCertificateAvailable',
                          'Listing này không có chứng chỉ hoặc biên bản kiểm định công khai trong dữ liệu hiện tại.',
                        )}
                  </div>
                  {auction.assignedAdminId && (
                    <div>
                      {t('reviewOwner', 'Nhân sự phụ trách')}:{' '}
                      <strong style={{ color: 'var(--color-text-primary)' }}>{auction.assignedAdminId}</strong>
                    </div>
                  )}
                  {auction.reservePrice && (
                    <div>
                      {t('reservePrice', 'Giá bảo lưu')}:{' '}
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(auction.reservePrice.amount, auction.reservePrice.currency ?? currency)}
                      </strong>
                      {' • '}
                      <span style={{ color: auction.isReserveMet ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                        {auction.isReserveMet
                          ? t('reserveMet', 'Đã đạt giá bảo lưu')
                          : t('reserveNotMet', 'Chưa đạt giá bảo lưu')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 12, textTransform: 'uppercase' }}>
                {t('itemInfo', 'Thông tin sản phẩm')}
              </h3>
              <div style={{ display: 'grid', gap: '12px 16px', gridTemplateColumns: '160px 1fr', fontSize: 14 }}>
                {item.categoryId && (
                  <>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('category', 'Danh mục')}</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{categoryName ?? item.categoryId}</span>
                  </>
                )}
                <span style={{ color: 'var(--color-text-secondary)' }}>{t('quantity', 'Số lượng')}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{item.quantity ?? 1}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{t('itemStatus', 'Trạng thái')}</span>
                <span>{item.status ? <StatusBadge status={item.status} size="small" /> : '—'}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{t('createdAt', 'Ngày tạo')}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{item.createdAt ? formatDate(item.createdAt) : '—'}</span>
              </div>
            </div>
          ),
        },
        {
          key: 'qna',
          label: t('qna', 'Q&A'),
          children: (
            <ItemQA
              itemId={item.id}
              isSeller={isSeller}
              realtimeConnected={qaConnected}
              lastSyncedAt={qaLastSyncedAt}
            />
          ),
        },
      ]}
    />
  )
}
