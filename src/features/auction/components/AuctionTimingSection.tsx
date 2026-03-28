import { Collapse, DatePicker, Form, InputNumber, Switch, Typography, Flex } from 'antd'
import type { FormInstance } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { Text } = Typography

interface AuctionTimingSectionProps {
  form: FormInstance
}

const DATE_FORMAT = 'YYYY-MM-DD HH:mm'
const TIME_FORMAT = 'HH:mm'

function formatDuration(startVal: Dayjs | null | undefined, endVal: Dayjs | null | undefined): string | null {
  if (!startVal || !endVal) return null
  const start = dayjs(startVal)
  const end = dayjs(endVal)
  if (!end.isAfter(start)) return null
  const totalMinutes = end.diff(start, 'minute')
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days} days`)
  if (hours > 0) parts.push(`${hours} hours`)
  return parts.length > 0 ? parts.join(' ') : '< 1 hour'
}

function disabledDate(current: Dayjs): boolean {
  return current && current.isBefore(dayjs().startOf('day'))
}

export function AuctionTimingSection({ form }: AuctionTimingSectionProps) {
  const { t } = useTranslation('auction')

  const qualificationStartAt = Form.useWatch('qualificationStartAt', form)
  const qualificationEndAt = Form.useWatch('qualificationEndAt', form)
  const startTime = Form.useWatch('startTime', form)
  const endTime = Form.useWatch('endTime', form)
  const autoExtend = Form.useWatch('autoExtend', form)

  const qualificationDuration = formatDuration(qualificationStartAt, qualificationEndAt)
  const auctionDuration = formatDuration(startTime, endTime)

  const allOrNoneValidator = (_: unknown, value: Dayjs | null | undefined) => {
    const fields = [
      form.getFieldValue('qualificationStartAt'),
      form.getFieldValue('qualificationEndAt'),
      form.getFieldValue('startTime'),
      form.getFieldValue('endTime'),
    ]
    const setCount = fields.filter(Boolean).length
    if (setCount > 0 && setCount < 4 && !value) {
      return Promise.reject(
        new Error(t('timing.allRequired', 'All timing fields are required when any is set')),
      )
    }
    return Promise.resolve()
  }

  return (
    <Collapse
      defaultActiveKey={[]}
      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}
      items={[
        {
          key: 'timing',
          label: (
            <Flex align="center" gap={8}>
              <ClockCircleOutlined style={{ color: 'var(--color-accent)' }} />
              <Text style={{ fontWeight: 600 }}>
                {t('timing.header', 'Auction Timing (Optional)')}
              </Text>
            </Flex>
          ),
          children: (
            <div>
              {/* Qualification Start */}
              <Form.Item
                name="qualificationStartAt"
                label={t('timing.qualificationStart', 'Qualification Start')}
                rules={[
                  { validator: allOrNoneValidator },
                  {
                    validator: (_, value) => {
                      if (value && dayjs(value).isBefore(dayjs())) {
                        return Promise.reject(
                          new Error(t('timing.mustBeFuture', 'Must be in the future')),
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <DatePicker
                  format={DATE_FORMAT}
                  showTime={{ format: TIME_FORMAT }}
                  disabledDate={disabledDate}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {/* Qualification End */}
              <Form.Item
                name="qualificationEndAt"
                label={t('timing.qualificationEnd', 'Qualification End')}
                rules={[
                  { validator: allOrNoneValidator },
                  {
                    validator: (_, value) => {
                      const qStart = form.getFieldValue('qualificationStartAt')
                      if (value && qStart && !dayjs(value).isAfter(dayjs(qStart))) {
                        return Promise.reject(
                          new Error(t('timing.mustBeAfterQualStart', 'Must be after Qualification Start')),
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <DatePicker
                  format={DATE_FORMAT}
                  showTime={{ format: TIME_FORMAT }}
                  disabledDate={disabledDate}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {qualificationDuration && (
                <Text style={{ display: 'block', marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {t('timing.qualificationPeriod', 'Qualification period')}: {qualificationDuration}
                </Text>
              )}

              {/* Auction Start */}
              <Form.Item
                name="startTime"
                label={t('timing.auctionStart', 'Auction Start')}
                rules={[
                  { validator: allOrNoneValidator },
                  {
                    validator: (_, value) => {
                      const qEnd = form.getFieldValue('qualificationEndAt')
                      if (value && qEnd && !dayjs(value).isAfter(dayjs(qEnd))) {
                        return Promise.reject(
                          new Error(t('timing.mustBeAfterQualEnd', 'Must be after Qualification End')),
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <DatePicker
                  format={DATE_FORMAT}
                  showTime={{ format: TIME_FORMAT }}
                  disabledDate={disabledDate}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {/* Auction End */}
              <Form.Item
                name="endTime"
                label={t('timing.auctionEnd', 'Auction End')}
                rules={[
                  { validator: allOrNoneValidator },
                  {
                    validator: (_, value) => {
                      const aStart = form.getFieldValue('startTime')
                      if (value && aStart && !dayjs(value).isAfter(dayjs(aStart))) {
                        return Promise.reject(
                          new Error(t('timing.mustBeAfterAuctionStart', 'Must be after Auction Start')),
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <DatePicker
                  format={DATE_FORMAT}
                  showTime={{ format: TIME_FORMAT }}
                  disabledDate={disabledDate}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {auctionDuration && (
                <Text style={{ display: 'block', marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {t('timing.auctionPeriod', 'Auction period')}: {auctionDuration}
                </Text>
              )}

              {/* Auto-extend section */}
              <div
                style={{
                  borderTop: '1px solid var(--color-border-light)',
                  paddingTop: 16,
                  marginTop: 8,
                }}
              >
                <Form.Item
                  name="autoExtend"
                  valuePropName="checked"
                  style={{ marginBottom: autoExtend ? 12 : 0 }}
                >
                  <Flex align="center" gap={10}>
                    <Switch checked={autoExtend} onChange={(val) => form.setFieldValue('autoExtend', val)} />
                    <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                      {t('timing.autoExtend', 'Auto-extend on late bids')}
                    </Text>
                  </Flex>
                </Form.Item>

                {autoExtend && (
                  <Form.Item
                    name="extensionMinutes"
                    label={t('timing.extensionMinutes', 'Extension (minutes)')}
                    initialValue={5}
                  >
                    <InputNumber min={1} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                )}
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}
