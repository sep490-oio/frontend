import { useState } from 'react'
import {
  Modal,
  InputNumber,
  Radio,
  Checkbox,
  Select,
  Button,
  Space,
  Flex,
  Typography,
  Divider,
  App,
} from 'antd'
import { CreditCardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { usePaymentMethods, useCreateVnPayUrl } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import type { PaymentMethodDto } from '@/types'
import { PaymentMethodType } from '@/types/enums'
import { MONO_FONT, SERIF_FONT } from '@/styles/tokens'

// ── Provider shape — extend here to add MoMo etc. ──────────────────────────
type TopUpProvider = { kind: 'vnpay'; savedCards: PaymentMethodDto[] }

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000]

const NEW_CARD_VALUE = '__vnpay_new__'

interface Props {
  open: boolean
  onClose: () => void
  currency?: string
}

export function TopUpWalletModal({ open, onClose, currency = 'VND' }: Props) {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [amount, setAmount] = useState<number | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [saveCard, setSaveCard] = useState(false)
  const [cardType, setCardType] = useState('01')

  const { data: methods } = usePaymentMethods()
  const createVnPayUrl = useCreateVnPayUrl()

  const vnpaySavedCards = (methods ?? []).filter(
    (m: PaymentMethodDto) => m.type === PaymentMethodType.VnPay,
  )
  const provider: TopUpProvider = { kind: 'vnpay', savedCards: vnpaySavedCards }

  const isNewCard = selectedCardId === NEW_CARD_VALUE
  const canSubmit = !!amount && amount > 0 && !!selectedCardId

  const handleClose = () => {
    setAmount(null)
    setSelectedCardId(null)
    setSaveCard(false)
    setCardType('01')
    onClose()
  }

  const handleTopUp = async () => {
    if (!amount || !selectedCardId) return

    const req = {
      amount,
      currency,
      purpose: 'wallet_top_up',
      description: t('topUpOrderInfo', 'Wallet top-up'),
      clientReturnPath: '/me/wallet',
      ...(isNewCard
        ? {
            saveCard: saveCard || undefined,
            cardType: saveCard ? cardType : undefined,
          }
        : { paymentMethodId: selectedCardId }),
    }

    try {
      const result = await createVnPayUrl.mutateAsync(req)
      window.location.href = result.paymentUrl
    } catch {
      message.error(t('topupError', 'Top-up failed'))
    }
  }

  // ── Card list rendering — driven by provider.kind ────────────────────────
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
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          marginLeft: 8,
                          fontSize: 13,
                        }}
                      >
                        {card.bankCode}
                      </span>
                    )}
                    {card.holderName && (
                      <span
                        style={{
                          color: 'var(--color-text-secondary)',
                          marginLeft: 8,
                          fontSize: 13,
                        }}
                      >
                        {card.holderName}
                      </span>
                    )}
                  </div>
                  {card.isDefault && <StatusBadge status="default" size="small" />}
                </Flex>
              </Radio>
            ))}

            {/* New card option */}
            <Radio
              value={NEW_CARD_VALUE}
              style={{ width: '100%', padding: '12px 0' }}
            >
              <Flex align="center" gap={12}>
                <CreditCardOutlined />
                <span style={{ fontWeight: 500 }}>
                  {t('newVnPayCard', 'Pay with new VNPay card')}
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
          {t('topUpWallet', 'Top Up Your Wallet')}
        </span>
      }
      width={720}
      styles={{
        body: {
          maxHeight: isMobile ? '85vh' : '80vh',
          overflowY: 'auto',
          paddingTop: 8,
        },
      }}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        {/* ── Section 1: Amount ────────────────────────────────────────── */}
        <div>
          <Typography.Text
            strong
            style={{ display: 'block', marginBottom: 10, fontSize: 14 }}
          >
            {t('topupAmount', 'Amount')}
          </Typography.Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={10_000}
            max={100_000_000}
            step={50_000}
            value={amount}
            onChange={(v) => setAmount(v)}
            addonAfter={currency}
            placeholder={t('topupAmountPlaceholder', '100,000')}
            formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
            parser={(v) => Number((v ?? '').replace(/,/g, ''))}
          />
          {/* Quick-pick chips */}
          <Flex gap={8} wrap="wrap" style={{ marginTop: 10 }}>
            {QUICK_AMOUNTS.map((q) => (
              <Button
                key={q}
                size="small"
                type={amount === q ? 'primary' : 'default'}
                onClick={() => setAmount(q)}
                style={
                  amount === q
                    ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                    : { borderColor: 'var(--color-border)' }
                }
              >
                {formatCurrency(q, currency)}
              </Button>
            ))}
          </Flex>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* ── Section 2: Provider ──────────────────────────────────────── */}
        <div>
          <Typography.Text
            strong
            style={{ display: 'block', marginBottom: 10, fontSize: 14 }}
          >
            {t('paymentMethod', 'Payment Method')}
          </Typography.Text>
          {/* Single provider for now — add MoMo as a new arm later */}
          <Radio.Group value="vnpay" style={{ width: '100%' }}>
            <Radio value="vnpay">
              <span style={{ fontWeight: 500 }}>VNPay</span>
            </Radio>
          </Radio.Group>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* ── Section 3: Card / Payment Source ────────────────────────── */}
        <div>
          <Typography.Text
            strong
            style={{ display: 'block', marginBottom: 10, fontSize: 14 }}
          >
            {t('paymentSource', 'Payment Source')}
          </Typography.Text>

          {renderCardSource()}

          {/* Save card + card type — only when "new card" chosen */}
          {isNewCard && (
            <div style={{ marginTop: 12, paddingLeft: 4 }}>
              <Checkbox
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
              >
                {t('saveCardForTopUp', 'Save this card for future top-ups')}
              </Checkbox>
              {saveCard && (
                <Select
                  value={cardType}
                  onChange={setCardType}
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: '01', label: t('domesticCard', 'ATM / Domestic Card') },
                    {
                      value: '02',
                      label: t('internationalCard', 'International Card (Visa/Master)'),
                    },
                  ]}
                />
              )}
            </div>
          )}

          {/* Manage payment methods link */}
          <div style={{ marginTop: 12 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, fontSize: 13 }}
              onClick={() => {
                handleClose()
                navigate('/me/payment-methods')
              }}
            >
              {t('managePaymentMethods', 'Manage payment methods')} →
            </Button>
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* ── Section 4: Summary + CTA ─────────────────────────────────── */}
        <div>
          {amount && amount > 0 && selectedCardId && (
            <Typography.Paragraph
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {t(
                'topUpSummary',
                "You'll be redirected to VNPay to complete the top-up of {{amount}}.",
                { amount: formatCurrency(amount, currency) },
              )}
            </Typography.Paragraph>
          )}
          <Flex gap={12} justify="flex-end">
            <Button onClick={handleClose}>{tc('action.cancel', 'Cancel')}</Button>
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={createVnPayUrl.isPending}
              onClick={handleTopUp}
              style={
                canSubmit
                  ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                  : {}
              }
            >
              {t('topUp', 'Top Up')}
            </Button>
          </Flex>
        </div>
      </Space>
    </Modal>
  )
}
