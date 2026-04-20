import { Tabs, Typography, Flex, Tooltip, Grid, Rate } from 'antd'
import { useSellerById } from '@/features/seller/api'
import { CheckCircleOutlined, SafetyOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { ItemQA } from '@/features/item/components/ItemQA'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

const { useBreakpoint } = Grid

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
  auction?: {
    sellerId?: string
    bidCount?: number
    verifyByPlatform?: boolean
    assignedAdminId?: string
    reservePrice?: { amount: number; currency?: string } | null
    isReserveMet?: boolean
  }
  recentBids?: Array<{
    id?: string
    bidderId?: string
    bidderDisplayName?: string
    amount?: { amount: number; currency?: string } | number
    isAutoBid?: boolean
    status?: string
    createdAt?: string
  }>
  currency?: string
  bidCount?: number
  isSeller?: boolean
  sellerUsername?: string
  categoryName?: string
  qaConnected?: boolean
  qaLastSyncedAt?: number | null
  currentUserId?: string
}

function SellerIdentity({
  sellerId,
  sellerUsername,
}: {
  sellerId?: string
  sellerUsername?: string
}) {
  const { t } = useTranslation('auction')
  const { data: seller } = useSellerById(sellerId || '')

  if (!sellerId) {
    return (
      <Typography.Text type="secondary">
        {t('sellerProfileNotAvailable', 'Seller profile is not available for this listing.')}
      </Typography.Text>
    )
  }

  const displayName = seller?.storeName || sellerUsername || `${sellerId.slice(0, 8)}…`
  const avatarChar = displayName[0]?.toUpperCase()
  const reviewCount = seller?.reviewCount || 0
  const rating = seller?.rating || 0

  return (
    <>
      <div
        style={{
          alignItems: 'center',
          background: 'var(--color-accent-light)',
          borderRadius: '50%',
          color: 'var(--color-accent)',
          display: 'flex',
          fontSize: 18,
          fontWeight: 600,
          flexShrink: 0,
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        {avatarChar}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 16,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Link to={`/sellers/${sellerId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {displayName}
          </Link>
          {seller?.status === 'verified' && (
            <Tooltip title={t('verifiedSeller', 'Verified Seller')}>
              <CheckCircleOutlined style={{ color: 'var(--color-success)', marginLeft: 6, fontSize: 14 }} />
            </Tooltip>
          )}
        </div>


        {seller && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rate disabled allowHalf value={rating} style={{ color: 'var(--color-accent)', fontSize: 14 }} />
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              ({reviewCount} {t('reviews', 'đánh giá')})
            </Typography.Text>
          </div>
        )}

        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {t('publicSellerActivity', 'Public seller activity and catalogue are available on the seller profile page.')}
        </Typography.Text>

        <div style={{ marginTop: 4 }}>
          <Link to={`/sellers/${sellerId}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-accent)' }}>
            {t('viewSellerProfile', 'View seller profile')} &rarr;
          </Link>
        </div>
      </div>
    </>
  )
}

// Reusable spec row for key/value pairs
function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontWeight: 500,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 13, lineHeight: 1.6 }}>
        {children}
      </span>
    </>
  )
}

export function AuctionDetailTabs({
  item,
  auction,
  recentBids = [],
  currency = 'VND',
  bidCount = 0,
  isSeller = false,
  sellerUsername,
  categoryName,
  qaConnected = false,
  qaLastSyncedAt = null,
  currentUserId,
}: AuctionDetailTabsProps) {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const sellerId = item.sellerId ?? auction?.sellerId

  // Responsive grid for spec table
  const specGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '120px 1fr' : '160px 1fr',
    gap: '10px 12px',
    fontSize: 14,
  }

  const tabItems = [
    {
      key: 'condition',
          label: t('specifications', 'Thông số'),
          children: (
            <div style={{ paddingTop: 4 }}>
              <Flex gap={8} align="center" style={{ marginBottom: 14 }} wrap="wrap">
                {item.condition ? <StatusBadge status={item.condition} /> : null}
              </Flex>
              <div style={specGridStyle}>
                <SpecRow label={t('condition', 'Tình trạng')}>
                  {item.condition ? tc(`statusLabel.${item.condition}`, item.condition) : '—'}
                </SpecRow>
                {item.categoryId && (
                  <SpecRow label={t('category', 'Danh mục')}>
                    {categoryName ?? item.categoryId}
                  </SpecRow>
                )}
                <SpecRow label={t('quantity', 'Số lượng')}>{item.quantity ?? 1}</SpecRow>
                <SpecRow label={t('itemStatus', 'Trạng thái')}>
                  {item.status ? <StatusBadge status={item.status} size="small" /> : '—'}
                </SpecRow>
                <SpecRow label={t('createdAt', 'Ngày tạo')}>
                  {item.createdAt ? formatDate(item.createdAt) : '—'}
                </SpecRow>
              </div>
            </div>
          ),
        },
        {
          key: 'description',
          label: t('productDescription', 'Mô tả'),
          children: (
            <div style={{ paddingTop: 4 }}>
              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('productOverview', 'Tổng quan sản phẩm')}
                </h3>
                {item.description ? (
                  <SafeHtmlRenderer html={item.description} />
                ) : (
                  <Typography.Text type="secondary">
                    {t('noDescription', 'Không có mô tả.')}
                  </Typography.Text>
                )}
              </div>

              <div>
                <h3
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('conditionDetails', 'Chi tiết tình trạng')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.condition && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 8 }}>
                      <CheckCircleOutlined
                        style={{
                          color: 'var(--color-success)',
                          flexShrink: 0,
                          fontSize: 14,
                          marginTop: 3,
                        }}
                      />
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {t('conditionLabel', 'Tình trạng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>
                          {item.condition ? tc(`statusLabel.${item.condition}`, item.condition) : ''}
                        </strong>
                      </span>
                    </div>
                  )}
                  {item.quantity && item.quantity > 1 && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 8 }}>
                      <CheckCircleOutlined
                        style={{
                          color: 'var(--color-success)',
                          flexShrink: 0,
                          fontSize: 14,
                          marginTop: 3,
                        }}
                      />
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {t('quantity', 'Số lượng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>
                          {item.quantity}
                        </strong>
                      </span>
                    </div>
                  )}
                  {item.createdAt && (
                    <div style={{ alignItems: 'flex-start', display: 'flex', gap: 8 }}>
                      <CheckCircleOutlined
                        style={{
                          color: 'var(--color-success)',
                          flexShrink: 0,
                          fontSize: 14,
                          marginTop: 3,
                        }}
                      />
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {t('listedDate', 'Ngày đăng')}:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>
                          {formatDate(item.createdAt)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        },
        auction ? {
          key: 'bidHistory',
          label: (
            <span>
              {t('bidHistory', 'Lịch sử giá')}
              {bidCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-accent-light)',
                    borderRadius: 10,
                    color: 'var(--color-accent)',
                    fontSize: 11,
                    fontWeight: 600,
                    marginLeft: 6,
                    padding: '1px 6px',
                  }}
                >
                  {bidCount}
                </span>
              )}
            </span>
          ),
          children:
            recentBids.length === 0 ? (
              <Typography.Text type="secondary">{t('noBids', 'Chưa có lượt đặt giá')}</Typography.Text>
            ) : (
              <div style={{ paddingTop: 4 }}>
                {recentBids.map((bid, index) => (
                  <div
                    key={bid.id ?? `${bid.bidderId}-${index}`}
                    style={
                      currentUserId && bid.bidderId === currentUserId
                        ? {
                            padding: '12px',
                            margin: '6px -12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            borderRadius: 8,
                            backgroundColor: 'var(--color-accent-light, rgba(255, 255, 255, 0.1))',
                            border: '1px solid var(--color-accent)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          }
                        : {
                            borderBottom:
                              index < recentBids.length - 1
                                ? '1px solid var(--color-border-light)'
                                : undefined,
                            padding: '10px 12px',
                            margin: '0 -12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            borderRadius: 6,
                          }
                    }
                  >
                    {/* Left: amount + badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center', minWidth: 0 }}>
                      <span className="oio-price" style={{ fontSize: 14, fontWeight: 600 }}>
                        {formatCurrency(
                          typeof bid.amount === 'number'
                            ? bid.amount
                            : bid.amount?.amount ?? 0,
                          typeof bid.amount === 'number'
                            ? currency
                            : bid.amount?.currency ?? currency,
                        )}
                      </span>
                      {bid.isAutoBid && <StatusBadge status="auto" size="small" />}
                      {bid.status && <StatusBadge status={bid.status} size="small" />}
                      {(bid.bidderDisplayName || bid.bidderId) && (
                        <Typography.Text type="secondary" style={{
                          fontSize: 12,
                          ...(currentUserId && bid.bidderId === currentUserId ? { fontWeight: 600, color: 'var(--color-accent)' } : {})
                        }}>
                          {currentUserId && bid.bidderId === currentUserId
                            ? t('you', 'You')
                            : (bid.bidderDisplayName ?? bid.bidderId?.slice(0, 8))}
                        </Typography.Text>
                      )}
                    </div>
                    {/* Right: time */}
                    <Typography.Text
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 12,
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      {bid.createdAt ? formatDateTime(bid.createdAt) : '—'}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            ),
        } : null,
        {
          key: 'seller',
          label: t('sellerTab', 'Người bán'),
          children: (
            <div style={{ paddingTop: 4 }}>
              <div
                style={{
                  alignItems: 'flex-start',
                  display: 'flex',
                  gap: 14,
                }}
              >
                <SellerIdentity sellerId={sellerId} sellerUsername={sellerUsername} />
              </div>
            </div>
          ),
        },
        auction ? {
          key: 'certification',
          label: t('certificationTab', 'Chứng nhận'),
          children: (
            <div style={{ paddingTop: 4 }}>
              <div
                style={{
                  background: auction.verifyByPlatform
                    ? 'rgba(74, 124, 89, 0.06)'
                    : 'rgba(139, 115, 85, 0.06)',
                  border: `1px solid ${
                    auction.verifyByPlatform
                      ? 'rgba(74, 124, 89, 0.2)'
                      : 'var(--color-border)'
                  }`,
                  borderRadius: 8,
                  marginBottom: 20,
                  padding: isMobile ? '14px 16px' : '18px 20px',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <SafetyOutlined
                    style={{
                      color: auction.verifyByPlatform
                        ? 'var(--color-success)'
                        : 'var(--color-text-secondary)',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <span
                      style={{
                        color: 'var(--color-text-primary)',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {t('inspectionStatus', 'Trạng thái kiểm định')}:{' '}
                      {auction.verifyByPlatform ? (
                        <span style={{ color: 'var(--color-success)' }}>
                          {t('approved', 'Đã phê duyệt')} <CheckCircleOutlined />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {t('pending', 'Chưa có kiểm định')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 13,
                    lineHeight: 1.7,
                    paddingLeft: isMobile ? 0 : 28,
                  }}
                >
                  <div>
                    {auction.verifyByPlatform
                      ? t(
                          'verifiedByPlatformNote',
                          'OIO đã xác minh listing này trước khi mở đấu giá.',
                        )
                      : t(
                          'noCertificateAvailable',
                          'Listing này không có chứng chỉ hoặc biên bản kiểm định công khai.',
                        )}
                  </div>
                  {/* Review-owner row hidden: DTO exposes only the admin's UUID, not a display name.
                      Showing the raw UUID to public viewers is not useful. Restore once BE adds
                      an `assignedAdminDisplayName` field to AuctionDto. */}

                </div>
              </div>

              <h3
                style={{
                  color: 'var(--color-text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                }}
              >
                {t('itemInfo', 'Thông tin sản phẩm')}
              </h3>
              <div style={specGridStyle}>
                {item.categoryId && (
                  <SpecRow label={t('category', 'Danh mục')}>
                    {categoryName ?? item.categoryId}
                  </SpecRow>
                )}
                <SpecRow label={t('quantity', 'Số lượng')}>{item.quantity ?? 1}</SpecRow>
                <SpecRow label={t('itemStatus', 'Trạng thái')}>
                  {item.status ? <StatusBadge status={item.status} size="small" /> : '—'}
                </SpecRow>
                <SpecRow label={t('createdAt', 'Ngày tạo')}>
                  {item.createdAt ? formatDate(item.createdAt) : '—'}
                </SpecRow>
              </div>
            </div>
          ),
        } : null,
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
      ].filter((x) => x !== null) as NonNullable<any>

  return (
    <Tabs
      defaultActiveKey="condition"
      size={isMobile ? 'small' : 'middle'}
      style={{ width: '100%' }}
      items={tabItems}
    />
  )
}