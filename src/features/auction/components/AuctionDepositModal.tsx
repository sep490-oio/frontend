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

// ── Provider shape — extend here to add MoMo etc. ──────────────────────────
type DepositProvider = { kind: 'vnpay'; savedCards: PaymentMethodDto[] }

type PaymentSource = 'wallet' | 'vnpay'

const NEW_CARD_VALUE = '__vnpay_new__'

interface Props {
  open: boolean
  onClose: () => void
  auctionId: string
  requiredDepositAmount: number
  currency: string
}

export function AuctionDepositModal({
  open,
  onClose,
  auctionId,
  requiredDepositAmount,
  currency,
}: Props) {
  const { t } = useTranslation('auction')
  const { t: tp } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

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

  const canSubmit =
    source === 'wallet'
      ? !insufficientWallet
      : !!selectedCardId

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
        message.success(t('depositSuccess', 'Deposit successful — you are now qualified to bid!'))
        queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all })
        handleClose()
      } catch (err) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        message.error(detail ?? t('depositError', 'Deposit failed'))
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
        description: t('depositOrderInfo', 'Auction deposit'),
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
      message.error(t('depositError', 'Deposit failed'))
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
                  borderBottom: '1px solid var(--color-border-light)',
                }}
              >
                <Flex align="center" gap={12}>
                  <CreditCardOutlined style={{ fontSize: 18, color: 'var(--color-accent)' }} />
                  <div>
                    <span style={{ fontWeight: 500, fontFamily: MONO_FONT }}>
                      {card.maskedCardNumber ?? `•••• ${card.lastFour ?? ''}`}
                    </span>
                    {card.bankCode && (
                      <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, fontSize: 13 }}>
                        {card.bankCode}
                      </span>
                    )}
                  </div>
                  {card.isDefault && <StatusBadge status="default" size="small" />}
                </Flex>
              </Radio>
            ))}
            <Radio value={NEW_CARD_VALUE} style={{ width: '100%', padding: '12px 0' }}>
              <Flex align="center" gap={12}>
                <CreditCardOutlined />
                <span style={{ fontWeight: 500 }}>
                  {tp('newVnPayCard', 'Pay with new VNPay card')}
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
        <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>
          {t('depositToJoin', 'Deposit to Participate')}
        </span>
      }
      width={640}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={20}>
        {/* Amount (read-only) */}
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
            {t('depositAmountLabel', 'Required')}
          </Typography.Text>
          <Typography.Text
            style={{ fontFamily: MONO_FONT, fontSize: 22, color: 'var(--color-accent)' }}
          >
            {formatCurrency(requiredDepositAmount, currency)}
          </Typography.Text>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Payment Source */}
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>
            {tp('paymentSource', 'Payment Source')}
          </Typography.Text>
          <Radio.Group
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Radio value="wallet" disabled={insufficientWallet}>
                <Flex align="center" gap={8}>
                  <WalletOutlined style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontWeight: 500 }}>
                    {tp('walletPayment', 'Wallet balance')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    ({formatCurrency(walletBalance, currency)})
                  </span>
                </Flex>
              </Radio>
              {insufficientWallet && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginLeft: 24 }}
                  message={t('insufficientWallet', 'Insufficient balance — top up first')}
                />
              )}
              <Radio value="vnpay">
                <Flex align="center" gap={8}>
                  <CreditCardOutlined style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontWeight: 500 }}>VNPay</span>
                </Flex>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {source === 'vnpay' && (
          <>
            <Divider style={{ margin: 0 }} />
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>
                {tp('paymentSource', 'Payment Source')}
              </Typography.Text>
              {renderCardSource()}
              {isNewCard && (
                <div style={{ marginTop: 12, paddingLeft: 4 }}>
                  <Checkbox
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  >
                    {tp('saveCardForTopUp', 'Save this card for future payments')}
                  </Checkbox>
                  {saveCard && (
                    <Select
                      value={cardType}
                      onChange={setCardType}
                      style={{ width: '100%', marginTop: 8 }}
                      options={[
                        { value: '01', label: tp('domesticCard', 'ATM / Domestic Card') },
                        { value: '02', label: tp('internationalCard', 'International Card (Visa/Master)') },
                      ]}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <Divider style={{ margin: 0 }} />

        <Flex gap={12} justify="flex-end">
          <Button onClick={handleClose}>{tc('action.cancel', 'Cancel')}</Button>
          <Button
            type="primary"
            disabled={!canSubmit}
            loading={walletDeposit.isPending || createVnPayUrl.isPending}
            onClick={handleSubmit}
            style={
              canSubmit
                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                : {}
            }
          >
            {t('deposit', 'Deposit')}
          </Button>
        </Flex>
      </Space>
    </Modal>
  )
}
