import React, { useState, useCallback, useEffect } from 'react'
import {
  Collapse,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Switch,
  Typography,
  Flex,
  Radio,
  Select,
  Button,
  Card,
  Alert,
  Grid,
} from 'antd'
import type { FormInstance } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text } = Typography
const { useBreakpoint } = Grid

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


const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm'

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

// Mount the picker popup inside the nearest scroll container so it never
// overflows the viewport on mobile.
function getPopupContainer(trigger: HTMLElement): HTMLElement {
  return trigger.closest('.ant-form-item') as HTMLElement ?? document.body
}

// ─── Preset button renderer ───────────────────────────────────────────────────

interface PresetButtonsProps<T extends string> {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  customLabel?: string
}

function PresetButtons<T extends string>({
  options,
  value,
  onChange,
  customLabel,
}: PresetButtonsProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        width: '100%',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 20,
            border: `1.5px solid ${value === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: value === opt.value ? 'var(--color-accent)' : 'var(--color-bg-card)',
            color: value === opt.value ? '#fff' : 'var(--color-text-secondary)',
            fontWeight: 500,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: 40,
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label === 'Custom…' && customLabel ? customLabel : opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Custom duration inline picker ───────────────────────────────────────────

function CustomDurationPicker({
  value,
  onChange,
  placeholder,
}: {
  value: CustomDuration | null
  onChange: (v: CustomDuration) => void
  placeholder?: string
}) {
  const { t } = useTranslation('auction')
  return (
    <Flex gap={8} style={{ marginTop: 10, width: '100%' }} align="center" wrap="wrap">
      <InputNumber
        min={1}
        value={value?.value ?? 60}
        onChange={(val) => onChange({ value: val ?? 1, unit: value?.unit ?? 'minutes' })}
        style={{ flex: '1 1 80px', minWidth: 72 }}
        placeholder={placeholder ?? '60'}
        size="large"
      />
      <Select
        value={value?.unit ?? 'minutes'}
        onChange={(unit) => onChange({ value: value?.value ?? 60, unit })}
        style={{ flex: '1 1 110px', minWidth: 110 }}
        size="large"
        options={[
          { label: t('timing.minutes', 'minutes'), value: 'minutes' },
          { label: t('timing.hours', 'hours'), value: 'hours' },
          { label: t('timing.days', 'days'), value: 'days' },
        ]}
      />
    </Flex>
  )
}

// ─── Mobile-friendly DateTime Picker ─────────────────────────────────────────
// On mobile: opens a full-width bottom-sheet style Modal with stacked date + time inputs.
// On desktop: falls back to the standard Ant DatePicker.

interface MobileDateTimePickerProps {
  value?: Dayjs | null
  onChange?: (val: Dayjs | null) => void
  onAfterChange?: () => void
  placeholder?: string
  disabledDate?: (d: Dayjs) => boolean
  disabledTime?: () => { disabledHours?: () => number[]; disabledMinutes?: (h: number) => number[] }
  style?: React.CSSProperties
  isMobile?: boolean
  label?: string
}

function MobileDateTimePicker({
  value,
  onChange,
  onAfterChange,
  placeholder,
  disabledDate,
  style,
  isMobile,
  label,
}: MobileDateTimePickerProps) {
  const { t } = useTranslation('auction')
  const [open, setOpen] = useState(false)
  const [draftDate, setDraftDate] = useState<string>('')
  const [draftTime, setDraftTime] = useState<string>('00:00')

  const displayValue = value ? value.format('D MMM YYYY [at] HH:mm') : ''

  const handleOpen = () => {
    if (value) {
      setDraftDate(value.format('YYYY-MM-DD'))
      setDraftTime(value.format('HH:mm'))
    } else {
      const def = dayjs().add(1, 'day')
      setDraftDate(def.format('YYYY-MM-DD'))
      setDraftTime('09:00')
    }
    setOpen(true)
  }

  const handleConfirm = () => {
    if (draftDate) {
      const combined = dayjs(`${draftDate} ${draftTime}`)
      onChange?.(combined)
      onAfterChange?.()
    }
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.(null)
    setOpen(false)
  }

  const today = dayjs().format('YYYY-MM-DD')

  if (!isMobile) {
    return (
      <DatePicker
        value={value}
        onChange={onChange}
        format="DD/MM/YYYY HH:mm"
        showTime={{ format: 'HH:mm' }}
        disabledDate={disabledDate}
        style={{ width: '100%', ...style }}
        placeholder={placeholder}
        getPopupContainer={getPopupContainer}
        popupStyle={{ maxWidth: '100vw' }}
      />
    )
  }

  return (
    <>
      {/* Trigger — styled to match Ant Input */}
      <button
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%',
          minHeight: 40,
          padding: '0 11px',
          borderRadius: 6,
          border: '1px solid var(--color-border, #d9d9d9)',
          background: 'var(--color-bg-card, #ffffff)',
          color: displayValue ? 'var(--color-text-primary, rgba(0,0,0,0.88))' : 'var(--color-text-tertiary, rgba(0,0,0,0.25))',
          fontSize: 14,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue || placeholder || t('timing.pickDateTime', 'Pick a date and time')}
        </span>
        {/* Calendar icon — matches Ant DatePicker */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ opacity: 0.35, flexShrink: 0, color: 'var(--color-text-secondary, rgba(0,0,0,0.45))' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary, rgba(0,0,0,0.88))' }}>
            {label || t('timing.selectDateTime', 'Select date & time')}
          </span>
        }
        centered
        styles={{
          header: {
            borderBottom: '0px solid var(--color-border-light, #f0f0f0)',
            paddingBottom: 12,
            marginBottom: 0,
          },
          body: { padding: '20px 0 8px' },
        }}
        style={{ maxWidth: 380 }}
        width="92vw"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Date row ── */}
          <div>
            <Text
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary, rgba(0,0,0,0.45))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              {t('timing.date', 'Date')}
            </Text>
            <input
              type="date"
              value={draftDate}
              min={today}
              onChange={(e) => setDraftDate(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 11px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid var(--color-border, #d9d9d9)',
                background: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-primary, rgba(0,0,0,0.88))',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
            />
          </div>

          {/* ── Time row ── */}
          <div>
            <Text
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary, rgba(0,0,0,0.45))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              {t('timing.time', 'Time')}
            </Text>
            <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 11px',
                fontSize: 14,
                borderRadius: 6,
                border: '1px solid var(--color-border, #d9d9d9)',
                background: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-primary, rgba(0,0,0,0.88))',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
            />
          </div>

          {/* ── Preview chip ── */}
          {draftDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--color-bg-surface, #fafafa)',
                border: '1px solid var(--color-border-light, #f0f0f0)',
              }}
            >
              {/* Accent dot */}
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--color-accent, #1677ff)',
                flexShrink: 0,
              }} />
              <Text style={{ fontSize: 13, color: 'var(--color-text-secondary, rgba(0,0,0,0.65))' }}>
                {dayjs(`${draftDate} ${draftTime}`).format('ddd, D MMM YYYY [·] HH:mm')}
              </Text>
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid var(--color-border-light, #f0f0f0)', margin: '4px 0 0' }} />

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={handleClear}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 14,
                color: 'var(--color-text-secondary, rgba(0,0,0,0.65))',
              }}
            >
              {t('timing.clear', 'Clear')}
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={!draftDate}
              style={{
                flex: 2,
                height: 38,
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                background: 'var(--color-accent, #1677ff)',
                borderColor: 'var(--color-accent, #1677ff)',
              }}
            >
              {t('confirm', 'Confirm')}
            </Button>
          </div>

        </div>
      </Modal>
    </>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuctionTimingSection({ form, itemApproved = true }: AuctionTimingSectionProps) {
  const { t } = useTranslation('auction')
  const screens = useBreakpoint()
  const isMobile = !screens.md

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

  // Watch auction type to enforce sealed constraints
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
        errors.push(
          t(
            'errorBiddingGapMin',
            'Bidding must start at least 1 minute after qualification closes.',
          ),
        )
      }
      if (
        s.qualificationOpenMode === 'later' &&
        (!s.scheduledQualificationStart ||
          s.scheduledQualificationStart.isBefore(now.add(1, 'minute')))
      ) {
        errors.push(
          t('errorQualStartFuture', 'Pick a qualification opening time in the future.'),
        )
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

  useEffect(() => {
    if (!state.advancedOverride) {
      syncFormFromState(state)
    }

  }, [])

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
      return Promise.reject(
        new Error(t('errorStartFuture', 'Pick a start time in the future.')),
      )
    }
    return Promise.resolve()
  }

  const validateAdvancedQualEnd = (_: unknown, value: Dayjs | null | undefined) => {
    const qStart = form.getFieldValue('qualificationStartAt')
    if (value && qStart && !dayjs(value).isAfter(dayjs(qStart))) {
      return Promise.reject(
        new Error(
          t(
            'errorQualEndAfterQualStart',
            'Qualification end must be after qualification start.',
          ),
        ),
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
    <div style={{ marginBottom: 24, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Responsive DatePicker popup fix */}
      <style>{`
        .ant-picker-dropdown {
          max-width: 100vw !important;
          left: 0 !important;
        }
        @media (max-width: 576px) {
          .ant-picker-dropdown {
            left: 8px !important;
            right: 8px !important;
            width: calc(100vw - 16px) !important;
          }
          .ant-picker-panel-container {
            width: 100% !important;
            max-width: calc(100vw - 16px) !important;
            overflow-x: auto !important;
          }
        }
      `}</style>
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
          paddingTop: 20,
          marginTop: 8,
        }}
      >
        {/* Section title */}
        <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
          <ClockCircleOutlined style={{ color: 'var(--color-accent)', fontSize: 16, flexShrink: 0 }} />
          <Text style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
            {t('scheduleSectionTitle', 'Schedule')}
          </Text>
        </Flex>
        <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 18 }}>
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
                style={{ marginBottom: 14, borderRadius: 8 }}
                message={t('timingValidationError', 'Please fix the following:')}
                description={
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                    {validationErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {/* 1. When should qualification open? */}
            <Form.Item
              label={
                <Text strong style={{ fontSize: 13 }}>
                  {t('whenQualOpen', 'When should qualification open?')}
                </Text>
              }
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
                <Radio value="now" style={{ fontSize: 13 }}>
                  {t('qualOpenNow', 'Open qualification now')}
                </Radio>
                <Radio value="later" style={{ fontSize: 13 }}>
                  {t('qualOpenLater', 'Schedule qualification for later')}
                </Radio>
              </Radio.Group>

              {state.qualificationOpenMode === 'later' && (
                <div style={{ width: '100%', marginTop: 10 }}>
                  <MobileDateTimePicker
                    value={state.scheduledQualificationStart}
                    onChange={(val) => patch({ scheduledQualificationStart: val })}
                    placeholder={t('scheduledQualStartPlaceholder', 'Pick a date and time')}
                    disabledDate={disabledDate}
                    isMobile={isMobile}
                    label={t('whenQualOpen', 'When should qualification open?')}
                  />
                </div>
              )}
            </Form.Item>

            {/* 2. Qualification phase lasts */}
            <Form.Item
              label={
                <Text strong style={{ fontSize: 13 }}>
                  {t('qualDurationLabel', 'Qualification phase lasts')}
                </Text>
              }
            >
              <PresetButtons
                options={QUAL_DURATION_OPTIONS}
                value={state.qualificationDurationPreset}
                onChange={(v) => patch({ qualificationDurationPreset: v })}
                customLabel={t('durationCustom', 'Custom…')}
              />
              {state.qualificationDurationPreset === 'custom' && (
                <CustomDurationPicker
                  value={state.qualificationDurationCustom}
                  onChange={(v) => patch({ qualificationDurationCustom: v })}
                  placeholder="60"
                />
              )}
            </Form.Item>

            {/* 3. Bidding starts after qualification closes */}
            <Form.Item
              label={
                <Text strong style={{ fontSize: 13 }}>
                  {t('biddingGapLabel', 'Bidding starts after qualification closes')}
                </Text>
              }
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
                <CustomDurationPicker
                  value={state.biddingGapCustom}
                  onChange={(v) => patch({ biddingGapCustom: v })}
                  placeholder="60"
                />
              )}
            </Form.Item>

            {/* 4. Auction duration */}
            <Form.Item
              label={
                <Text strong style={{ fontSize: 13 }}>
                  {t('auctionDurationLabel', 'Auction duration')}
                </Text>
              }
            >
              <PresetButtons
                options={AUCTION_DURATION_OPTIONS}
                value={state.auctionDurationPreset}
                onChange={(v) => patch({ auctionDurationPreset: v })}
                customLabel={t('durationCustom', 'Custom…')}
              />
              {state.auctionDurationPreset === 'custom' && (
                <CustomDurationPicker
                  value={state.auctionDurationCustom}
                  onChange={(v) => patch({ auctionDurationCustom: v })}
                  placeholder="1440"
                />
              )}
            </Form.Item>

            {/* 5. Auto-extend */}
            <Form.Item
              label={
                <Text strong style={{ fontSize: 13 }}>
                  {t('autoExtendTitle', 'Auto-extend')}
                </Text>
              }
            >
              <Flex align="flex-start" gap={10} wrap="wrap">
                <Switch
                  checked={isSealed ? false : state.autoExtend}
                  onChange={(val) => patch({ autoExtend: val })}
                  disabled={isSealed}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {isSealed
                    ? t(
                        'autoExtendSealedDisabled',
                        'Auto-extend is not available for sealed auctions.',
                      )
                    : t(
                        'autoExtendDesc',
                        "If someone bids near the end, the auction gets a few extra minutes.",
                      )}
                </Text>
              </Flex>
              {state.autoExtend && (
                <Flex align="center" gap={8} style={{ marginTop: 10 }} wrap="wrap">
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
            style={{ marginBottom: 14, borderRadius: 8 }}
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
                marginBottom: 14,
              }}
            >
              <Text
                strong
                style={{
                  display: 'block',
                  fontSize: 12,
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
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 8,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {formatNaturalSummary(state, derived.qualificationStartAt)}
                </Text>
              )}
              <Flex vertical gap={3}>
                {[
                  {
                    label: t('qualOpens', 'Qualification opens'),
                    value: derived.qualificationStartAt.format(DISPLAY_FORMAT),
                  },
                  {
                    label: t('qualCloses', 'Qualification closes'),
                    value: derived.qualificationEndAt.format(DISPLAY_FORMAT),
                  },
                  {
                    label: t('biddingStarts', 'Bidding starts'),
                    value: derived.startTime.format(DISPLAY_FORMAT),
                  },
                  {
                    label: t('auctionEnds', 'Auction ends'),
                    value: derived.endTime.format(DISPLAY_FORMAT),
                  },
                  {
                    label: t('autoExtendTitle', 'Auto-extend'),
                    value: state.autoExtend ? t('timing.autoExtendOn', { minutes: state.extensionMinutes, defaultValue: `on (${state.extensionMinutes} min)` }) : t('timing.autoExtendOff', 'off'),
                  },
                ].map(({ label, value }) => (
                  <Text
                    key={label}
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    <strong>{label}:</strong> {value}
                  </Text>
                ))}
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
                  {/* Advanced DatePickers */}
                  {[
                    {
                      name: 'qualificationStartAt',
                      label: t('timing.qualificationStart', 'Qualification Start'),
                      rules: [{ validator: validateAdvancedStart }],
                    },
                    {
                      name: 'qualificationEndAt',
                      label: t('timing.qualificationEnd', 'Qualification End'),
                      rules: [{ validator: validateAdvancedQualEnd }],
                    },
                    {
                      name: 'startTime',
                      label: t('timing.auctionStart', 'Auction Start'),
                      rules: [{ validator: validateAdvancedStart }],
                    },
                    {
                      name: 'endTime',
                      label: t('timing.auctionEnd', 'Auction End'),
                      rules: [{ validator: validateAdvancedAuctionEnd }],
                    },
                  ].map(({ name, label, rules }) => (
                    <Form.Item key={name} name={name} label={label} rules={rules}>
                      <MobileDateTimePicker
                        disabledDate={disabledDate}
                        isMobile={isMobile}
                        label={label}
                        onAfterChange={handleAdvancedFieldChange}
                      />
                    </Form.Item>
                  ))}

                  <Form.Item label={t('extensionMinutesLabel', 'Extend by (minutes)')}>
                    <Flex align="center" gap={10} wrap="wrap">
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
