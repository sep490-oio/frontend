import { useMemo } from 'react'
import { Select, InputNumber, Tag, Card, Typography, Space, Alert, Collapse } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ResolutionActionSet } from '@/features/dispute/api'

// ── Option definitions ──────────────────────────────────────────────

const ESCROW_OPTIONS = [
  { value: 'no_action', label: 'No Action' },
  { value: 'release_to_seller', label: 'Release to Seller' },
  { value: 'refund_buyer', label: 'Refund Buyer' },
  { value: 'partial_refund', label: 'Partial Refund' },
  { value: 'hold', label: 'Hold' },
]

const REFUND_OPTIONS = [
  { value: 'no_refund', label: 'No Refund' },
  { value: 'full_refund', label: 'Full Refund' },
  { value: 'partial_refund', label: 'Partial Refund' },
]

const SHIPMENT_OPTIONS = [
  { value: 'no_action', label: 'No Action' },
  { value: 'cancel_shipment', label: 'Cancel Shipment' },
  { value: 'mark_lost', label: 'Mark Lost' },
  { value: 'rebook_shipment', label: 'Rebook Shipment' },
  { value: 'open_return', label: 'Open Return' },
]

const ITEM_OPTIONS = [
  { value: 'no_action', label: 'No Action' },
  { value: 'return_to_active', label: 'Return to Active' },
  { value: 'hold_in_warehouse', label: 'Hold in Warehouse' },
  { value: 'return_to_seller', label: 'Return to Seller' },
  { value: 'reject_listing', label: 'Reject Listing' },
]

const AUCTION_OPTIONS = [
  { value: 'no_action', label: 'No Action' },
  { value: 'relist', label: 'Relist' },
  { value: 'cancel', label: 'Cancel' },
]

const PENALTY_OPTIONS = [
  { value: 'no_action', label: 'No Action' },
  { value: 'flag_buyer', label: 'Flag Buyer' },
  { value: 'flag_seller', label: 'Flag Seller' },
]

const MANUAL_FOLLOWUP_SHIPMENT = new Set(['rebook_shipment', 'open_return'])
const MANUAL_FOLLOWUP_ITEM = new Set(['return_to_seller', 'reject_listing'])

// ── Tooltips ────────────────────────────────────────────────────────

const OPTION_TOOLTIPS: Record<string, string> = {
  release_to_seller: 'Release escrow funds to the seller',
  refund_buyer: 'Refund the full escrow amount to the buyer',
  partial_refund: 'Refund a portion of the escrow amount',
  hold: 'Keep funds in escrow pending further action',
  full_refund: 'Buyer will receive a full refund',
  no_refund: 'No refund will be issued',
  cancel_shipment: 'Cancel the current shipment',
  mark_lost: 'Mark the shipment as lost',
  rebook_shipment: 'Rebook a new shipment for the item',
  open_return: 'Open a return shipment to the seller',
  return_to_active: 'Return item to active status for a new auction',
  hold_in_warehouse: 'Keep the item in warehouse storage',
  return_to_seller: 'Ship the item back to the seller',
  reject_listing: 'Reject this listing from the platform',
  relist: 'Return item to active status for a new auction',
  cancel: 'Cancel the auction permanently',
  flag_buyer: 'Flag the buyer account for review',
  flag_seller: 'Flag the seller account for review',
}

// ── Outcome presets ─────────────────────────────────────────────────

const OUTCOME_PRESETS: Record<string, Partial<ResolutionActionSet>> = {
  favor_buyer: { escrowAction: 'refund_buyer', refundAction: 'full_refund', penaltyAction: 'no_action' },
  favor_seller: { escrowAction: 'release_to_seller', refundAction: 'no_refund', penaltyAction: 'no_action' },
  favor_platform: { escrowAction: 'hold', refundAction: 'no_refund' },
  partial_split: { escrowAction: 'partial_refund', refundAction: 'partial_refund' },
  void_claim: { escrowAction: 'release_to_seller', refundAction: 'no_refund' },
  operational_rework: { escrowAction: 'hold', refundAction: 'no_refund' },
}

const DOMAIN_OVERRIDES: Record<string, Record<string, Partial<ResolutionActionSet>>> = {
  shipping: {
    favor_buyer: { shipmentAction: 'cancel_shipment' },
    void_claim: { shipmentAction: 'mark_lost' },
  },
  item_condition: {
    favor_seller: { itemAction: 'return_to_active' },
    favor_buyer: { itemAction: 'hold_in_warehouse' },
    favor_platform: { itemAction: 'hold_in_warehouse' },
    partial_split: { itemAction: 'hold_in_warehouse' },
    void_claim: { itemAction: 'hold_in_warehouse' },
    operational_rework: { itemAction: 'hold_in_warehouse' },
  },
  auction_settlement: {
    favor_buyer: { auctionAction: 'cancel' },
  },
}

export function getPresetForOutcome(outcome: string, domain?: string): Partial<ResolutionActionSet> {
  const base = OUTCOME_PRESETS[outcome] ?? {}
  const domainOverride = domain ? (DOMAIN_OVERRIDES[domain]?.[outcome] ?? {}) : {}
  return { ...base, ...domainOverride }
}

// ── Summary helpers ─────────────────────────────────────────────────

const ACTION_SUMMARIES: Record<string, Record<string, string>> = {
  escrowAction: {
    release_to_seller: 'Escrow will be released to the seller',
    refund_buyer: 'Escrow will be refunded to the buyer',
    partial_refund: 'Escrow will be partially refunded',
    hold: 'Escrow funds will be held',
  },
  refundAction: {
    full_refund: 'Buyer will receive a full refund',
    partial_refund: 'Buyer will receive a partial refund',
  },
  shipmentAction: {
    cancel_shipment: 'Shipment will be cancelled',
    mark_lost: 'Shipment will be marked as lost',
    rebook_shipment: 'A new shipment will be rebooked',
    open_return: 'A return shipment will be opened',
  },
  itemAction: {
    return_to_active: 'Item will be returned to active status',
    hold_in_warehouse: 'Item will be held in warehouse',
    return_to_seller: 'Item will be returned to the seller',
    reject_listing: 'Listing will be rejected',
  },
  auctionAction: {
    relist: 'Item will be relisted for auction',
    cancel: 'Auction will be cancelled',
  },
  penaltyAction: {
    flag_buyer: 'Buyer account will be flagged for review',
    flag_seller: 'Seller account will be flagged for review',
  },
}

// ── Validation ──────────────────────────────────────────────────────

export function validateActionSet(actionSet: ResolutionActionSet): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (
    (actionSet.escrowAction === 'partial_refund' || actionSet.refundAction === 'partial_refund') &&
    (!actionSet.refundAmount || actionSet.refundAmount <= 0)
  ) {
    errors.push('Refund amount must be greater than 0 when partial refund is selected.')
  }

  if (actionSet.escrowAction === 'release_to_seller' && actionSet.refundAction === 'full_refund') {
    errors.push('Cannot release to seller and refund buyer simultaneously.')
  }

  const allNoAction = !actionSet.escrowAction || actionSet.escrowAction === 'no_action'
  const allNoRefund = !actionSet.refundAction || actionSet.refundAction === 'no_refund'
  const shipNone = !actionSet.shipmentAction || actionSet.shipmentAction === 'no_action'
  const itemNone = !actionSet.itemAction || actionSet.itemAction === 'no_action'
  const auctNone = !actionSet.auctionAction || actionSet.auctionAction === 'no_action'
  const penNone = !actionSet.penaltyAction || actionSet.penaltyAction === 'no_action'

  if (allNoAction && allNoRefund && shipNone && itemNone && auctNone && penNone) {
    warnings.push('No resolution actions selected. Are you sure?')
  }

  return { errors, warnings }
}

// ── Component ───────────────────────────────────────────────────────

interface ResolutionActionBuilderProps {
  value: ResolutionActionSet
  onChange: (v: ResolutionActionSet) => void
  domain?: string
  outcome?: string
  errors?: string[]
}

function renderOptionLabel(opt: { value: string; label: string }, manualSet?: Set<string>) {
  const tooltip = OPTION_TOOLTIPS[opt.value]
  return (
    <span title={tooltip}>
      {opt.label}
      {manualSet?.has(opt.value) && (
        <Tag color="orange" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
          Manual follow-up required
        </Tag>
      )}
    </span>
  )
}

function buildOptions(opts: { value: string; label: string }[], manualSet?: Set<string>) {
  return opts.map((o) => ({ value: o.value, label: renderOptionLabel(o, manualSet) }))
}

export default function ResolutionActionBuilder({ value, onChange, domain: _domain, outcome, errors }: ResolutionActionBuilderProps) {
  const { t } = useTranslation('dispute')

  const update = (patch: Partial<ResolutionActionSet>) => {
    onChange({ ...value, ...patch })
  }

  const showRefundAmount =
    value.escrowAction === 'partial_refund' || value.refundAction === 'partial_refund'

  const needsManualFollowup =
    MANUAL_FOLLOWUP_SHIPMENT.has(value.shipmentAction ?? '') ||
    MANUAL_FOLLOWUP_ITEM.has(value.itemAction ?? '')

  // Summary lines
  const summaryLines = useMemo(() => {
    const lines: string[] = []
    for (const [field, map] of Object.entries(ACTION_SUMMARIES)) {
      const val = value[field as keyof ResolutionActionSet] as string | undefined
      if (val && map[val]) {
        let line = map[val]
        if ((field === 'escrowAction' || field === 'refundAction') && val === 'partial_refund' && value.refundAmount) {
          line += ` (${value.refundAmount})`
        }
        lines.push(line)
      }
    }
    return lines
  }, [value])

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {outcome && OUTCOME_PRESETS[outcome] && (
        <Alert
          type="info"
          showIcon
          message={t('presetApplied', 'Recommended actions pre-filled based on outcome. You can adjust before confirming.')}
          style={{ marginBottom: 4 }}
        />
      )}

      {errors?.map((err, i) => (
        <Alert key={i} type="error" showIcon message={err} style={{ marginBottom: 0 }} />
      ))}

      {/* Escrow */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('escrowAction', 'Escrow')}
        </Typography.Text>
        <Select
          value={value.escrowAction || undefined}
          onChange={(v) => update({ escrowAction: v })}
          options={buildOptions(ESCROW_OPTIONS)}
          style={{ width: '100%' }}
          placeholder={t('selectEscrowAction', 'Select escrow action')}
          allowClear
        />
      </div>

      {/* Refund */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('refundAction', 'Refund')}
        </Typography.Text>
        <Select
          value={value.refundAction || undefined}
          onChange={(v) => update({ refundAction: v })}
          options={buildOptions(REFUND_OPTIONS)}
          style={{ width: '100%' }}
          placeholder={t('selectRefundAction', 'Select refund action')}
          allowClear
        />
      </div>

      {/* Refund Amount */}
      {showRefundAmount && (
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
            {t('refundAmount', 'Refund Amount')}
          </Typography.Text>
          <InputNumber
            value={value.refundAmount}
            onChange={(v) => update({ refundAmount: v ?? undefined })}
            min={0}
            style={{ width: '100%' }}
            placeholder={t('enterRefundAmount', 'Enter refund amount')}
          />
        </div>
      )}

      {/* Shipment */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('shipmentAction', 'Shipment')}
        </Typography.Text>
        <Select
          value={value.shipmentAction || undefined}
          onChange={(v) => update({ shipmentAction: v })}
          options={buildOptions(SHIPMENT_OPTIONS, MANUAL_FOLLOWUP_SHIPMENT)}
          style={{ width: '100%' }}
          placeholder={t('selectShipmentAction', 'Select shipment action')}
          allowClear
        />
      </div>

      {/* Item */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('itemAction', 'Item')}
        </Typography.Text>
        <Select
          value={value.itemAction || undefined}
          onChange={(v) => update({ itemAction: v })}
          options={buildOptions(ITEM_OPTIONS, MANUAL_FOLLOWUP_ITEM)}
          style={{ width: '100%' }}
          placeholder={t('selectItemAction', 'Select item action')}
          allowClear
        />
      </div>

      {/* Auction */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('auctionAction', 'Auction')}
        </Typography.Text>
        <Select
          value={value.auctionAction || undefined}
          onChange={(v) => update({ auctionAction: v })}
          options={buildOptions(AUCTION_OPTIONS)}
          style={{ width: '100%' }}
          placeholder={t('selectAuctionAction', 'Select auction action')}
          allowClear
        />
      </div>

      {/* Penalty */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('penaltyAction', 'Penalty')}
        </Typography.Text>
        <Select
          value={value.penaltyAction || undefined}
          onChange={(v) => update({ penaltyAction: v })}
          options={buildOptions(PENALTY_OPTIONS)}
          style={{ width: '100%' }}
          placeholder={t('selectPenaltyAction', 'Select penalty action')}
          allowClear
        />
      </div>

      {/* Resolution Summary */}
      {summaryLines.length > 0 && (
        <Card
          size="small"
          title={t('resolutionSummary', 'Resolution Summary')}
          style={{ marginTop: 8 }}
        >
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {summaryLines.map((line, i) => (
              <li key={i}><Typography.Text>{line}</Typography.Text></li>
            ))}
          </ul>
          {needsManualFollowup && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={t('manualFollowupWarning', 'Some actions require manual follow-up after resolution.')}
              style={{ marginTop: 8 }}
            />
          )}
          <Collapse
            size="small"
            style={{ marginTop: 8 }}
            items={[
              {
                key: 'raw',
                label: t('technicalDetails', 'Technical details (JSON)'),
                children: (
                  <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        </Card>
      )}
    </Space>
  )
}
