import { useState, useCallback } from 'react'
import {
  Collapse,
  DatePicker,
  Form,
  InputNumber,
  Switch,
  Typography,
  Flex,
  Radio,
  Select,
  Button,
  Card,
  Alert,
} from 'antd'
import type { FormInstance } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text } = Typography

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuctionTimingSectionProps {
  form: FormInstance
  itemApproved?: boolean
}

type QualOpenMode = 'now' | 'later'
type QualDurationPreset = '15min' | '30min' | '1h' | '3h' | '6h' | '12h' | 'custom'
type BiddingGapPreset = '1min' | '5min' | '15min' | '30min' | '1h' | '3h' | 'custom'
type AuctionDurationPreset = '2h' | '6h' | '12h' | '24h' | '3d' | 'custom'

interface CustomDuration {
  value: number
  unit: 'minutes' | 'hours' | 'days'
}

interface TimingState {
  qualificationOpenMode: QualOpenMode
  scheduledQualificationStart: Dayjs | null
  qualificationDurationPreset: QualDurationPreset
  qualificationDurationCustom: CustomDuration | null
  biddingGapPreset: BiddingGapPreset
  biddingGapCustom: CustomDuration | null
  auctionDurationPreset: AuctionDurationPreset
  auctionDurationCustom: CustomDuration | null
  autoExtend: boolean
  extensionMinutes: number
  advancedOverride: boolean
  showAdvanced: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_FORMAT = 'YYYY-MM-DD HH:mm'
const TIME_FORMAT = 'HH:mm'
const DISPLAY_FORMAT = 'MMM D, YYYY [at] h:mm A'

const MIN_QUAL_START_OFFSET_MINUTES = 5
const MIN_QUALIFICATION_DURATION_MINUTES = 5
const MIN_BIDDING_GAP_MINUTES = 1
const MIN_AUCTION_DURATION_MINUTES = 15
const MAX_AUCTION_DURATION_MINUTES = 14 * 24 * 60

// Safety buffer added to "now" when writing hidden form fields to avoid
// the backend rejecting qualificationStartAt < now on a slow submit.
const SAFE_NOW_BUFFER_SECONDS = 30

const QUAL_DURATION_OPTIONS: { label: string; value: QualDurationPreset; minutes: number }[] = [
  { label: '15 min', value: '15min', minutes: 15 },
  { label: '30 min', value: '30min', minutes: 30 },
  { label: '1 hour', value: '1h', minutes: 60 },
  { label: '3 hours', value: '3h', minutes: 180 },
  { label: '6 hours', value: '6h', minutes: 360 },
  { label: '12 hours', value: '12h', minutes: 720 },
  { label: 'Custom…', value: 'custom', minutes: 0 },
]

const BIDDING_GAP_OPTIONS: { label: string; value: BiddingGapPreset; minutes: number }[] = [
  { label: '1 min', value: '1min', minutes: 1 },
  { label: '5 min', value: '5min', minutes: 5 },
  { label: '15 min', value: '15min', minutes: 15 },
  { label: '30 min', value: '30min', minutes: 30 },
  { label: '1 hour', value: '1h', minutes: 60 },
  { label: '3 hours', value: '3h', minutes: 180 },
  { label: 'Custom…', value: 'custom', minutes: 0 },
]

const AUCTION_DURATION_OPTIONS: { label: string; value: AuctionDurationPreset; minutes: number }[] = [
  { label: '2 hours', value: '2h', minutes: 120 },
  { label: '6 hours', value: '6h', minutes: 360 },
  { label: '12 hours', value: '12h', minutes: 720 },
  { label: '24 hours', value: '24h', minutes: 1440 },
  { label: '3 days', value: '3d', minutes: 4320 },
  { label: 'Custom…', value: 'custom', minutes: 0 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeNow(): Dayjs {
  return dayjs().add(SAFE_NOW_BUFFER_SECONDS, 'second')
}

function customToMinutes(custom: CustomDuration): number {
  if (custom.unit === 'minutes') return custom.value
  if (custom.unit === 'hours') return custom.value * 60
  return custom.value * 60 * 24
}

function getQualDurationMinutes(state: TimingState): number {
  if (state.qualificationDurationPreset !== 'custom') {
    const opt = QUAL_DURATION_OPTIONS.find((o) => o.value === state.qualificationDurationPreset)
    return opt?.minutes ?? 60
  }
  return state.qualificationDurationCustom ? customToMinutes(state.qualificationDurationCustom) : 60
}

function getBiddingGapMinutes(state: TimingState): number {
  if (state.biddingGapPreset !== 'custom') {
    const opt = BIDDING_GAP_OPTIONS.find((o) => o.value === state.biddingGapPreset)
    return opt?.minutes ?? 60
  }
  return state.biddingGapCustom ? customToMinutes(state.biddingGapCustom) : 60
}

function getAuctionDurationMinutes(state: TimingState): number {
  if (state.auctionDurationPreset !== 'custom') {
    const opt = AUCTION_DURATION_OPTIONS.find((o) => o.value === state.auctionDurationPreset)
    return opt?.minutes ?? 1440
  }
  return state.auctionDurationCustom ? customToMinutes(state.auctionDurationCustom) : 1440
}

function deriveTimingPayload(state: TimingState): {
  qualificationStartAt: Dayjs
  qualificationEndAt: Dayjs
  startTime: Dayjs
  endTime: Dayjs
} {
  const qualificationStartAt =
    state.qualificationOpenMode === 'now'
      ? safeNow()
      : (state.scheduledQualificationStart ?? dayjs().add(MIN_QUAL_START_OFFSET_MINUTES, 'minute'))

  const qualDurationMinutes = getQualDurationMinutes(state)
  const biddingGapMinutes = getBiddingGapMinutes(state)
  const auctionDurationMinutes = getAuctionDurationMinutes(state)

  const qualificationEndAt = qualificationStartAt.add(qualDurationMinutes, 'minute')
  const startTime = qualificationEndAt.add(biddingGapMinutes, 'minute')
  const endTime = startTime.add(auctionDurationMinutes, 'minute')

  return { qualificationStartAt, qualificationEndAt, startTime, endTime }
}

function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  if (minutes < 1440) {
    const h = Math.round(minutes / 60)
    return `${h} hour${h !== 1 ? 's' : ''}`
  }
  const d = Math.round(minutes / 1440)
  return `${d} day${d !== 1 ? 's' : ''}`
}

function formatNaturalSummary(state: TimingState, qualStart: Dayjs): string {
  const qualLabel =
    state.qualificationOpenMode === 'now' ? 'now' : qualStart.format(DISPLAY_FORMAT)
  const qualDurLabel = formatMinutesLabel(getQualDurationMinutes(state))
  const gapLabel = formatMinutesLabel(getBiddingGapMinutes(state))
  const auctionDurLabel = formatMinutesLabel(getAuctionDurationMinutes(state))
  return `Qualification opens ${qualLabel}, stays open for ${qualDurLabel}, bidding starts ${gapLabel} after qualification closes, and the auction runs for ${auctionDurLabel}.`
}

function disabledDate(current: Dayjs): boolean {
  return current && current.isBefore(dayjs().startOf('day'))
}

// ─── Preset button renderer ───────────────────────────────────────────────────

interface PresetButtonsProps<T extends string> {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  customLabel?: string
}

function PresetButtons<T extends string>({ options, value, onChange, customLabel }: PresetButtonsProps<T>) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: `1.5px solid ${value === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: value === opt.value ? 'var(--color-accent)' : 'var(--color-bg-card)',
            color: value === opt.value ? '#fff' : 'var(--color-text-secondary)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {opt.label === 'Custom…' && customLabel ? customLabel : opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuctionTimingSection({ form, itemApproved = true }: AuctionTimingSectionProps) {
  const { t } = useTranslation('auction')

  const [state, setState] = useState<TimingState>({
    qualificationOpenMode: 'now',
    scheduledQualificationStart: null,
    qualificationDurationPreset: '1h',
    qualificationDurationCustom: null,
    biddingGapPreset: '1h',
    biddingGapCustom: null,
    auctionDurationPreset: '24h',
    auctionDurationCustom: null,
    autoExtend: true,
    extensionMinutes: 5,
    advancedOverride: false,
    showAdvanced: false,
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Watch auction type to enforce sealed constraints (no auto-extend for sealed)
  const watchedAuctionType = Form.useWatch('auctionType', form)
  const isSealed = watchedAuctionType === 'sealed'

  // Advanced field watchers
  const advQualStart = Form.useWatch('qualificationStartAt', form)
  const advQualEnd = Form.useWatch('qualificationEndAt', form)
  const advStartTime = Form.useWatch('startTime', form)
  const advEndTime = Form.useWatch('endTime', form)

  const validateSimpleMode = useCallback(
    (s: TimingState): string[] => {
      const errors: string[] = []
      const qualDur = getQualDurationMinutes(s)
      const auctionDur = getAuctionDurationMinutes(s)
      const biddingGapMinutes = getBiddingGapMinutes(s)
      const now = dayjs()

      if (qualDur < MIN_QUALIFICATION_DURATION_MINUTES) {
        errors.push(t('errorQualDurationMin', 'Qualification must last at least 5 minutes.'))
      }
      if (auctionDur < MIN_AUCTION_DURATION_MINUTES) {
        errors.push(t('errorDurationMin', 'The auction must last at least 15 minutes.'))
      }
      if (auctionDur > MAX_AUCTION_DURATION_MINUTES) {
        errors.push(t('errorDurationMax', 'The auction cannot run longer than 14 days.'))
      }
      if (biddingGapMinutes < MIN_BIDDING_GAP_MINUTES) {
        errors.push(t('errorBiddingGapMin', 'Bidding must start at least 1 minute after qualification closes.'))
      }
      if (
        s.qualificationOpenMode === 'later' &&
        (!s.scheduledQualificationStart ||
          s.scheduledQualificationStart.isBefore(now.add(1, 'minute')))
      ) {
        errors.push(t('errorQualStartFuture', 'Pick a qualification opening time in the future.'))
      }
      if (s.autoExtend && (s.extensionMinutes < 1 || s.extensionMinutes > 30)) {
        errors.push(t('errorExtensionRange', 'Extension minutes must be between 1 and 30.'))
      }
      return errors
    },
    [t],
  )

  const syncFormFromState = useCallback(
    (next: TimingState) => {
      const errors = validateSimpleMode(next)
      setValidationErrors(errors)
      if (errors.length === 0) {
        const derived = deriveTimingPayload(next)
        form.setFieldsValue({
          qualificationStartAt: derived.qualificationStartAt,
          qualificationEndAt: derived.qualificationEndAt,
          startTime: derived.startTime,
          endTime: derived.endTime,
          autoExtend: next.autoExtend,
          extensionMinutes: next.extensionMinutes,
        })
      }
    },
    [form, validateSimpleMode],
  )

  const patch = useCallback(
    (partial: Partial<TimingState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial }
        if (!next.advancedOverride) {
          syncFormFromState(next)
        }
        return next
      })
    },
    [syncFormFromState],
  )

  const handleAdvancedFieldChange = () => {
    setState((prev) => ({ ...prev, advancedOverride: true }))
  }

  const handleResetToSimple = () => {
    setState((prev) => {
      const next = { ...prev, advancedOverride: false }
      syncFormFromState(next)
      return next
    })
  }

  // ── Item not approved banner ──────────────────────────────────────────────
  if (!itemApproved) {
    return (
      <div style={{ marginBottom: 24 }}>
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          message={t('scheduleSectionTitle', 'Schedule')}
          description={t(
            'itemNotApprovedYetScheduling',
            'Your auction will be scheduled after the item is approved. You can set the schedule later.',
          )}
          style={{ borderRadius: 8 }}
        />
      </div>
    )
  }

  // ── Derive current timing for summary ─────────────────────────────────────
  const derived = state.advancedOverride
    ? {
        qualificationStartAt: advQualStart ? dayjs(advQualStart) : null,
        qualificationEndAt: advQualEnd ? dayjs(advQualEnd) : null,
        startTime: advStartTime ? dayjs(advStartTime) : null,
        endTime: advEndTime ? dayjs(advEndTime) : null,
      }
    : deriveTimingPayload(state)

  const hasDerived =
    derived.startTime &&
    derived.endTime &&
    derived.qualificationStartAt &&
    derived.qualificationEndAt

  // ── Validation helpers for advanced mode ─────────────────────────────────
  const validateAdvancedStart = (_: unknown, value: Dayjs | null | undefined) => {
    if (value && dayjs(value).isBefore(dayjs())) {
      return Promise.reject(new Error(t('errorStartFuture', 'Pick a start time in the future.')))
    }
    return Promise.resolve()
  }

  const validateAdvancedQualEnd = (_: unknown, value: Dayjs | null | undefined) => {
    const qStart = form.getFieldValue('qualificationStartAt')
    if (value && qStart && !dayjs(value).isAfter(dayjs(qStart))) {
      return Promise.reject(
        new Error(t('errorQualEndAfterQualStart', 'Qualification end must be after qualification start.')),
      )
    }
    return Promise.resolve()
  }

  const validateAdvancedAuctionEnd = (_: unknown, value: Dayjs | null | undefined) => {
    const aStart = form.getFieldValue('startTime')
    if (value && aStart) {
      const diffMinutes = dayjs(value).diff(dayjs(aStart), 'minute')
      if (diffMinutes < MIN_AUCTION_DURATION_MINUTES) {
        return Promise.reject(
          new Error(t('errorDurationMin', 'The auction must last at least 15 minutes.')),
        )
      }
      if (diffMinutes > MAX_AUCTION_DURATION_MINUTES) {
        return Promise.reject(
          new Error(t('errorDurationMax', 'The auction cannot run longer than 14 days.')),
        )
      }
    }
    return Promise.resolve()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Hidden form fields that carry the actual payload */}
      <Form.Item name="qualificationStartAt" hidden>
        <DatePicker />
      </Form.Item>
      <Form.Item name="qualificationEndAt" hidden>
        <DatePicker />
      </Form.Item>
      <Form.Item name="startTime" hidden>
        <DatePicker />
      </Form.Item>
      <Form.Item name="endTime" hidden>
        <DatePicker />
      </Form.Item>
      <Form.Item name="autoExtend" hidden valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="extensionMinutes" hidden>
        <InputNumber />
      </Form.Item>

      <div
        style={{
          borderTop: '1px solid var(--color-border-light)',
          paddingTop: 24,
          marginTop: 8,
        }}
      >
        {/* Section title */}
        <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
          <ClockCircleOutlined style={{ color: 'var(--color-accent)', fontSize: 18 }} />
          <Text style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>
            {t('scheduleSectionTitle', 'Schedule')}
          </Text>
        </Flex>
        <Text
          type="secondary"
          style={{ display: 'block', fontSize: 13, marginBottom: 20 }}
        >
          {t('scheduleSectionSubtitle', 'Set qualification and bidding windows.')}
        </Text>

        {/* ── Simple mode ────────────────────────────────────────────────── */}
        {!state.advancedOverride && (
          <>
            {/* Validation error alert */}
            {validationErrors.length > 0 && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16, borderRadius: 8 }}
                message={t('timingValidationError', 'Please fix the following:')}
                description={
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {validationErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {/* 1. When should qualification open? */}
            <Form.Item
              label={<Text strong>{t('whenQualOpen', 'When should qualification open?')}</Text>}
            >
              <Radio.Group
                value={state.qualificationOpenMode}
                onChange={(e) =>
                  patch({
                    qualificationOpenMode: e.target.value as QualOpenMode,
                    scheduledQualificationStart: null,
                  })
                }
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <Radio value="now">{t('qualOpenNow', 'Open qualification now')}</Radio>
                <Radio value="later">{t('qualOpenLater', 'Schedule qualification for later')}</Radio>
              </Radio.Group>

              {state.qualificationOpenMode === 'later' && (
                <DatePicker
                  style={{ width: '100%', marginTop: 12 }}
                  showTime={{ format: TIME_FORMAT }}
                  format={DATE_FORMAT}
                  disabledDate={disabledDate}
                  disabledTime={() => ({
                    disabledHours: () => [],
                    disabledMinutes: (selectedHour) => {
                      const now = dayjs()
                      if (selectedHour === now.hour()) {
                        return Array.from(
                          { length: now.minute() + MIN_QUAL_START_OFFSET_MINUTES },
                          (_, i) => i,
                        )
                      }
                      return []
                    },
                  })}
                  value={state.scheduledQualificationStart}
                  onChange={(val) => patch({ scheduledQualificationStart: val })}
                  placeholder={t('scheduledQualStartPlaceholder', 'Pick a date and time')}
                />
              )}
            </Form.Item>

            {/* 2. Qualification phase lasts */}
            <Form.Item
              label={<Text strong>{t('qualDurationLabel', 'Qualification phase lasts')}</Text>}
            >
              <PresetButtons
                options={QUAL_DURATION_OPTIONS}
                value={state.qualificationDurationPreset}
                onChange={(v) => patch({ qualificationDurationPreset: v })}
                customLabel={t('durationCustom', 'Custom…')}
              />
              {state.qualificationDurationPreset === 'custom' && (
                <Flex gap={8} style={{ marginTop: 12 }} align="center">
                  <InputNumber
                    min={1}
                    value={state.qualificationDurationCustom?.value ?? 60}
                    onChange={(val) =>
                      patch({
                        qualificationDurationCustom: {
                          value: val ?? 1,
                          unit: state.qualificationDurationCustom?.unit ?? 'minutes',
                        },
                      })
                    }
                    style={{ flex: 1 }}
                    placeholder="60"
                  />
                  <Select
                    value={state.qualificationDurationCustom?.unit ?? 'minutes'}
                    onChange={(val) =>
                      patch({
                        qualificationDurationCustom: {
                          value: state.qualificationDurationCustom?.value ?? 60,
                          unit: val,
                        },
                      })
                    }
                    style={{ width: 100 }}
                    options={[
                      { label: t('unitMinutes', 'minutes'), value: 'minutes' },
                      { label: t('unitHours', 'hours'), value: 'hours' },
                      { label: t('unitDays', 'days'), value: 'days' },
                    ]}
                  />
                </Flex>
              )}
            </Form.Item>

            {/* 3. Bidding starts after qualification closes */}
            <Form.Item
              label={<Text strong>{t('biddingGapLabel', 'Bidding starts after qualification closes')}</Text>}
              help={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t(
                    'biddingGapHelp',
                    'Gap between qualification closing and bidding opening. Minimum 1 minute.',
                  )}
                </Text>
              }
            >
              <PresetButtons
                options={BIDDING_GAP_OPTIONS}
                value={state.biddingGapPreset}
                onChange={(v) => patch({ biddingGapPreset: v })}
                customLabel={t('durationCustom', 'Custom…')}
              />
              {state.biddingGapPreset === 'custom' && (
                <Flex gap={8} style={{ marginTop: 12 }} align="center">
                  <InputNumber
                    min={1}
                    value={state.biddingGapCustom?.value ?? 60}
                    onChange={(val) =>
                      patch({
                        biddingGapCustom: {
                          value: val ?? 1,
                          unit: state.biddingGapCustom?.unit ?? 'minutes',
                        },
                      })
                    }
                    style={{ flex: 1 }}
                    placeholder="60"
                  />
                  <Select
                    value={state.biddingGapCustom?.unit ?? 'minutes'}
                    onChange={(val) =>
                      patch({
                        biddingGapCustom: {
                          value: state.biddingGapCustom?.value ?? 60,
                          unit: val,
                        },
                      })
                    }
                    style={{ width: 100 }}
                    options={[
                      { label: t('unitMinutes', 'minutes'), value: 'minutes' },
                      { label: t('unitHours', 'hours'), value: 'hours' },
                      { label: t('unitDays', 'days'), value: 'days' },
                    ]}
                  />
                </Flex>
              )}
            </Form.Item>

            {/* 4. Auction duration */}
            <Form.Item
              label={<Text strong>{t('auctionDurationLabel', 'Auction duration')}</Text>}
            >
              <PresetButtons
                options={AUCTION_DURATION_OPTIONS}
                value={state.auctionDurationPreset}
                onChange={(v) => patch({ auctionDurationPreset: v })}
                customLabel={t('durationCustom', 'Custom…')}
              />
              {state.auctionDurationPreset === 'custom' && (
                <Flex gap={8} style={{ marginTop: 12 }} align="center">
                  <InputNumber
                    min={1}
                    value={state.auctionDurationCustom?.value ?? 1440}
                    onChange={(val) =>
                      patch({
                        auctionDurationCustom: {
                          value: val ?? 1,
                          unit: state.auctionDurationCustom?.unit ?? 'minutes',
                        },
                      })
                    }
                    style={{ flex: 1 }}
                    placeholder="1440"
                  />
                  <Select
                    value={state.auctionDurationCustom?.unit ?? 'minutes'}
                    onChange={(val) =>
                      patch({
                        auctionDurationCustom: {
                          value: state.auctionDurationCustom?.value ?? 1440,
                          unit: val,
                        },
                      })
                    }
                    style={{ width: 100 }}
                    options={[
                      { label: t('unitMinutes', 'minutes'), value: 'minutes' },
                      { label: t('unitHours', 'hours'), value: 'hours' },
                      { label: t('unitDays', 'days'), value: 'days' },
                    ]}
                  />
                </Flex>
              )}
            </Form.Item>

            {/* 5. Auto-extend */}
            <Form.Item label={<Text strong>{t('autoExtendTitle', 'Auto-extend')}</Text>}>
              <Flex align="center" gap={10} style={{ marginBottom: state.autoExtend ? 8 : 0 }}>
                <Switch
                  checked={isSealed ? false : state.autoExtend}
                  onChange={(val) => patch({ autoExtend: val })}
                  disabled={isSealed}
                />
                <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {isSealed
                    ? t('autoExtendSealedDisabled', 'Auto-extend is not available for sealed auctions.')
                    : t('autoExtendDesc', "If someone bids near the end, the auction gets a few extra minutes.")}
                </Text>
              </Flex>
              {state.autoExtend && (
                <Flex align="center" gap={8} style={{ marginTop: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('extensionMinutesLabel', 'Extend by (minutes):')}
                  </Text>
                  <InputNumber
                    min={1}
                    max={30}
                    value={state.extensionMinutes}
                    onChange={(val) => patch({ extensionMinutes: val ?? 5 })}
                    style={{ width: 80 }}
                  />
                </Flex>
              )}
            </Form.Item>
          </>
        )}

        {/* ── Advanced override active notice ──────────────────────────── */}
        {state.advancedOverride && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message={t('advancedTimingActive', 'Advanced timing in use.')}
            description={t(
              'advancedTimingActiveDesc',
              'Simple mode is paused. Click Reset to return to simple mode.',
            )}
            action={
              <Button size="small" type="link" onClick={handleResetToSimple}>
                {t('resetToSimple', 'Reset to simple')}
              </Button>
            }
          />
        )}

        {/* ── Live summary card ─────────────────────────────────────────── */}
        {hasDerived &&
          derived.startTime &&
          derived.endTime &&
          derived.qualificationStartAt &&
          derived.qualificationEndAt && (
            <Card
              size="small"
              style={{
                borderRadius: 8,
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-light)',
                marginBottom: 16,
              }}
            >
              <Text
                strong
                style={{
                  display: 'block',
                  fontSize: 13,
                  marginBottom: 8,
                  color: 'var(--color-text-primary)',
                }}
              >
                {t('liveSummaryHeader', 'Summary')}
              </Text>
              {!state.advancedOverride && (
                <Text
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 8,
                    fontStyle: 'italic',
                  }}
                >
                  {formatNaturalSummary(state, derived.qualificationStartAt)}
                </Text>
              )}
              <Flex vertical gap={4}>
                <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <strong>{t('qualOpens', 'Qualification opens')}:</strong>{' '}
                  {derived.qualificationStartAt.format(DISPLAY_FORMAT)}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <strong>{t('qualCloses', 'Qualification closes')}:</strong>{' '}
                  {derived.qualificationEndAt.format(DISPLAY_FORMAT)}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <strong>{t('biddingStarts', 'Bidding starts')}:</strong>{' '}
                  {derived.startTime.format(DISPLAY_FORMAT)}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <strong>{t('auctionEnds', 'Auction ends')}:</strong>{' '}
                  {derived.endTime.format(DISPLAY_FORMAT)}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <strong>{t('autoExtendTitle', 'Auto-extend')}:</strong>{' '}
                  {state.autoExtend ? `on (${state.extensionMinutes} min)` : 'off'}
                </Text>
              </Flex>
            </Card>
          )}

        {/* ── Advanced timing toggle ────────────────────────────────────── */}
        <Collapse
          ghost
          activeKey={state.showAdvanced ? ['adv'] : []}
          onChange={(keys) =>
            setState((prev) => ({
              ...prev,
              showAdvanced: Array.isArray(keys) ? keys.includes('adv') : keys === 'adv',
            }))
          }
          style={{ marginBottom: 8 }}
          items={[
            {
              key: 'adv',
              label: (
                <Button type="link" style={{ padding: 0, height: 'auto', fontSize: 13 }}>
                  {t('advancedTiming', 'Advanced timing')}
                </Button>
              ),
              children: (
                <div>
                  <Form.Item
                    name="qualificationStartAt"
                    label={t('timing.qualificationStart', 'Qualification Start')}
                    rules={[{ validator: validateAdvancedStart }]}
                  >
                    <DatePicker
                      format={DATE_FORMAT}
                      showTime={{ format: TIME_FORMAT }}
                      disabledDate={disabledDate}
                      style={{ width: '100%' }}
                      onChange={handleAdvancedFieldChange}
                    />
                  </Form.Item>

                  <Form.Item
                    name="qualificationEndAt"
                    label={t('timing.qualificationEnd', 'Qualification End')}
                    rules={[{ validator: validateAdvancedQualEnd }]}
                  >
                    <DatePicker
                      format={DATE_FORMAT}
                      showTime={{ format: TIME_FORMAT }}
                      disabledDate={disabledDate}
                      style={{ width: '100%' }}
                      onChange={handleAdvancedFieldChange}
                    />
                  </Form.Item>

                  <Form.Item
                    name="startTime"
                    label={t('timing.auctionStart', 'Auction Start')}
                    rules={[{ validator: validateAdvancedStart }]}
                  >
                    <DatePicker
                      format={DATE_FORMAT}
                      showTime={{ format: TIME_FORMAT }}
                      disabledDate={disabledDate}
                      style={{ width: '100%' }}
                      onChange={handleAdvancedFieldChange}
                    />
                  </Form.Item>

                  <Form.Item
                    name="endTime"
                    label={t('timing.auctionEnd', 'Auction End')}
                    rules={[{ validator: validateAdvancedAuctionEnd }]}
                  >
                    <DatePicker
                      format={DATE_FORMAT}
                      showTime={{ format: TIME_FORMAT }}
                      disabledDate={disabledDate}
                      style={{ width: '100%' }}
                      onChange={handleAdvancedFieldChange}
                    />
                  </Form.Item>

                  <Form.Item label={t('extensionMinutesLabel', 'Extend by (minutes)')}>
                    <Flex align="center" gap={10}>
                      <Switch
                        checked={isSealed ? false : state.autoExtend}
                        disabled={isSealed}
                        onChange={(val) => {
                          setState((prev) => ({ ...prev, autoExtend: val }))
                          form.setFieldValue('autoExtend', val)
                        }}
                      />
                      <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {t('autoExtendTitle', 'Auto-extend')}
                      </Text>
                    </Flex>
                    {state.autoExtend && (
                      <InputNumber
                        min={1}
                        max={30}
                        value={state.extensionMinutes}
                        onChange={(val) => {
                          setState((prev) => ({ ...prev, extensionMinutes: val ?? 5 }))
                          form.setFieldValue('extensionMinutes', val ?? 5)
                        }}
                        style={{ width: 80, marginTop: 8 }}
                      />
                    )}
                  </Form.Item>

                  {state.advancedOverride && (
                    <Button type="link" onClick={handleResetToSimple} style={{ padding: 0 }}>
                      {t('resetToSimple', 'Reset to simple')}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
