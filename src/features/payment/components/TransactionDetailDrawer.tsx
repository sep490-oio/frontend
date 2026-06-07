import { Drawer, Typography, Flex, Divider, Tag, Descriptions } from 'antd'
import { useTranslation } from 'react-i18next'
import type { WalletTransactionDto } from '@/types'
import { WalletTransactionType } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'
import type { WalletLedgerStatus, WalletEventType } from '@/types'
import { ReferenceTitle } from './ReferenceTitle'
import { formatLedgerDescription } from '../utils/formatLedgerDescription'

const { Text, Title } = Typography

interface TransactionDetailDrawerProps {
  open: boolean
  onClose: () => void
  transaction: WalletTransactionDto | null
}

const LEDGER_STATUS_CONFIG: Record<WalletLedgerStatus, { color: string; key: string; fallback: string }> = {
  posted: { color: 'success', key: 'ledgerStatus.posted', fallback: 'Posted' },
  pending: { color: 'warning', key: 'ledgerStatus.pending', fallback: 'Pending' },
  failed: { color: 'error', key: 'ledgerStatus.failed', fallback: 'Failed' },
  reversed: { color: 'processing', key: 'ledgerStatus.reversed', fallback: 'Reversed' },
}

const EVENT_TYPE_CONFIG: Record<WalletEventType, { fallback: string }> = {
  wallet_top_up: { fallback: 'Wallet Top-up' },
  auction_deposit_hold: { fallback: 'Auction Deposit' },
  auction_deposit_refund: { fallback: 'Deposit Refund' },
  order_payment: { fallback: 'Order Payment' },
  order_refund: { fallback: 'Order Refund' },
  withdrawal_hold: { fallback: 'Withdrawal Hold' },
  withdrawal_release: { fallback: 'Withdrawal' },
  seller_payout: { fallback: 'Seller Payout' },
  fee: { fallback: 'Transaction Fee' },
}

export function TransactionDetailDrawer({ open, onClose, transaction }: TransactionDetailDrawerProps) {
  const { t } = useTranslation('payment')

  if (!transaction) return null

  const isDeduction = transaction.type === WalletTransactionType.Debit || transaction.type === WalletTransactionType.Hold
  const color = isDeduction ? 'var(--color-danger)' : 'var(--color-success)'
  const sign = isDeduction ? '-' : '+'

  const ledger: WalletLedgerStatus = transaction.ledgerStatus ?? (() => {
    const s = (transaction.status as string | undefined)?.toLowerCase()
    if (s === 'completed' || s === 'success' || s === 'released') return 'posted'
    if (s === 'pending' || s === 'processing' || s === 'initiated') return 'pending'
    if (s === 'failed' || s === 'cancelled' || s === 'error' || s === 'rejected' || s === 'expired') return 'failed'
    if (s === 'refunded' || s === 'reversed') return 'reversed'
    return 'posted'
  })()
  const ledgerCfg = LEDGER_STATUS_CONFIG[ledger]

  let typeLabel = t(`txTypeLabel.${transaction.type}`, transaction.type)
  if (transaction.type === WalletTransactionType.Release) {
    if (transaction.referenceType === 'deposit') typeLabel = t('refType.depositRefund', 'Hoàn tiền cọc')
    else if (transaction.referenceType === 'order') typeLabel = t('refType.orderRefund', 'Hoàn tiền đơn hàng')
  }

  let eventLabel = transaction.description ?? '-'
  if (transaction.eventType) {
    eventLabel = t(`event.${transaction.eventType}`, EVENT_TYPE_CONFIG[transaction.eventType]?.fallback ?? eventLabel)
  }

  return (
    <Drawer
      title={<span className="oio-serif" style={{ fontSize: 20 }}>{t('transactionDetails', 'Transaction Details')}</span>}
      placement="right"
      width={480}
      onClose={onClose}
      open={open}
      styles={{
        header: { borderBottom: 'none', padding: '24px 24px 12px' },
        body: { padding: '0 24px 24px' }
      }}
    >
      <Flex vertical align="center" style={{ marginBottom: 32, marginTop: 12 }}>
        <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>
          {typeLabel}
        </Text>
        <Title level={2} style={{ margin: 0, fontFamily: MONO_FONT, color }}>
          {sign}{formatCurrency(transaction.amount, transaction.currency)}
        </Title>
        <Tag color={ledgerCfg.color} bordered={false} style={{ marginTop: 12, borderRadius: 100, padding: '4px 12px', fontSize: 13, fontWeight: 500 }}>
          {t(ledgerCfg.key, ledgerCfg.fallback)}
        </Tag>
      </Flex>

      <div style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--color-border-light)'
      }}>
        <Descriptions column={1} labelStyle={{ color: 'var(--color-text-secondary)', width: 140 }} contentStyle={{ fontWeight: 500, justifyContent: 'flex-end', textAlign: 'right' }}>
          <Descriptions.Item label={t('txId', 'Transaction ID')}>
            <Text copyable={{ text: transaction.id }} style={{ fontFamily: MONO_FONT }}>
              {transaction.id.split('-')[0].toUpperCase()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('date', 'Date & Time')}>
            {formatDateTime(transaction.createdAt)}
          </Descriptions.Item>
          
          <Descriptions.Item label={t('eventLabel', 'Event')}>
            {eventLabel}
          </Descriptions.Item>

          {formatLedgerDescription(transaction.description) && formatLedgerDescription(transaction.description) !== eventLabel && (
            <Descriptions.Item label={t('note', 'Note')}>
              {formatLedgerDescription(transaction.description)}
            </Descriptions.Item>
          )}

          {transaction.referenceId && (
            <Descriptions.Item label={t('reference', 'Reference')}>
              <ReferenceTitle referenceId={transaction.referenceId} referenceType={transaction.referenceType} />
            </Descriptions.Item>
          )}
          
        </Descriptions>
        
        <Divider style={{ margin: '16px 0' }} dashed />
        
        <Descriptions column={1} labelStyle={{ color: 'var(--color-text-secondary)', width: 140 }} contentStyle={{ fontWeight: 500, justifyContent: 'flex-end', textAlign: 'right' }}>
          <Descriptions.Item label={t('amount', 'Amount')}>
            <span style={{ fontFamily: MONO_FONT }}>{formatCurrency(transaction.amount, transaction.currency)}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t('balanceAfter', 'Balance After')}>
            <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>{formatCurrency(transaction.balanceAfter, transaction.currency)}</span>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  )
}
