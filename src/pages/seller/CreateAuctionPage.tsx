/**
 * CreateAuctionPage — Seller flow: select item → configure auction → publish.
 *
 * 4-step wizard:
 * 0. Select an active item (not already in auction)
 * 1. Configure auction settings (prices, timing, anti-sniping)
 * 2. Review all settings before submission
 * 3. Done — option to publish immediately
 *
 * Requires seller role — shows "Become a Seller" prompt for non-sellers.
 * BE contract: POST /api/auctions (creates Draft), POST /api/auctions/{id}/publish (Draft → Pending).
 */

import { useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Button,
  Steps,
  Flex,
  Image,
  Tag,
  Alert,
  Result,
  Descriptions,
  Radio,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useAppSelector } from '@/app/hooks';
import { useMyItems, useCreateAuction, usePublishAuction } from '@/hooks/useSellerManagement';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';
import type { SellerItem } from '@/types/item';

const { Title, Text } = Typography;

/** Form values for step 1 (auction settings) */
interface AuctionFormValues {
  startingPrice: number;
  bidIncrement: number;
  startTime: Dayjs;
  endTime: Dayjs;
  reservePrice?: number;
  buyNowPrice?: number;
  autoExtend: boolean;
  extensionMinutes: number;
}

export function CreateAuctionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { itemId: routeItemId } = useParams<{ itemId?: string }>();
  const { isMobile } = useBreakpoint();
  const user = useAppSelector((state) => state.auth.user);
  const [form] = Form.useForm<AuctionFormValues>();

  const { data: items = [], isLoading: itemsLoading } = useMyItems();
  const createAuction = useCreateAuction();
  const publishAuction = usePublishAuction();

  // ─── State ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(routeItemId ? 1 : 0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(routeItemId ?? null);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  // Filter items: only active items that are not already in an auction
  const availableItems = useMemo(
    () => items.filter((item) => item.status === 'active'),
    [items],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  // ─── Seller role check ──────────────────────────────────────────
  if (!user?.hasSellerPermission) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
        <Result
          icon={<ShopOutlined />}
          title={t('createAuction.sellerRequired')}
          subTitle={t('createAuction.sellerRequiredHint')}
          extra={
            <Button type="primary" onClick={() => navigate('/profile')}>
              {t('createAuction.goToProfile')}
            </Button>
          }
        />
      </div>
    );
  }

  // ─── Submit: Create Auction ─────────────────────────────────────
  const handleCreate = async () => {
    if (!selectedItemId) return;

    try {
      const values = await form.validateFields();
      const result = await createAuction.mutateAsync({
        itemId: selectedItemId,
        startingPrice: values.startingPrice,
        bidIncrement: values.bidIncrement,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        reservePrice: values.reservePrice || undefined,
        buyNowPrice: values.buyNowPrice || undefined,
        autoExtend: values.autoExtend,
        extensionMinutes: values.extensionMinutes,
        currency: 'VND',
      });

      setCreatedAuctionId(result.id);
      setCurrentStep(3);
      message.success(t('createAuction.createSuccess'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('common.error');
      message.error(errorMsg);
    }
  };

  // ─── Publish after creation ─────────────────────────────────────
  const handlePublish = async () => {
    if (!createdAuctionId) return;
    try {
      await publishAuction.mutateAsync(createdAuctionId);
      setPublished(true);
      message.success(t('createAuction.publishSuccess'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('common.error');
      message.error(errorMsg);
    }
  };

  // ─── Validation helpers ─────────────────────────────────────────
  const disablePassedDates = (current: Dayjs) => current && current.isBefore(dayjs(), 'minute');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
      <Title level={3}>{t('createAuction.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('createAuction.subtitle')}
      </Text>

      <Steps
        current={currentStep}
        size={isMobile ? 'small' : 'default'}
        style={{ marginBottom: 24 }}
        items={[
          { title: t('createAuction.stepSelectItem') },
          { title: t('createAuction.stepSettings') },
          { title: t('createAuction.stepReview') },
          { title: t('createAuction.stepDone') },
        ]}
      />

      {/* ─── Step 0: Select Item ──────────────────────────────── */}
      {currentStep === 0 && (
        <Card>
          <Title level={5}>{t('createAuction.selectItemTitle')}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('createAuction.selectItemHint')}
          </Text>

          {itemsLoading ? (
            <Flex justify="center" style={{ padding: 48 }}>
              <Spin />
            </Flex>
          ) : availableItems.length === 0 ? (
            <Empty
              description={t('createAuction.noAvailableItems')}
              style={{ padding: 24 }}
            >
              <Button type="primary" onClick={() => navigate('/create-item')}>
                {t('createAuction.createItemFirst')}
              </Button>
            </Empty>
          ) : (
            <Radio.Group
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{ width: '100%' }}
            >
              <Flex vertical gap={12}>
                {availableItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    t={t}
                  />
                ))}
              </Flex>
            </Radio.Group>
          )}

          <Flex justify="flex-end" style={{ marginTop: 24 }}>
            <Button
              type="primary"
              onClick={() => setCurrentStep(1)}
              disabled={!selectedItemId}
            >
              {t('common.next')}
            </Button>
          </Flex>
        </Card>
      )}

      {/* ─── Step 1: Auction Settings ─────────────────────────── */}
      {currentStep === 1 && (
        <Card>
          {selectedItem && (
            <Alert
              type="info"
              showIcon
              message={`${t('createAuction.selectedItem')}: ${selectedItem.title}`}
              style={{ marginBottom: 16 }}
            />
          )}

          <Title level={5}>{t('createAuction.settingsTitle')}</Title>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              autoExtend: true,
              extensionMinutes: 5,
              bidIncrement: 100_000,
            }}
          >
            {/* Pricing */}
            <Form.Item
              name="startingPrice"
              label={t('createAuction.startingPrice')}
              rules={[
                { required: true, message: t('createAuction.startingPriceRequired') },
                { type: 'number', min: 1000, message: t('createAuction.priceMinimum') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/\./g, '') ?? 0) as unknown as 0}
                addonAfter="VND"
                placeholder="VD: 1.000.000"
              />
            </Form.Item>

            <Form.Item
              name="bidIncrement"
              label={t('createAuction.bidIncrement')}
              rules={[
                { required: true, message: t('createAuction.bidIncrementRequired') },
                { type: 'number', min: 1000, message: t('createAuction.priceMinimum') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={50_000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/\./g, '') ?? 0) as unknown as 0}
                addonAfter="VND"
                placeholder="VD: 100.000"
              />
            </Form.Item>

            <Form.Item
              name="reservePrice"
              label={t('createAuction.reservePrice')}
              tooltip={t('createAuction.reservePriceHint')}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const starting = getFieldValue('startingPrice') as number;
                    if (starting && value < starting) {
                      return Promise.reject(t('createAuction.reservePriceTooLow'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/\./g, '') ?? 0) as unknown as 0}
                addonAfter="VND"
                placeholder={t('createAuction.optional')}
              />
            </Form.Item>

            <Form.Item
              name="buyNowPrice"
              label={t('createAuction.buyNowPrice')}
              tooltip={t('createAuction.buyNowPriceHint')}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const starting = getFieldValue('startingPrice') as number;
                    if (starting && value < starting) {
                      return Promise.reject(t('createAuction.buyNowPriceTooLow'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/\./g, '') ?? 0) as unknown as 0}
                addonAfter="VND"
                placeholder={t('createAuction.optional')}
              />
            </Form.Item>

            {/* Timing */}
            <Form.Item
              name="startTime"
              label={t('createAuction.startTime')}
              rules={[{ required: true, message: t('createAuction.startTimeRequired') }]}
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
                    const startTime = getFieldValue('startTime') as Dayjs | undefined;
                    if (startTime && value.isBefore(startTime)) {
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

            {/* Anti-sniping */}
            <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
              <Form.Item
                name="autoExtend"
                valuePropName="checked"
                style={{ margin: 0 }}
              >
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
          </Form>

          <Flex justify="space-between" style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  await form.validateFields();
                  setCurrentStep(2);
                } catch {
                  // Validation errors shown by form
                }
              }}
            >
              {t('common.next')}
            </Button>
          </Flex>
        </Card>
      )}

      {/* ─── Step 2: Review & Confirm ─────────────────────────── */}
      {currentStep === 2 && (
        <Card>
          <Title level={5}>{t('createAuction.reviewTitle')}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('createAuction.reviewHint')}
          </Text>

          <Descriptions
            bordered
            column={1}
            size={isMobile ? 'small' : 'middle'}
          >
            <Descriptions.Item label={t('createAuction.selectedItem')}>
              {selectedItem?.title ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('createAuction.startingPrice')}>
              {formatVND(form.getFieldValue('startingPrice') ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label={t('createAuction.bidIncrement')}>
              {formatVND(form.getFieldValue('bidIncrement') ?? 0)}
            </Descriptions.Item>
            {form.getFieldValue('reservePrice') && (
              <Descriptions.Item label={t('createAuction.reservePrice')}>
                {formatVND(form.getFieldValue('reservePrice'))}
              </Descriptions.Item>
            )}
            {form.getFieldValue('buyNowPrice') && (
              <Descriptions.Item label={t('createAuction.buyNowPrice')}>
                {formatVND(form.getFieldValue('buyNowPrice'))}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('createAuction.startTime')}>
              {(form.getFieldValue('startTime') as Dayjs)?.format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('createAuction.endTime')}>
              {(form.getFieldValue('endTime') as Dayjs)?.format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('createAuction.autoExtend')}>
              {form.getFieldValue('autoExtend')
                ? `${t('common.yes')} — ${form.getFieldValue('extensionMinutes')} ${t('createAuction.minutes')}`
                : t('common.no')}
            </Descriptions.Item>
          </Descriptions>

          <Flex justify="space-between" style={{ marginTop: 24 }}>
            <Button onClick={() => setCurrentStep(1)}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              onClick={handleCreate}
              loading={createAuction.isPending}
            >
              {t('createAuction.createButton')}
            </Button>
          </Flex>
        </Card>
      )}

      {/* ─── Step 3: Done ─────────────────────────────────────── */}
      {currentStep === 3 && (
        <Card>
          <Flex vertical align="center" gap={16} style={{ padding: 24 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ margin: 0 }}>
              {t('createAuction.doneTitle')}
            </Title>

            {published ? (
              <Alert
                type="success"
                showIcon
                message={t('createAuction.publishedMessage')}
              />
            ) : (
              <Alert
                type="info"
                showIcon
                message={t('createAuction.draftMessage')}
                description={t('createAuction.draftMessageHint')}
              />
            )}

            <Flex gap={12} wrap="wrap" justify="center">
              {!published && (
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={handlePublish}
                  loading={publishAuction.isPending}
                >
                  {t('createAuction.publishNow')}
                </Button>
              )}
              {createdAuctionId && (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/auction/${createdAuctionId}`)}
                >
                  {t('createAuction.viewAuction')}
                </Button>
              )}
              <Button onClick={() => navigate('/my-listings')}>
                {t('createAuction.goToListings')}
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(0);
                  setSelectedItemId(null);
                  setCreatedAuctionId(null);
                  setPublished(false);
                  form.resetFields();
                }}
              >
                {t('createAuction.createAnother')}
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </div>
  );
}

// ─── Item Selection Card (internal component) ────────────────────────

function ItemCard({
  item,
  selected,
  t,
}: {
  item: SellerItem;
  selected: boolean;
  t: (key: string) => string;
}) {
  return (
    <Radio value={item.id} style={{ width: '100%' }}>
      <Card
        size="small"
        hoverable
        style={{
          borderColor: selected ? '#1677ff' : undefined,
          borderWidth: selected ? 2 : 1,
        }}
      >
        <Flex gap={12} align="center">
          <Image
            src={item.primaryImageUrl || '/placeholder-item.svg'}
            width={64}
            height={64}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
            fallback="/placeholder-item.svg"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong ellipsis>
              {item.title}
            </Text>
            <br />
            <Flex gap={4}>
              <Tag color="green">{t(`auction.condition${capitalize(item.condition)}`)}</Tag>
              {item.quantity > 1 && (
                <Tag>x{item.quantity}</Tag>
              )}
            </Flex>
          </div>
        </Flex>
      </Card>
    </Radio>
  );
}

/** Capitalize first letter (new → New, like_new → LikeNew) */
function capitalize(str: string): string {
  return str
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
