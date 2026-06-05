import { useMemo } from 'react'
import { Select, InputNumber, Tag, Card, Typography, Space, Alert, Collapse } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ResolutionActionSet } from '@/features/dispute/api'

// ── Option value arrays (labels added inside component via t()) ─────

const ESCROW_VALUES = ['no_action', 'release_to_seller', 'refund_buyer', 'partial_refund', 'hold'] as const
const REFUND_VALUES = ['no_refund', 'full_refund', 'partial_refund'] as const
const SHIPMENT_VALUES = ['no_action', 'cancel_shipment', 'mark_lost', 'rebook_shipment', 'open_return'] as const
const ITEM_VALUES = ['no_action', 'return_to_active', 'hold_in_warehouse', 'return_to_seller', 'reject_listing'] as const
const AUCTION_VALUES = ['no_action', 'relist', 'cancel'] as const
const PENALTY_VALUES = ['no_action', 'flag_buyer', 'flag_seller'] as const
const WAREHOUSE_INSPECTION_VALUES = ['no_action', 'force_reinspection'] as const

// Maps snake_case option values to i18n key suffixes (camelCase)
const VALUE_TO_KEY: Record<string, string> = {
  no_action: 'noAction',
  release_to_seller: 'releaseToSeller',
  refund_buyer: 'refundBuyer',
  partial_refund: 'partialRefund',
  hold: 'hold',
  no_refund: 'noRefund',
  full_refund: 'fullRefund',
  cancel_shipment: 'cancelShipment',
  mark_lost: 'markLost',
  rebook_shipment: 'rebookShipment',
  open_return: 'openReturn',
  return_to_active: 'returnToActive',
  hold_in_warehouse: 'holdInWarehouse',
  return_to_seller: 'returnToSeller',
  reject_listing: 'rejectListing',
  relist: 'relist',
  cancel: 'cancel',
  flag_buyer: 'flagBuyer',
  flag_seller: 'flagSeller',
  force_reinspection: 'forceReinspection',
}

const MANUAL_FOLLOWUP_SHIPMENT = new Set(['rebook_shipment', 'open_return'])
const MANUAL_FOLLOWUP_ITEM = new Set(['return_to_seller', 'reject_listing'])

// Actions that exist in the UI but are V1 stubs on the backend — they only log
// a warning and require manual admin intervention. Shown with a red tag.
const STUB_ACTIONS = new Set(['rebook_shipment', 'reject_listing'])

// ── Tooltips (key suffixes matching VALUE_TO_KEY) ──────────────────

// ── Outcome presets ─────────────────────────────────────────────────

const OUTCOME_PRESETS: Record<string, Partial<ResolutionActionSet>> = {
  favor_buyer: { escrowAction: 'refund_buyer', refundAction: 'no_refund', penaltyAction: 'no_action' },
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
    favor_buyer: { itemAction: 'return_to_seller', shipmentAction: 'open_return' },
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

// ── Summary key mappings (value → i18n key under resolution.summary) ─

const SUMMARY_KEYS: Record<string, Record<string, string>> = {
  escrowAction: {
    release_to_seller: 'escrowReleaseToSeller',
    refund_buyer: 'escrowRefundBuyer',
    partial_refund: 'escrowPartialRefund',
    hold: 'escrowHold',
  },
  refundAction: {
    full_refund: 'refundFull',
    partial_refund: 'refundPartial',
  },
  shipmentAction: {
    cancel_shipment: 'shipmentCancel',
    mark_lost: 'shipmentLost',
    rebook_shipment: 'shipmentRebook',
    open_return: 'shipmentReturn',
  },
  itemAction: {
    return_to_active: 'itemReturnToActive',
    hold_in_warehouse: 'itemHold',
    return_to_seller: 'itemReturnToSeller',
    reject_listing: 'itemRejectListing',
  },
  auctionAction: {
    relist: 'auctionRelist',
    cancel: 'auctionCancel',
  },
  penaltyAction: {
    flag_buyer: 'penaltyFlagBuyer',
    flag_seller: 'penaltyFlagSeller',
  },
  warehouseInspectionAction: {
    force_reinspection: 'warehouseForceReinspection',
  },
}

// ── Validation ──────────────────────────────────────────────────────

// Validate requires a translate function to produce translated messages
type TranslateFn = (key: string) => string

export function validateActionSet(
  actionSet: ResolutionActionSet,
  t?: TranslateFn,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (
    (actionSet.escrowAction === 'partial_refund' || actionSet.refundAction === 'partial_refund') &&
    (!actionSet.refundAmount || actionSet.refundAmount <= 0)
  ) {
    errors.push(t?.('resolution.validation.refundAmountRequired') ?? 'Refund amount must be greater than 0 when partial refund is selected.')
  }

  if (actionSet.escrowAction === 'release_to_seller' && actionSet.refundAction === 'full_refund') {
    errors.push(t?.('resolution.validation.conflictReleaseAndRefund') ?? 'Cannot release to seller and refund buyer simultaneously.')
  }

  // Cannot request buyer refund through both EscrowAction and RefundAction
  if (actionSet.escrowAction === 'refund_buyer' && (actionSet.refundAction === 'full_refund' || actionSet.refundAction === 'partial_refund')) {
    errors.push(t?.('resolution.validation.conflictDoubleRefund') ?? 'Cannot request buyer refund through both Escrow and Refund actions. Use one or the other.')
  }

  const allNoAction = !actionSet.escrowAction || actionSet.escrowAction === 'no_action'
  const allNoRefund = !actionSet.refundAction || actionSet.refundAction === 'no_refund'
  const shipNone = !actionSet.shipmentAction || actionSet.shipmentAction === 'no_action'
  const itemNone = !actionSet.itemAction || actionSet.itemAction === 'no_action'
  const auctNone = !actionSet.auctionAction || actionSet.auctionAction === 'no_action'
  const penNone = !actionSet.penaltyAction || actionSet.penaltyAction === 'no_action'

  if (allNoAction && allNoRefund && shipNone && itemNone && auctNone && penNone) {
    warnings.push(t?.('resolution.validation.noActionsWarning') ?? 'No resolution actions selected. Are you sure?')
  }

  // Warn when return_to_seller is selected without open_return — the item
  // action alone is a no-op; the buyer won't have a structured return flow.
  if (
    actionSet.itemAction === 'return_to_seller' &&
    actionSet.shipmentAction !== 'open_return'
  ) {
    warnings.push(
      t?.('resolution.validation.returnToSellerNeedsOpenReturn') ??
        'Item "Return to Seller" requires Shipment "Open Return" to trigger the buyer return flow. Without it, the return is manual only.',
    )
  }

  // Warn when a refund is selected alongside return_to_seller but without
  // open_return — refund will fire immediately before buyer ships item back.
  const hasRefundIntent =
    actionSet.escrowAction === 'refund_buyer' ||
    actionSet.escrowAction === 'partial_refund' ||
    actionSet.refundAction === 'full_refund' ||
    actionSet.refundAction === 'partial_refund'
  if (
    hasRefundIntent &&
    actionSet.itemAction === 'return_to_seller' &&
    actionSet.shipmentAction !== 'open_return'
  ) {
    errors.push(
      t?.('resolution.validation.refundWithoutReturnWarning') ??
        'Refund will fire immediately without waiting for the buyer to return the item. Select Shipment "Open Return" to defer the refund until the seller confirms receipt.',
    )
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

export default function ResolutionActionBuilder({ value, onChange, domain: _domain, outcome, errors }: ResolutionActionBuilderProps) {
  const { t } = useTranslation('dispute')
  const { t: ta } = useTranslation('admin')

  // Build translated option arrays inside the component
  const buildOpts = (values: readonly string[], prefix: string) =>
    values.map((v) => ({ value: v, label: ta(`resolution.${prefix}.${VALUE_TO_KEY[v] ?? v}`) }))

  const ESCROW_OPTIONS = buildOpts(ESCROW_VALUES, 'escrowOption')
  const REFUND_OPTIONS = buildOpts(REFUND_VALUES, 'refundOption')
  const SHIPMENT_OPTIONS = buildOpts(SHIPMENT_VALUES, 'shipmentOption')
  const ITEM_OPTIONS = buildOpts(ITEM_VALUES, 'itemOption')
  const AUCTION_OPTIONS = buildOpts(AUCTION_VALUES, 'auctionOption')
  const PENALTY_OPTIONS = buildOpts(PENALTY_VALUES, 'penaltyOption')
  const WAREHOUSE_INSPECTION_OPTIONS = buildOpts(WAREHOUSE_INSPECTION_VALUES, 'warehouseInspectionOption')

  const renderOptionLabel = (opt: { value: string; label: string }, manualSet?: Set<string>) => {
    const tooltipKey = VALUE_TO_KEY[opt.value]
    const tooltip = tooltipKey ? ta(`resolution.tooltip.${tooltipKey}`) : undefined
    const isStub = STUB_ACTIONS.has(opt.value)
    return (
      <span title={tooltip}>
        {opt.label}
        {isStub && (
          <Tag color="red" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
            V1 stub
          </Tag>
        )}
        {!isStub && manualSet?.has(opt.value) && (
          <Tag color="orange" style={{ marginLeft: 8, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
            {ta('resolution.manualFollowupRequired')}
          </Tag>
        )}
      </span>
    )
  }

  const buildOptions = (opts: { value: string; label: string }[], manualSet?: Set<string>) =>
    opts.map((o) => ({ value: o.value, label: renderOptionLabel(o, manualSet) }))

  const update = (patch: Partial<ResolutionActionSet>) => {
    const next = { ...value, ...patch }

    // Auto-clear conflicting refund selections to prevent double-refund
    if (patch.escrowAction === 'refund_buyer') {
      // Escrow handles buyer refund → clear refund action
      next.refundAction = 'no_refund'
    } else if (patch.refundAction === 'full_refund' || patch.refundAction === 'partial_refund') {
      // Refund action handles buyer refund → clear escrow if it's refund_buyer
      if (next.escrowAction === 'refund_buyer') {
        next.escrowAction = 'no_action'
      }
    }

    // Auto-link: selecting return_to_seller auto-sets open_return so the
    // buyer return flow triggers and the refund is deferred correctly.
    if (patch.itemAction === 'return_to_seller') {
      if (!next.shipmentAction || next.shipmentAction === 'no_action') {
        next.shipmentAction = 'open_return'
      }
    }
    // Auto-link reverse: selecting open_return auto-sets return_to_seller
    if (patch.shipmentAction === 'open_return') {
      if (!next.itemAction || next.itemAction === 'no_action') {
        next.itemAction = 'return_to_seller'
      }
    }

    onChange(next)
  }

  const showRefundAmount =
    value.escrowAction === 'partial_refund' || value.refundAction === 'partial_refund'

  const needsManualFollowup =
    MANUAL_FOLLOWUP_SHIPMENT.has(value.shipmentAction ?? '') ||
    MANUAL_FOLLOWUP_ITEM.has(value.itemAction ?? '')

  // Summary lines
  const summaryLines = useMemo(() => {
    const lines: string[] = []
    for (const [field, map] of Object.entries(SUMMARY_KEYS)) {
      const val = value[field as keyof ResolutionActionSet] as string | undefined
      if (val && map[val]) {
        let line = ta(`resolution.summary.${map[val]}`)
        if ((field === 'escrowAction' || field === 'refundAction') && val === 'partial_refund' && value.refundAmount) {
          line += ` (${value.refundAmount})`
        }
        lines.push(line)
      }
    }
    return lines
  }, [value, ta])

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
        {value.penaltyAction && value.penaltyAction !== 'no_action' && (
          <Alert
            type="info"
            showIcon
            message={ta('resolution.penaltyInfoV1', 'Penalty actions currently log a review flag only — no automated enforcement (ban/restriction) is applied.')}
            style={{ marginTop: 4 }}
          />
        )}
      </div>

      {/* Warehouse Inspection */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('warehouseInspectionAction', 'Warehouse Inspection')}
        </Typography.Text>
        <Select
          value={value.warehouseInspectionAction || undefined}
          onChange={(v) => update({ warehouseInspectionAction: v })}
          options={buildOptions(WAREHOUSE_INSPECTION_OPTIONS)}
          style={{ width: '100%' }}
          placeholder={t('selectWarehouseInspectionAction', 'Select warehouse inspection action')}
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
