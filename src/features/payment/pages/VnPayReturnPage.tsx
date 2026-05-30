import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Button, Spin, Descriptions } from 'antd'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { formatCurrency, formatDateTime } from '@/utils/format'
import apiClient from '@/lib/axios'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

interface VnPayCallbackResponse {
  transactionRef: string
  isSuccess: boolean
  responseCode: string
  message: string
  clientReturnPath?: string
  purpose?: string
}

export default function VnPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()
  const calledRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VnPayCallbackResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if this was a deposit payment (auction ID stored before redirect)
  // Capture in ref on first mount — StrictMode double-mount cleanup can delete the key early
  const depositAuctionIdRef = useRef(localStorage.getItem('oio_deposit_auction_id'))
  const depositAuctionId = depositAuctionIdRef.current

  // Parse VnPay params for display
  const transactionNo = searchParams.get('vnp_TransactionNo') ?? ''
  const amount = (Number(searchParams.get('vnp_Amount')) || 0) / 100
  const orderInfo = searchParams.get('vnp_OrderInfo') ?? ''
  const txnRef = searchParams.get('vnp_TxnRef') ?? ''
  const bankCode = searchParams.get('vnp_BankCode') ?? ''
  const payDate = searchParams.get('vnp_PayDate') ?? ''

  // Format VnPay date (yyyyMMddHHmmss → readable)
  const formattedPayDate = payDate
    ? formatDateTime(
        `${payDate.slice(0, 4)}-${payDate.slice(4, 6)}-${payDate.slice(6, 8)}T${payDate.slice(8, 10)}:${payDate.slice(10, 12)}:${payDate.slice(12, 14)}`,
      )
    : ''

  // Clean up localStorage after verification completes (not on unmount — StrictMode safe)
  useEffect(() => {
    if (!loading) {
      localStorage.removeItem('oio_deposit_auction_id')
    }
  }, [loading])

  // Call BE to confirm the payment
  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const queryString = window.location.search
    apiClient
      .get<VnPayCallbackResponse>(`/payments/vnpay/return${queryString}`)
      .then((res) => {
        setResult(res.data)
      })
      .catch((err) => {
        setError(normalizeErrorMessage(err, t('payment:vnpayReturn.verificationFailed', 'Payment verification failed')))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Loading
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
          background: 'var(--color-bg-primary)',
          gap: 16,
        }}
      >
        <Spin size="large" />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {t('payment:vnpayReturn.verifying', 'Verifying payment...')}
        </p>
      </div>
    )
  }

  const isSuccess = result?.isSuccess ?? false
  const purpose = result?.purpose
  const isTopUp = purpose === 'wallet_top_up'
  const isAuctionDeposit = purpose === 'auction_deposit' || purpose === 'auction_buy_now'
  const isOrderPayment = purpose === 'order_payment'
  const isLinkCard = purpose === 'link_card' || txnRef.startsWith('LINK-')

  // Derive auction id from clientReturnPath when present (e.g. /auctions/<id>?deposited=true)
  const auctionIdFromPath = (() => {
    const p = result?.clientReturnPath ?? ''
    const m = p.match(/\/auctions\/([^/?#]+)/)
    return m?.[1] ?? depositAuctionId ?? null
  })()

  return (
    <div
      className="oio-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--color-bg-primary)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 32,
          padding: isMobile ? '40px 24px' : '56px 48px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: isSuccess ? 'rgba(74,124,89,0.1)' : 'rgba(196,81,61,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          {isSuccess ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 700,
            fontSize: isMobile ? 24 : 30,
            color: 'var(--color-text-primary)',
            margin: '0 0 12px',
            letterSpacing: '-0.02em'
          }}
        >
          {isSuccess
            ? (isLinkCard
                ? t('payment:vnpayReturn.cardLinkedSuccess', 'Card linked successfully!')
                : isTopUp
                  ? t('payment:vnpayReturn.topUpSuccess', 'Top-up successful')
                  : t('payment:vnpayReturn.paymentSuccess', 'Payment successful!'))
            : (isLinkCard
                ? t('payment:vnpayReturn.cardLinkedFailed', 'Card linking failed')
                : isTopUp
                  ? t('payment:vnpayReturn.topUpFailed', 'Top-up failed')
                  : t('payment:vnpayReturn.paymentFailed', 'Payment failed'))}
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 32px' }}>
          {isSuccess
            ? (isLinkCard
                ? t('payment:vnpayReturn.cardLinkedDesc', 'Your card has been linked successfully.')
                : isTopUp
                  ? t('payment:vnpayReturn.topUpSuccessDesc', 'Funds have been added to your wallet.')
                  : t('payment:vnpayReturn.paymentSuccessDesc', 'Your transaction has been processed successfully.'))
            : error || result?.message || t('payment:vnpayReturn.paymentFailedDesc', 'Transaction could not be completed. Please try again.')}
        </p>

        {/* Amount */}
        {amount > 0 && (
          <div style={{ marginBottom: 32 }}>
            <span
              style={{
                fontFamily: MONO_FONT,
                fontSize: isMobile ? 28 : 36,
                fontWeight: 500,
                color: isSuccess ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {formatCurrency(amount)}
            </span>
          </div>
        )}

        {/* Transaction details */}
        <div style={{ textAlign: 'left', marginBottom: 40, padding: 24, background: 'var(--color-bg-surface)', borderRadius: 20, border: '1px solid var(--color-border)' }}>
          <Descriptions
            column={1}
            size="small"
            labelStyle={{ color: 'var(--color-text-tertiary)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', width: isMobile ? 110 : 150 }}
            contentStyle={{ fontFamily: MONO_FONT, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}
          >
            {txnRef && (
              <Descriptions.Item label={t('payment:vnpayReturn.transactionRef', 'Transaction Ref')}>
                {txnRef}
              </Descriptions.Item>
            )}
            {transactionNo && (
              <Descriptions.Item label={t('payment:vnpayReturn.vnpayCode', 'VnPay Code')}>
                {transactionNo}
              </Descriptions.Item>
            )}
            {result?.transactionRef && (
              <Descriptions.Item label={t('payment:vnpayReturn.reference', 'Reference')}>
                {result.transactionRef}
              </Descriptions.Item>
            )}
            {bankCode && (
              <Descriptions.Item label={t('payment:vnpayReturn.bank', 'Bank')}>
                {bankCode}
              </Descriptions.Item>
            )}
            {formattedPayDate && (
              <Descriptions.Item label={t('payment:vnpayReturn.time', 'Time')}>
                <span style={{ fontFamily: SANS_FONT }}>{formattedPayDate}</span>
              </Descriptions.Item>
            )}
            {orderInfo && (
              <Descriptions.Item label={t('payment:vnpayReturn.content', 'Content')}>
                <span style={{ fontFamily: SANS_FONT }}>{orderInfo}</span>
              </Descriptions.Item>
            )}
            {!isSuccess && result?.responseCode && (
              <Descriptions.Item label={t('payment:vnpayReturn.errorCode', 'Error Code')}>
                <span style={{ color: 'var(--color-danger)' }}>{result.responseCode}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {isSuccess && (() => {
            const primaryBtnStyle = {
              height: 52,
              padding: '0 40px',
              fontWeight: 700,
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              borderRadius: 14,
            }
            const go = (path: string) => {
              localStorage.removeItem('oio_deposit_auction_id')
              navigate(path)
            }

            if (isTopUp) {
              return (
                <Button type="primary" size="large" onClick={() => go('/me/wallet')} style={primaryBtnStyle}>
                  {t('payment:vnpayReturn.viewWallet', 'View Wallet')}
                </Button>
              )
            }
            if (isAuctionDeposit) {
              const target = auctionIdFromPath
                ? `/auctions/${auctionIdFromPath}?deposited=true`
                : '/me/wallet'
              return (
                <Button type="primary" size="large" onClick={() => go(target)} style={primaryBtnStyle}>
                  {t('payment:vnpayReturn.backToAuction', 'Back to Auction')}
                </Button>
              )
            }
            if (isLinkCard) {
              return (
                <Button type="primary" size="large" onClick={() => go('/me/payment-methods')} style={primaryBtnStyle}>
                  {t('payment:vnpayReturn.backToPaymentMethods', 'Back to payment methods')}
                </Button>
              )
            }
            if (isOrderPayment) {
              const target = result?.clientReturnPath ?? '/me/orders'
              return (
                <Button type="primary" size="large" onClick={() => go(target)} style={primaryBtnStyle}>
                  {result?.clientReturnPath
                    ? t('payment:vnpayReturn.backToOrder', 'Back to Order')
                    : t('payment:vnpayReturn.viewOrders', 'View Orders')}
                </Button>
              )
            }
            // Unknown purpose — fallback to clientReturnPath if any, else home-only (no View Orders for top-ups)
            if (result?.clientReturnPath) {
              return (
                <Button type="primary" size="large" onClick={() => go(result.clientReturnPath!)} style={primaryBtnStyle}>
                  {t('payment:vnpayReturn.continue', 'Continue')}
                </Button>
              )
            }
            return null
          })()}
          {!isSuccess && (
            <Button
              type="primary"
              size="large"
              onClick={() => { navigate(-1); }}
              style={{
                height: 52,
                padding: '0 40px',
                fontWeight: 700,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                borderRadius: 14,
              }}
            >
              {t('payment:vnpayReturn.retry', 'Try Again')}
            </Button>
          )}
          <Button
            size="large"
            onClick={() => {
              localStorage.removeItem('oio_deposit_auction_id')
              navigate('/')
            }}
            style={{ height: 52, padding: '0 40px', borderRadius: 14, fontWeight: 600, borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {t('payment:vnpayReturn.backToHome', 'Back to Home')}
          </Button>
        </div>
      </div>
    </div>
  )
}
