/**
 * AuctionTimingModal — Sets auction schedule on an Approved auction.
 *
 * Matches Figma "Thiết lập lịch đấu giá" view.
 * Shown when seller clicks "Set Timing" on an approved auction
 * in MyListingsPage.
 *
 * Auto-calculates qualification window:
 *   qualificationStart = startTime - 29 min (1-min buffer)
 *   qualificationEnd = startTime - 1 min
 *
 * On success: PUT /api/auctions/{id}/timing → Approved → Scheduled
 */

import { useState, useMemo } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Switch,
  InputNumber,
  Flex,
  Typography,
  Statistic,
  message,
} from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useSetAuctionTiming } from '@/hooks/useSellerManagement';

const { Text } = Typography;

interface AuctionTimingModalProps {
  open: boolean;
  auctionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TimingFormValues {
  startTime: Dayjs;
  endTime: Dayjs;
  autoExtend: boolean;
  extensionMinutes: number;
}

export function AuctionTimingModal({
  open,
  auctionId,
  onClose,
  onSuccess,
}: AuctionTimingModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TimingFormValues>();
  const setTiming = useSetAuctionTiming();
  const [submitting, setSubmitting] = useState(false);

  // Watch form values for duration preview
  const startTime = Form.useWatch('startTime', form);
  const endTime = Form.useWatch('endTime', form);

  const duration = useMemo(() => {
    if (!startTime || !endTime || !endTime.isAfter(startTime)) return null;
    const diffMs = endTime.diff(startTime);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  }, [startTime, endTime]);

  const disablePassedDates = (current: Dayjs) =>
    current && current.isBefore(dayjs(), 'day');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Auto-calculate qualification window
      const qualStart = values.startTime.subtract(29, 'minute');
      const qualEnd = values.startTime.subtract(1, 'minute');

      await setTiming.mutateAsync({
        auctionId,
        timing: {
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString(),
          qualificationStartAt: qualStart.toISOString(),
          qualificationEndAt: qualEnd.toISOString(),
          autoExtend: values.autoExtend,
          extensionMinutes: values.extensionMinutes,
        },
      });

      message.success(t('myListings.timingSuccess'));
      form.resetFields();
      onSuccess();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.response?.data?.title ?? t('common.error'))
        : t('common.error');
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <Flex gap={8} align="center">
          <CalendarOutlined />
          {t('myListings.timingTitle')}
        </Flex>
      }
      okText={t('myListings.confirmTiming')}
      cancelText={t('common.cancel')}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoExtend: true,
          extensionMinutes: 5,
        }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="startTime"
          label={t('createAuction.startTime')}
          rules={[
            { required: true, message: t('createAuction.startTimeRequired') },
            () => ({
              validator(_, value) {
                if (!value) return Promise.resolve();
                const minTime = dayjs().add(30, 'minute');
                if (value.isBefore(minTime)) {
                  return Promise.reject(t('createAuction.startTimeTooSoon'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            disabledDate={disablePassedDates}
            placeholder={t('createAuction.selectDateTime')}
          />
        </Form.Item>

        <Form.Item
          name="endTime"
          label={t('createAuction.endTime')}
          rules={[
            { required: true, message: t('createAuction.endTimeRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value) return Promise.resolve();
                const start = getFieldValue('startTime') as Dayjs | undefined;
                if (start && value.isBefore(start)) {
                  return Promise.reject(t('createAuction.endTimeBeforeStart'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            disabledDate={disablePassedDates}
            placeholder={t('createAuction.selectDateTime')}
          />
        </Form.Item>

        {/* Duration preview */}
        {duration && (
          <Flex gap={16} style={{ marginBottom: 16 }}>
            <Statistic
              title={t('myListings.durationPreview')}
              value={`${duration.days} ${t('common.days')} ${duration.hours} ${t('common.hours')} ${duration.minutes} ${t('createAuction.minutes')}`}
            />
          </Flex>
        )}

        {/* Anti-sniping */}
        <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
          <Form.Item name="autoExtend" valuePropName="checked" style={{ margin: 0 }}>
            <Switch />
          </Form.Item>
          <div>
            <Text strong>{t('createAuction.autoExtend')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('createAuction.autoExtendHint')}
            </Text>
          </div>
        </Flex>

        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.autoExtend !== cur.autoExtend}
        >
          {({ getFieldValue }) =>
            getFieldValue('autoExtend') ? (
              <Form.Item
                name="extensionMinutes"
                label={t('createAuction.extensionMinutes')}
                rules={[
                  { required: true, message: t('createAuction.extensionMinutesRequired') },
                  { type: 'number', min: 1, max: 30, message: t('createAuction.extensionMinutesRange') },
                ]}
              >
                <InputNumber
                  min={1}
                  max={30}
                  style={{ width: 200 }}
                  addonAfter={t('createAuction.minutes')}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('myListings.timingNote')}
        </Text>
      </Form>
    </Modal>
  );
}
