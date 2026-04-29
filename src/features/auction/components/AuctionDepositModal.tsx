import { useState } from 'react'
import {
  Modal,
  Radio,
  Checkbox,
  Select,
  Button,
  Space,
  Flex,
  Typography,
  Divider,
  Alert,
  App,
  Grid,
} from 'antd'
import { CreditCardOutlined, WalletOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  usePaymentMethods,
  useCreateVnPayUrl,
  useWallet,
  useDepositFromWallet,
} from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import type { PaymentMethodDto } from '@/types'
import { PaymentMethodType } from '@/types/enums'
import { MONO_FONT, SERIF_FONT } from '@/styles/tokens'
import { queryClient, queryKeys } from '@/lib/queryClient'

const { useBreakpoint } = Grid

// ── Provider shape — extend here to add MoMo etc. ──────────────────────────
type DepositProvider = { kind: 'vnpay'; savedCards: PaymentMethodDto[] }

type PaymentSource = 'wallet' | 'vnpay'

const NEW_CARD_VALUE = '__vnpay_new__'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  auctionId: string
  requiredDepositAmount: number
  currency: string
}

export function AuctionDepositModal({
  open,
  onClose,
  onSuccess,
  auctionId,
  requiredDepositAmount,
  currency,
}: Props) {
  const { t } = useTranslation('auction')
  const { t: tp } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const screens = useBreakpoint()
  const isMobile = !screens.sm

  const [source, setSource] = useState<PaymentSource>('wallet')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [saveCard, setSaveCard] = useState(false)
  const [cardType, setCardType] = useState('01')

  const { data: wallet } = useWallet()
  const { data: methods } = usePaymentMethods()
  const createVnPayUrl = useCreateVnPayUrl()
  const walletDeposit = useDepositFromWallet()

  const walletBalance = wallet?.availableBalance ?? 0
  const vnpaySavedCards = (methods ?? []).filter(
    (m: PaymentMethodDto) => m.type === PaymentMethodType.VnPay,
  )
  const provider: DepositProvider = { kind: 'vnpay', savedCards: vnpaySavedCards }
  const insufficientWallet = walletBalance < requiredDepositAmount
  const isNewCard = selectedCardId === NEW_CARD_VALUE

  const canSubmit = source === 'wallet' ? !insufficientWallet : !!selectedCardId

  const handleClose = () => {
    setSource('wallet')
    setSelectedCardId(null)
    setSaveCard(false)
    setCardType('01')
    onClose()
  }

  const handleSubmit = async () => {
    if (source === 'wallet') {
      try {
        await walletDeposit.mutateAsync({
          auctionId,
          amount: requiredDepositAmount,
          currency,
        })
        message.success(t('depositSuccess', 'Đặt cọc thành công — bạn đã đủ điều kiện đặt giá!'))
        queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all })
        onSuccess?.()
        handleClose()
      } catch (err) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail
        message.error(detail ?? t('depositError', 'Đặt cọc thất bại'))
      }
      return
    }

    // VNPay
    if (!selectedCardId) return
    try {
      const result = await createVnPayUrl.mutateAsync({
        amount: requiredDepositAmount,
        currency,
        purpose: 'auction_deposit',
        description: t('depositOrderInfo', 'Tiền cọc đấu giá'),
        auctionId,
        clientReturnPath: `/auctions/${auctionId}?deposited=true`,
        ...(isNewCard
          ? {
              saveCard: saveCard || undefined,
              cardType: saveCard ? cardType : undefined,
            }
          : { paymentMethodId: selectedCardId }),
      })
      localStorage.setItem('oio_deposit_auction_id', auctionId)
      window.location.href = result.paymentUrl
    } catch {
      message.error(t('depositError', 'Đặt cọc thất bại'))
    }
  }

  const renderCardSource = () => {
    if (provider.kind === 'vnpay') {
      return (
        <Radio.Group
          value={selectedCardId}
          onChange={(e) => setSelectedCardId(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            {provider.savedCards.map((card) => (
              <Radio
                key={card.id}
                value={card.id}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderBottom: '0px solid var(--color-border-light)',
                }}
              >
                <Flex align="center" gap={10} wrap="wrap">
                  <CreditCardOutlined style={{ fontSize: 16, color: 'var(--color-accent)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 500,
                        fontFamily: MONO_FONT,
                        fontSize: 13,
                        display: 'block',
                      }}
                    >
                      {card.maskedCardNumber ?? `•••• ${card.lastFour ?? ''}`}
                    </span>
                    {card.bankCode && (
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 12,
                          display: 'block',
                        }}
                      >
                        {card.bankCode}
                      </span>
                    )}
                  </div>
                  {card.isDefault && <StatusBadge status="default" size="small" />}
                </Flex>
              </Radio>
            ))}
            <Radio value={NEW_CARD_VALUE} style={{ width: '100%', padding: '12px 0' }}>
              <Flex align="center" gap={10}>
                <CreditCardOutlined style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 500, fontSize: 13 }}>
                  {tp('newVnPayCard', 'Thanh toán bằng thẻ VNPay mới')}
                </span>
              </Flex>
            </Radio>
          </Space>
        </Radio.Group>
      )
    }
    return null
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: isMobile ? 16 : 18 }}>
          {t('depositToJoin', 'Đặt Cọc Để Tham Gia')}
        </span>
      }
      width={isMobile ? '100%' : 560}
      style={isMobile ? { top: 0, margin: 0, maxWidth: '100vw', paddingBottom: 0 } : undefined}
      styles={isMobile ? { body: { maxHeight: '80vh', overflowY: 'auto' } } : undefined}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {/* Amount (read-only) */}
        <div>
          <Typography.Text
            strong
            style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}
          >
            {t('depositAmountLabel', 'Số tiền cọc yêu cầu')}
          </Typography.Text>
          <Typography.Text
            style={{
              fontFamily: MONO_FONT,
              fontSize: isMobile ? 20 : 24,
              color: 'var(--color-accent)',
              fontWeight: 600,
            }}
          >
            {formatCurrency(requiredDepositAmount, currency)}
          </Typography.Text>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        {/* Payment Source */}
        <div>
          <Typography.Text
            strong
            style={{ display: 'block', marginBottom: 10, fontSize: 13 }}
          >
            {tp('paymentSource', 'Phương thức thanh toán')}
          </Typography.Text>
          <Radio.Group
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Radio value="wallet" disabled={insufficientWallet}>
                <Flex align="center" gap={8} wrap="wrap">
                  <WalletOutlined style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, fontSize: 13 }}>
                    {tp('walletPayment', 'Số dư ví')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    ({formatCurrency(walletBalance, currency)})
                  </span>
                </Flex>
              </Radio>
              {insufficientWallet && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginLeft: 24 }}
                  message={t('insufficientWallet', 'Số dư không đủ — vui lòng nạp thêm')}
                />
              )}
              <Radio value="vnpay">
                <Flex align="center" gap={8}>
                  <CreditCardOutlined style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, fontSize: 13 }}>VNPay</span>
                </Flex>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {source === 'vnpay' && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div>
              <Typography.Text
                strong
                style={{ display: 'block', marginBottom: 10, fontSize: 13 }}
              >
                {tp('selectCard', 'Chọn thẻ')}
              </Typography.Text>
              {renderCardSource()}
              {isNewCard && (
                <div style={{ marginTop: 12, paddingLeft: 4 }}>
                  <Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}>
                    <span style={{ fontSize: 13 }}>
                      {tp('saveCardForTopUp', 'Lưu thẻ này cho lần sau')}
                    </span>
                  </Checkbox>
                  {saveCard && (
                    <Select
                      value={cardType}
                      onChange={setCardType}
                      style={{ width: '100%', marginTop: 8 }}
                      options={[
                        { value: '01', label: tp('domesticCard', 'ATM / Thẻ nội địa') },
                        {
                          value: '02',
                          label: tp('internationalCard', 'Thẻ quốc tế (Visa/Master)'),
                        },
                      ]}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <Flex gap={10} justify="flex-end">
          <Button onClick={handleClose} style={{ minHeight: 40 }}>
            {tc('action.cancel', 'Hủy')}
          </Button>
          <Button
            type="primary"
            disabled={!canSubmit}
            loading={walletDeposit.isPending || createVnPayUrl.isPending}
            onClick={handleSubmit}
            style={{
              minHeight: 40,
              minWidth: 100,
              ...(canSubmit
                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                : {}),
            }}
          >
            {t('deposit', 'Đặt cọc')}
          </Button>
        </Flex>
      </Space>
    </Modal>
  )
}
