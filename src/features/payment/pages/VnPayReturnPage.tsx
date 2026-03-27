import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Button, Spin, Descriptions } from 'antd'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { formatCurrency, formatDateTime } from '@/utils/format'
import apiClient from '@/lib/axios'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const MONO_FONT = "'DM Mono', monospace"

interface VnPayCallbackResponse {
  transactionRef: string
  isSuccess: boolean
  responseCode: string
  message: string
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
  const depositAuctionId = localStorage.getItem('oio_deposit_auction_id')

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

  // Clean up localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('oio_deposit_auction_id')
    }
  }, [])

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
        // Try to extract error detail
        const detail = err?.response?.data?.detail || err?.response?.data?.message || t('payment:vnpayReturn.verificationFailed', 'Payment verification failed')
        setError(detail)
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
          minHeight: '100vh',
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

  return (
    <div
      className="oio-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 4,
          padding: isMobile ? '32px 16px' : '48px 40px',
          textAlign: 'center',
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
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: isMobile ? 22 : 28,
            color: 'var(--color-text-primary)',
            margin: '0 0 8px',
          }}
        >
          {isSuccess
            ? (txnRef.startsWith('LINK-') ? t('payment:vnpayReturn.cardLinkedSuccess', 'Card linked successfully!') : t('payment:vnpayReturn.paymentSuccess', 'Payment successful!'))
            : (txnRef.startsWith('LINK-') ? t('payment:vnpayReturn.cardLinkedFailed', 'Card linking failed') : t('payment:vnpayReturn.paymentFailed', 'Payment failed'))}
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 32px' }}>
          {isSuccess
            ? (txnRef.startsWith('LINK-') ? t('payment:vnpayReturn.cardLinkedDesc', 'Your card has been linked successfully.') : t('payment:vnpayReturn.paymentSuccessDesc', 'Your transaction has been processed successfully.'))
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
        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          <Descriptions
            column={1}
            size="small"
            labelStyle={{ color: 'var(--color-text-secondary)', fontSize: 13, width: isMobile ? 100 : 140 }}
            contentStyle={{ fontFamily: MONO_FONT, fontSize: 13 }}
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
                <span style={{ fontFamily: "'Inter', sans-serif" }}>{formattedPayDate}</span>
              </Descriptions.Item>
            )}
            {orderInfo && (
              <Descriptions.Item label={t('payment:vnpayReturn.content', 'Content')}>
                <span style={{ fontFamily: "'Inter', sans-serif" }}>{orderInfo}</span>
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
          {isSuccess && depositAuctionId && (
            <Button
              type="primary"
              size="large"
              onClick={() => {
                localStorage.removeItem('oio_deposit_auction_id')
                navigate(`/auctions/${depositAuctionId}?deposited=true`)
              }}
              style={{
                height: 48,
                padding: '0 32px',
                fontWeight: 500,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {t('payment:vnpayReturn.backToAuction', 'Back to Auction')}
            </Button>
          )}
          {isSuccess && !depositAuctionId && txnRef.startsWith('LINK-') && (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/me/payment-methods')}
              style={{
                height: 48,
                padding: '0 32px',
                fontWeight: 500,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {t('payment:vnpayReturn.viewPaymentMethods', 'View Payment Methods')}
            </Button>
          )}
          {isSuccess && !depositAuctionId && !txnRef.startsWith('LINK-') && (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/me/orders')}
              style={{
                height: 48,
                padding: '0 32px',
                fontWeight: 500,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {t('payment:vnpayReturn.viewOrders', 'View Orders')}
            </Button>
          )}
          {!isSuccess && (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(-1)}
              style={{
                height: 48,
                padding: '0 32px',
                fontWeight: 500,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
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
            style={{ height: 48, padding: '0 32px', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {t('payment:vnpayReturn.backToHome', 'Back to Home')}
          </Button>
        </div>
      </div>
    </div>
  )
}
